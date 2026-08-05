import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { RapierRigidBody } from '@react-three/rapier';
import gsap from 'gsap';
import { sphereGeometry, getBallMaterial } from './Ball';
import Lights from './Lights';
import Environment from './Environment';
import PoolTable from './PoolTable';
import { CameraController, CueController, PowerMeter } from './cue';
import Balls from './Balls';
import { PhysicsWorld, TablePhysics, PocketSensor } from './physics';
import { PhysicsConstants } from './physics/PhysicsConstants';
import { GameManager, MatchState, INITIAL_MATCH_STATE } from './rules';
import { collisionManager } from './physics/CollisionManager';
import socketService from '../socket/socket';
import { audioManager } from '../audio';
import { useParticles, Trail, Confetti, PocketEffect } from '../effects';
import GameLoader from '../components/GameLoader';
import LandscapePrompt from '../components/LandscapePrompt';
import MobileControlsOverlay from '../components/MobileControlsOverlay';
import useSettingsStore from '../store/useSettingsStore';
import { BALL_COLORS } from '../utils/ballTexture';

interface PocketingBallProps {
  ballId: number;
  startPosition: [number, number, number];
  pocketPosition: [number, number, number];
  onComplete: () => void;
}

const PocketingBall: React.FC<PocketingBallProps> = ({ ballId, startPosition, pocketPosition, onComplete }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (meshRef.current) {
      // Smoothly animate the position to the center of the pocket and down
      gsap.to(meshRef.current.position, {
        x: pocketPosition[0],
        z: pocketPosition[2],
        y: startPosition[1] - 0.45,
        duration: 0.45,
        ease: 'power2.inOut',
      });
      // Shrink the ball to 0
      gsap.to(meshRef.current.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.45,
        ease: 'power2.in',
        onComplete,
      });
    }
  }, [startPosition, pocketPosition, onComplete]);

  const ballMaterial = getBallMaterial(ballId);

  return (
    <mesh
      ref={meshRef}
      position={startPosition}
      geometry={sphereGeometry}
      material={ballMaterial}
      castShadow
      receiveShadow
    />
  );
};

// Sub-component to monitor ball movement and reset turns on each physics frame
const TurnController: React.FC<{
  cueBallRef: React.RefObject<RapierRigidBody | null>;
  ballRefs: React.MutableRefObject<Map<number, RapierRigidBody>>;
  turnState: 'idle' | 'aiming' | 'charging' | 'shooting' | 'balls-moving';
  setTurnState: (state: 'idle' | 'aiming' | 'charging' | 'shooting' | 'balls-moving') => void;
  cueBallScratched: boolean;
  respawnCueBall: () => void;
  gameManager: GameManager;
  activeBalls: number[];
}> = ({ cueBallRef, ballRefs, turnState, setTurnState, cueBallScratched, respawnCueBall, gameManager, activeBalls }) => {
  useFrame(() => {
    if (turnState !== 'balls-moving') return;

    let anyBallMoving = false;

    // Check cue ball linear/angular velocity and sleeping state
    if (cueBallRef.current && cueBallRef.current.isValid()) {
      const body = cueBallRef.current;
      const v = body.linvel();
      const speed = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
      const av = body.angvel();
      const spin = Math.sqrt(av.x * av.x + av.y * av.y + av.z * av.z);
      if (!body.isSleeping() && (speed > PhysicsConstants.SLEEP_LINEAR_THRESHOLD || spin > PhysicsConstants.SLEEP_ANGULAR_THRESHOLD)) {
        anyBallMoving = true;
      }
    }

    // Check object balls linear/angular velocity and sleeping state
    if (!anyBallMoving) {
      for (const body of ballRefs.current.values()) {
        if (body && body.isValid()) {
          const v = body.linvel();
          const speed = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
          const av = body.angvel();
          const spin = Math.sqrt(av.x * av.x + av.y * av.y + av.z * av.z);
          if (!body.isSleeping() && (speed > PhysicsConstants.SLEEP_LINEAR_THRESHOLD || spin > PhysicsConstants.SLEEP_ANGULAR_THRESHOLD)) {
            anyBallMoving = true;
            break;
          }
        }
      }
    }

    // When all balls stop rolling, conclude the turn
    if (!anyBallMoving) {
      const nextState = gameManager.endShotSimulation(activeBalls, cueBallScratched);
      if (nextState.status !== 'game-over') {
        if (cueBallScratched) {
          respawnCueBall();
        } else {
          setTurnState('idle');
        }
      }
    }
  });

  return null;
};

// Constrains balls to the 2D table plane (XZ) and enforces custom sleeping velocity thresholds
const PhysicsConstraintController: React.FC<{
  cueBallRef: React.RefObject<RapierRigidBody | null>;
  ballRefs: React.MutableRefObject<Map<number, RapierRigidBody>>;
}> = ({ cueBallRef, ballRefs }) => {
  useFrame(() => {
    // Cue Ball constraints and manual sleeping threshold (only if not pocketed/scratched, i.e., Y > -2)
    if (cueBallRef.current && cueBallRef.current.isValid()) {
      try {
        const body = cueBallRef.current;
        const pos = body.translation();
        if (pos.y > -2) {
          const vel = body.linvel();
          const angvel = body.angvel();
          const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
          const spinSpeed = Math.sqrt(angvel.x * angvel.x + angvel.y * angvel.y + angvel.z * angvel.z);

          if (speed < PhysicsConstants.SLEEP_LINEAR_THRESHOLD && spinSpeed < PhysicsConstants.SLEEP_ANGULAR_THRESHOLD) {
            if (!body.isSleeping()) {
              body.setLinvel({ x: 0, y: 0, z: 0 }, true);
              body.setAngvel({ x: 0, y: 0, z: 0 }, true);
              body.sleep();
            }
          } else if (Math.abs(pos.y - 0.28) > 0.15) {
            body.setTranslation({ x: pos.x, y: 0.28, z: pos.z }, true);
            body.setLinvel({ x: vel.x, y: 0, z: vel.z }, true);
          }
        }
      } catch (e) {
        // Safe guard
      }
    }

    // Object Balls constraints and manual sleeping threshold
    for (const body of ballRefs.current.values()) {
      if (body && body.isValid()) {
        try {
          const pos = body.translation();
          const vel = body.linvel();
          const angvel = body.angvel();
          const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
          const spinSpeed = Math.sqrt(angvel.x * angvel.x + angvel.y * angvel.y + angvel.z * angvel.z);

          if (speed < PhysicsConstants.SLEEP_LINEAR_THRESHOLD && spinSpeed < PhysicsConstants.SLEEP_ANGULAR_THRESHOLD) {
            if (!body.isSleeping()) {
              body.setLinvel({ x: 0, y: 0, z: 0 }, true);
              body.setAngvel({ x: 0, y: 0, z: 0 }, true);
              body.sleep();
            }
          } else if (Math.abs(pos.y - 0.28) > 0.15) {
            body.setTranslation({ x: pos.x, y: 0.28, z: pos.z }, true);
            body.setLinvel({ x: vel.x, y: 0, z: vel.z }, true);
          }
        } catch (e) {
          // Safe guard
        }
      }
    }
  });

  return null;
};

// HUD Colors mapped for remaining balls indicator
const HUD_BALL_COLORS: Record<number, string> = BALL_COLORS;

const FpsLimiter: React.FC = () => {
  const fpsLimit = useSettingsStore((state) => state.settings.fpsLimit);
  const lastTime = useRef(0);

  useFrame(({ gl, scene, camera }) => {
    if (fpsLimit === 'unlimited') {
      gl.render(scene, camera);
      return;
    }

    const limit = fpsLimit === '30' ? 30 : 60;
    const interval = 1000 / limit;
    const now = performance.now();
    const delta = now - lastTime.current;

    if (delta >= interval) {
      gl.render(scene, camera);
      lastTime.current = now - (delta % interval);
    }
  }, 1);

  return null;
};

export const Scene: React.FC<{ roomId?: string; isHost?: boolean; isPractice?: boolean; isSpectator?: boolean }> = ({ roomId, isHost, isPractice, isSpectator }) => {
  const graphicsQuality = useSettingsStore((state) => state.settings.graphicsQuality);
  const [activeBalls, setActiveBalls] = useState<number[]>([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
  ]);
  const [turnState, setTurnState] = useState<'idle' | 'aiming' | 'charging' | 'shooting' | 'balls-moving'>('idle');
  const [power, setPower] = useState<number>(0);
  const [cueBallScratched, setCueBallScratched] = useState<boolean>(false);
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [isPowerDragging, setIsPowerDragging] = useState(false);
  const powerTrackRef = useRef<HTMLDivElement>(null);
  const [pocketingAnims, setPocketingAnims] = useState<Array<{
    id: string;
    ballId: number;
    startPosition: [number, number, number];
    pocketPosition: [number, number, number];
  }>>([]);

  const handleAnimComplete = (animId: string) => {
    setPocketingAnims((prev) => prev.filter((a) => a.id !== animId));
  };

  const updatePowerFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const track = powerTrackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const pct = 1 - Math.min(Math.max(relativeY / rect.height, 0), 1);
    const newPower = Math.round(pct * 100);
    setPower(newPower);
    if (newPower > 0) {
      if (turnState === 'idle' || turnState === 'aiming') {
        setTurnState('charging');
      }
    } else {
      if (turnState === 'charging') {
        setTurnState('idle');
      }
    }
  };

  const handlePowerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only allow left-click to drag power slider
    e.preventDefault();
    setIsPowerDragging(true);
    updatePowerFromPointer(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePowerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPowerDragging) {
      e.preventDefault();
      updatePowerFromPointer(e);
    }
  };

  const handlePowerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsPowerDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleStrike = () => {
    if (power >= 5 && (turnState === 'idle' || turnState === 'aiming' || turnState === 'charging')) {
      setTurnState('shooting');
    }
  };

  const cueBallRef = useRef<RapierRigidBody | null>(null);
  const ballRefs = useRef<Map<number, RapierRigidBody>>(new Map());

  const { bursts, confettiActive, triggerPocketBurst, triggerConfetti, clearBurst } = useParticles();

  const gameManagerRef = useRef<GameManager>(new GameManager({
    ...INITIAL_MATCH_STATE,
    status: 'break',
    isPractice: isPractice
  }));
  // eslint-disable-next-line react-hooks/refs
  const [matchState, setMatchState] = useState<MatchState>(gameManagerRef.current.getState());

  const lastFoulRef = useRef(false);
  const lastStatusRef = useRef<string>('');

  useEffect(() => {
    const gm = gameManagerRef.current;
    gm.onStateChange = (nextState) => {
      // Play foul sound
      if (nextState.foulOccurred && !lastFoulRef.current) {
        audioManager.playFoul();
      }
      lastFoulRef.current = nextState.foulOccurred;

      // Play win/loss sound on game over
      if (nextState.status === 'game-over' && lastStatusRef.current !== 'game-over') {
        const localUserWon = !roomId || 
          (isHost && nextState.winner === 'host') || 
          (!isHost && nextState.winner === 'guest');
        if (localUserWon) {
          audioManager.playWin();
          audioManager.startMusic('victory');
          triggerConfetti(true);
        } else {
          audioManager.playLoss();
          audioManager.startMusic('game-over');
        }
      }
      lastStatusRef.current = nextState.status;

      setMatchState(nextState);
    };

    // Connect Rapier physics collisions to GameManager rule metrics
    collisionManager.onCollisionEvent = (ballId1, ballId2) => {
      if (ballId2 === 'cushion') {
        gm.recordCushionCollision(ballId1);
        audioManager.playCushion(1.0);
      } else {
        gm.recordBallCollision(ballId1, ballId2);
        audioManager.playCollision(1.0);
      }
    };

    return () => {
      collisionManager.onCollisionEvent = undefined;
      gm.onStateChange = undefined;
    };
  }, []);

  // Synchronize and snap coordinate updates from authoritative server state
  useEffect(() => {
    if (isPractice) return;
    const socket = socketService.getSocket();
    if (!socket || !roomId) return;

    const handleStateUpdate = (serverState: MatchState & { balls?: Array<{ id: number; x: number; y: number; z: number; isActive: boolean }> }) => {
      gameManagerRef.current.syncServerState(serverState);

      if (serverState.balls) {
        serverState.balls.forEach((sBall) => {
          const body = ballRefs.current.get(sBall.id);
          if (body && body.isValid()) {
            if (!sBall.isActive) {
              body.setTranslation({ x: 100 + sBall.id, y: -10, z: 100 }, true);
              body.setLinvel({ x: 0, y: 0, z: 0 }, true);
              body.setAngvel({ x: 0, y: 0, z: 0 }, true);
            } else if (turnState === 'idle') {
              body.setTranslation({ x: sBall.x, y: sBall.y, z: sBall.z }, true);
              body.setLinvel({ x: 0, y: 0, z: 0 }, true);
              body.setAngvel({ x: 0, y: 0, z: 0 }, true);
            }
          }
        });
      }
    };

    socket.on('game-state-update', handleStateUpdate);
    return () => {
      socket.off('game-state-update', handleStateUpdate);
    };
  }, [roomId, turnState]);

  // Handle pocket collisions from sensor
  const handleBallPocketed = (ballId: number, pocketId: string) => {
    audioManager.playPocket();

    let ballPosition: [number, number, number] = [0, 0.28, 0];
    const body = ballRefs.current.get(ballId);
    if (body && body.isValid()) {
      try {
        const pos = body.translation();
        ballPosition = [pos.x, 0.28, pos.z];
        triggerPocketBurst(pos.x, 0.28, pos.z, ballId === 0 ? '#ffffff' : HUD_BALL_COLORS[ballId] || '#00f0ff');
      } catch (e) {
        // Safe guard
      }
    }

    const pocket = PhysicsConstants.POCKETS.find((p) => p.id === pocketId);
    const pocketPos: [number, number, number] = pocket 
      ? [pocket.position[0], 0.28, pocket.position[2]] 
      : ballPosition;

    const animId = Math.random().toString(36).substring(2, 9);
    setPocketingAnims((prev) => [
      ...prev,
      {
        id: animId,
        ballId,
        startPosition: ballPosition,
        pocketPosition: pocketPos,
      },
    ]);

    gameManagerRef.current.recordBallPocketed(ballId);

    if (ballId === 0) {
      if (!cueBallScratched) {
        setCueBallScratched(true);
        // Safely move cue ball out of sight & zero velocities
        if (cueBallRef.current && cueBallRef.current.isValid()) {
          try {
            cueBallRef.current.setTranslation({ x: 0, y: -10, z: 0 }, true);
            cueBallRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            cueBallRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
          } catch (e) {
            // Safe guard
          }
        }
      }
    } else {
      // Remove object ball from play list
      setActiveBalls((prev) => prev.filter((id) => id !== ballId));
    }
  };

  // Reset cue ball back to starting spot
  const respawnCueBall = () => {
    if (cueBallRef.current && cueBallRef.current.isValid()) {
      cueBallRef.current.setTranslation(
        { x: PhysicsConstants.CUE_BALL_SPAWN[0], y: PhysicsConstants.CUE_BALL_SPAWN[1], z: PhysicsConstants.CUE_BALL_SPAWN[2] },
        true
      );
      cueBallRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      cueBallRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      setCueBallScratched(false);
      setTurnState('idle');
    }
  };

  // Restart match logic
  const handleRestart = () => {
    setActiveBalls([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    setCueBallScratched(false);
    setTurnState('idle');
    setPower(0);

    gameManagerRef.current.resetGame({
      ...INITIAL_MATCH_STATE,
      status: 'break'
    });
    
    if (cueBallRef.current && cueBallRef.current.isValid()) {
      cueBallRef.current.setTranslation(
        { x: PhysicsConstants.CUE_BALL_SPAWN[0], y: PhysicsConstants.CUE_BALL_SPAWN[1], z: PhysicsConstants.CUE_BALL_SPAWN[2] },
        true
      );
      cueBallRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      cueBallRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
  };

  const handleConfirmPlacement = () => {
    gameManagerRef.current.resetBallInHand();
  };

  const handleToggleBallInHand = () => {
    const gm = gameManagerRef.current;
    const current = gm.getState().ballInHand;
    gm.syncServerState({
      ...gm.getState(),
      ballInHand: !current
    });
  };

  const isGameOver = matchState.status === 'game-over';
  const isLocalTurn = !roomId ||
    (isHost && matchState.activePlayer === 'host') ||
    (!isHost && matchState.activePlayer === 'guest');

  return (
    <div 
      className="w-full aspect-[2/1] bg-slate-950 border-4 border-amber-900 rounded-3xl relative overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]"
      onContextMenu={(e) => e.preventDefault()}
    >
      {!hasEntered && (
        <GameLoader onEnter={() => setHasEntered(true)} />
      )}
      {/* 3D Canvas rendering the environment, physics, and gameplay entities */}
      <Canvas 
        shadows={graphicsQuality !== 'low'}
        dpr={graphicsQuality === 'low' ? 1 : [1, 2]}
        gl={{ antialias: graphicsQuality !== 'low', powerPreference: 'high-performance' }}
      >
        {/* <FpsLimiter /> */}
        <CameraController 
          cueBallRef={cueBallRef} 
          enabled={!matchState.ballInHand && turnState !== 'shooting' && turnState !== 'balls-moving'} 
        />
        <Lights />
        <Environment />
        <PhysicsWorld>
          <PoolTable />
          <TablePhysics />
          <PocketSensor onBallPocketed={handleBallPocketed} />
          <Balls 
            activeBalls={activeBalls} 
            cueBallRef={cueBallRef} 
            ballRefs={ballRefs} 
          />
          <TurnController
            cueBallRef={cueBallRef}
            ballRefs={ballRefs}
            turnState={turnState}
            setTurnState={setTurnState}
            cueBallScratched={cueBallScratched}
            respawnCueBall={respawnCueBall}
            // eslint-disable-next-line react-hooks/refs
            gameManager={gameManagerRef.current}
            activeBalls={activeBalls}
          />
          <PhysicsConstraintController
            cueBallRef={cueBallRef}
            ballRefs={ballRefs}
          />
          <CueController
            cueBallRef={cueBallRef}
            turnState={turnState}
            setTurnState={setTurnState}
            power={power}
            setPower={setPower}
            // eslint-disable-next-line react-hooks/refs
            gameManager={gameManagerRef.current}
            roomId={roomId}
            isHost={isHost}
          />
        </PhysicsWorld>

        {/* 3D Visual Effects Highlights */}
        <Trail targetRef={cueBallRef} />
        <Confetti active={confettiActive} />
        {bursts.map((b) => (
          <PocketEffect
            key={b.id}
            x={b.x}
            y={b.y}
            z={b.z}
            color={b.color}
            onComplete={() => clearBurst(b.id)}
          />
        ))}
        {pocketingAnims.map((anim) => (
          <PocketingBall
            key={anim.id}
            ballId={anim.ballId}
            startPosition={anim.startPosition}
            pocketPosition={anim.pocketPosition}
            onComplete={() => handleAnimComplete(anim.id)}
          />
        ))}
      </Canvas>

      {/* ─── MODERN NEON GLOWING HUD OVERLAYS ─── */}

      {/* 1. Turn State & Active Player Badges */}
      <div className="absolute top-4 left-4 flex gap-2 items-center pointer-events-none select-none">
        {/* Turn State (Aiming, Simulating, etc) */}
        <span className={`px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-full shadow border transition-all duration-300 ${
          turnState === 'idle'
            ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
            : turnState === 'aiming' 
            ? 'bg-pool-cyan/10 text-pool-cyan border-pool-cyan/30 shadow-[0_0_10px_rgba(0,240,255,0.15)] animate-pulse'
            : turnState === 'charging'
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)] animate-pulse'
            : turnState === 'shooting'
            ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        }`}>
          {turnState === 'idle' 
            ? '● IDLE' 
            : turnState === 'aiming' 
            ? '● AIMING' 
            : turnState === 'charging' 
            ? '● CHARGING' 
            : turnState === 'shooting' 
            ? '● STRIKING' 
            : '○ SIMULATING'}
        </span>

        {/* Active Player Indicator */}
        <span className={`px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-full shadow border transition-all duration-300 ${
          isPractice
            ? 'bg-amber-500/15 text-amber-400 border-amber-500/35 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
            : matchState.activePlayer === 'host'
            ? 'bg-pool-cyan/15 text-pool-cyan border-pool-cyan/30 shadow-[0_0_8px_rgba(0,240,255,0.1)]'
            : 'bg-pool-purple/15 text-pool-purple border-pool-purple/30 shadow-[0_0_8px_rgba(147,51,234,0.1)]'
        }`}>
          👤 {isPractice ? 'PRACTICE MODE' : matchState.activePlayer === 'host' ? 'HOST\'S TURN' : 'GUEST\'S TURN'}
        </span>

        {/* Spectator Badge */}
        {isSpectator && (
          <span className="px-3 py-1 text-[10px] font-extrabold tracking-widest uppercase rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.3)] animate-pulse">
            📹 SPECTATING LIVE
          </span>
        )}

        {/* Ball Group Assignments */}
        <span className="px-3 py-1 text-[10px] font-bold text-slate-400 bg-slate-900/60 backdrop-blur border border-white/5 rounded-full">
          HOST: <span className={matchState.hostGroup === 'solids' ? 'text-amber-400 font-extrabold' : matchState.hostGroup === 'stripes' ? 'text-purple-400 font-extrabold' : 'text-slate-500'}>
            {matchState.hostGroup === 'none' ? 'OPEN' : matchState.hostGroup.toUpperCase()}
          </span>
          <span className="mx-1.5 text-white/10">|</span>
          GUEST: <span className={matchState.guestGroup === 'solids' ? 'text-amber-400 font-extrabold' : matchState.guestGroup === 'stripes' ? 'text-purple-400 font-extrabold' : 'text-slate-500'}>
            {matchState.guestGroup === 'none' ? 'OPEN' : matchState.guestGroup.toUpperCase()}
          </span>
        </span>
      </div>

      {/* 2. Foul Notification Banner */}
      {matchState.foulOccurred && (
        <div className="absolute top-16 left-4 bg-rose-500/90 backdrop-blur-md border border-rose-400 rounded-xl px-4 py-2 flex items-center gap-3 text-white font-bold text-xs shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse select-none pointer-events-none">
          <span className="text-sm">⚠️</span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black tracking-wider text-rose-200">FOUL COMMITTED</span>
            <span>{matchState.foulReason || 'Illegal shot'}</span>
          </div>
        </div>
      )}

      {/* 3. Remaining Object Balls Rack */}
      <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2 pointer-events-none select-none shadow-md">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">RACK:</span>
        <div className="flex gap-1">
          {Object.keys(HUD_BALL_COLORS).map((numStr) => {
            const num = parseInt(numStr);
            if (num === 0) return null; // Cue ball is not in the object balls rack
            const isActive = activeBalls.includes(num);
            const color = HUD_BALL_COLORS[num];
            const isStripe = num > 8;

            return (
              <div 
                key={num}
                className={`w-3.5 h-3.5 rounded-full relative flex items-center justify-center text-[7px] font-bold border transition-all duration-300 ${
                  isActive 
                    ? 'border-white/20 opacity-100 scale-100 shadow-[inset_0_1px_3px_rgba(255,255,255,0.3)]' 
                    : 'border-white/5 opacity-25 scale-75 line-through'
                }`}
                style={{
                  backgroundColor: isStripe ? '#ffffff' : color,
                  color: num === 8 || num === 7 ? '#ffffff' : '#000000',
                  boxShadow: isActive ? `0 0 4px ${color}44` : 'none',
                }}
              >
                {/* Visual striping indicator */}
                {isStripe && (
                  <div 
                    className="absolute inset-x-0 h-1/2 top-1/4 pointer-events-none z-0" 
                    style={{ backgroundColor: color }} 
                  />
                )}
                {isStripe ? (
                  <div className="absolute w-2.5 h-2.5 rounded-full bg-white flex items-center justify-center z-10 shadow-[0_0.5px_1px_rgba(0,0,0,0.15)]">
                    <span className="text-[6px] font-black text-black leading-none">{num}</span>
                  </div>
                ) : (
                  <span className="relative z-10 leading-none">{num}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Pullback Drag Power Bar (Hidden for Spectators) */}
      {!isSpectator && (
        <PowerMeter power={power} visible={turnState === 'idle' || turnState === 'aiming' || turnState === 'charging'} />
      )}

      {/* 5. Controls Tip Banner */}
      {matchState.ballInHand ? (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/80 backdrop-blur border border-amber-500/35 rounded-full flex gap-2 text-[10px] font-bold text-amber-300 shadow-md select-none pointer-events-none animate-pulse">
          <span>🎯 Ball in Hand: Left-Click & Drag Cue Ball to place anywhere on the table</span>
        </div>
      ) : (
        (turnState === 'idle' || turnState === 'aiming' || turnState === 'charging') && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/70 backdrop-blur border border-white/5 rounded-full flex gap-3 text-[10px] font-bold text-slate-300 shadow-md select-none pointer-events-none">
            <span>🖱️ Move Mouse to Aim</span>
            <span className="text-white/20">|</span>
            <span>🎛️ Scroll Wheel / W-S / Slider for Power</span>
            <span className="text-white/20">|</span>
            <span>🔄 Right-Click & Drag to Orbit Camera</span>
            {power >= 5 && (
              <>
                <span className="text-white/20">|</span>
                <span className="text-emerald-400 animate-pulse">🚀 Space to Strike!</span>
              </>
            )}
          </div>
        )
      )}

      {/* Vertical Power Slider (Right side of screen, only visible to active local player) */}
      {!isSpectator && (turnState === 'idle' || turnState === 'aiming' || turnState === 'charging') && isLocalTurn && (
        <div className="absolute right-6 top-16 bottom-16 w-14 flex flex-col items-center gap-3 z-30 select-none bg-slate-950/65 backdrop-blur-sm border border-white/5 p-2.5 rounded-2xl">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Power</span>
          
          {/* Vertical Slider Track */}
          <div 
            ref={powerTrackRef}
            onPointerDown={handlePowerPointerDown}
            onPointerMove={handlePowerPointerMove}
            onPointerUp={handlePowerPointerUp}
            className="w-4 bg-slate-900 border border-white/10 rounded-full flex-grow relative overflow-hidden cursor-ns-resize"
          >
            {/* Active filled power track with neon gradient */}
            <div 
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-pool-cyan via-pool-cyan to-rose-500 transition-all duration-75"
              style={{ height: `${power}%` }}
            />
            {/* Sliding Thumb Indicator */}
            <div 
              className="absolute w-full h-1 bg-white border-t border-b border-pool-cyan shadow-[0_0_8px_#00f0ff] transition-all duration-75"
              style={{ bottom: `calc(${power}% - 2px)` }}
            />
          </div>
          
          <span className="text-[9px] font-black text-slate-300 font-display leading-none">{power}%</span>

          {/* Circular Neon Glowing Strike Button */}
          <button
            onClick={handleStrike}
            disabled={power < 5}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300 ${
              power >= 5
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.45)] hover:scale-105 active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
            }`}
            title="Press Space or click to shoot"
          >
            🚀
          </button>
        </div>
      )}

      {/* 6. Ball-in-Hand Confirmation HUD Button */}
      {matchState.ballInHand && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 select-none z-20">
          <button
            onClick={handleConfirmPlacement}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-display font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition transform active:scale-95 cursor-pointer shadow-emerald-500/25"
          >
            Confirm Placement ✓
          </button>
        </div>
      )}

      {/* Practice Actions Panel */}
      {isPractice && (
        <div className="absolute bottom-6 left-6 flex gap-2 z-20">
          <button
            onClick={handleRestart}
            className="px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-pool-cyan/30 text-white hover:text-pool-cyan font-display font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-lg transition transform active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            🔄 Reset Table
          </button>
          <button
            onClick={handleToggleBallInHand}
            className={`px-4 py-2.5 border font-display font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-lg transition transform active:scale-95 cursor-pointer flex items-center gap-1.5 ${
              matchState.ballInHand 
                ? 'bg-amber-500 hover:bg-amber-600 border-amber-400 text-slate-950 shadow-amber-500/20' 
                : 'bg-slate-900/80 hover:bg-slate-800 border-white/10 hover:border-amber-500/30 text-white hover:text-amber-500'
            }`}
          >
            🎯 Ball in Hand
          </button>
        </div>
      )}

      {/* 7. Game Over / Victory Overlay */}
      {isGameOver && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md overflow-y-auto py-4">
          <div className="p-6 bg-slate-900/90 border border-pool-cyan/20 rounded-3xl shadow-[0_0_40px_rgba(0,240,255,0.2)] max-w-2xl w-full mx-4 text-center">
            <span className="text-4xl animate-bounce block mb-2">🏆</span>
            <h2 className="text-2xl font-black font-display text-white tracking-widest uppercase bg-gradient-to-r from-pool-cyan to-pool-purple bg-clip-text text-transparent">
              {matchState.winner === 'host' ? 'HOST WINS!' : 'GUEST WINS!'}
            </h2>
            <p className="text-[10px] text-slate-400 font-body leading-relaxed mt-1">
              {matchState.foulReason || 'Congratulations! Match completed.'}
            </p>

            {/* Side-by-side Stats Grid */}
            {matchState.stats && (
              <div className="grid grid-cols-3 gap-4 mt-6 text-left border-y border-white/5 py-4">
                {/* Host Column */}
                <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-pool-cyan/10">
                  <div className="text-center font-display text-xs font-black text-pool-cyan border-b border-pool-cyan/15 pb-1 uppercase tracking-wider">
                    Host (Solids)
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>Shots:</span>
                    <span className="font-extrabold text-white">{matchState.stats.host.shotsPlayed}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>Potted:</span>
                    <span className="font-extrabold text-white">{matchState.stats.host.successfulPots}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>Accuracy:</span>
                    <span className="font-extrabold text-pool-cyan">{matchState.stats.host.accuracy}%</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>Fouls:</span>
                    <span className="font-extrabold text-rose-400">{matchState.stats.host.fouls}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>Longest Pot:</span>
                    <span className="font-extrabold text-amber-400">{matchState.stats.host.longestPot}m</span>
                  </div>
                  {matchState.stats.host.unlockedAchievements && matchState.stats.host.unlockedAchievements.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-white/5 text-[9px] text-amber-400 font-bold leading-normal">
                      🏆 UNLOCKED: {matchState.stats.host.unlockedAchievements.join(', ')}
                    </div>
                  )}
                </div>

                {/* Match Summary Column */}
                <div className="flex flex-col items-center justify-center text-center space-y-3">
                  <div>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      Duration
                    </div>
                    <div className="text-lg font-black text-white font-display">
                      {Math.floor(matchState.stats.gameDuration / 60)}m {matchState.stats.gameDuration % 60}s
                    </div>
                  </div>
                  <div className="w-full border-t border-white/5 pt-2">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      Result
                    </div>
                    <div className="text-[10px] font-bold text-emerald-400">
                      WIN: {matchState.winner === 'host' ? 'Host' : 'Guest'}
                    </div>
                    <div className="text-[10px] font-bold text-rose-400">
                      LOSE: {matchState.winner === 'host' ? 'Guest' : 'Host'}
                    </div>
                  </div>
                </div>

                {/* Guest Column */}
                <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-pool-purple/10">
                  <div className="text-center font-display text-xs font-black text-pool-purple border-b border-pool-purple/15 pb-1 uppercase tracking-wider">
                    Guest (Stripes)
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>Shots:</span>
                    <span className="font-extrabold text-white">{matchState.stats.guest.shotsPlayed}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>Potted:</span>
                    <span className="font-extrabold text-white">{matchState.stats.guest.successfulPots}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>Accuracy:</span>
                    <span className="font-extrabold text-pool-purple">{matchState.stats.guest.accuracy}%</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>Fouls:</span>
                    <span className="font-extrabold text-rose-400">{matchState.stats.guest.fouls}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>Longest Pot:</span>
                    <span className="font-extrabold text-amber-400">{matchState.stats.guest.longestPot}m</span>
                  </div>
                  {matchState.stats.guest.unlockedAchievements && matchState.stats.guest.unlockedAchievements.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-white/5 text-[9px] text-amber-400 font-bold leading-normal">
                      🏆 UNLOCKED: {matchState.stats.guest.unlockedAchievements.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleRestart}
              className="mt-6 w-full py-2.5 bg-gradient-to-r from-pool-cyan to-pool-cyan/85 hover:brightness-110 text-pool-dark font-display font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition transform active:scale-95 cursor-pointer shadow-pool-cyan/25"
            >
              Play Again 🎱
            </button>
          </div>
        </div>
      )}

      {/* Landscape Orientation Recommendation Banner */}
      <LandscapePrompt />

      {/* Mobile Controls Overlay */}
      {!isSpectator && matchState.status !== 'game-over' && (
        <MobileControlsOverlay
          aimAngle={0}
          onAngleChange={() => {}}
          power={power}
          onPowerChange={(newPower) => setPower(newPower)}
          onShoot={() => {
            if (power > 0 && turnState !== 'balls-moving') {
              setTurnState('shooting');
            }
          }}
          disabled={turnState === 'balls-moving' || (!isPractice && (isHost ? matchState.activePlayer !== 'host' : matchState.activePlayer !== 'guest'))}
        />
      )}
    </div>
  );
};

export default Scene;
