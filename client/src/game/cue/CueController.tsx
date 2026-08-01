import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RapierRigidBody, useRapier } from '@react-three/rapier';
import InputManager from './InputManager';
import ShotController from './ShotController';
import CueStick from './CueStick';
import AimLine from './AimLine';
import { GameManager } from '../rules/GameManager';
import socketService from '../../socket/socket';
import { audioManager } from '../../audio';

interface CueControllerProps {
  cueBallRef: React.RefObject<RapierRigidBody | null>;
  turnState: 'idle' | 'aiming' | 'charging' | 'shooting' | 'balls-moving';
  setTurnState: (state: 'idle' | 'aiming' | 'charging' | 'shooting' | 'balls-moving') => void;
  power: number;
  setPower: (power: number) => void;
  gameManager: GameManager;
  roomId?: string;
  isHost?: boolean;
}

export const CueController: React.FC<CueControllerProps> = ({
  cueBallRef,
  turnState,
  setTurnState,
  power,
  setPower,
  gameManager,
  roomId,
  isHost,
}) => {
  const { gl } = useThree();
  const { world, rapier } = useRapier();

  const matchState = gameManager.getState();
  const isLocalTurn = !roomId ||
    (isHost && matchState.activePlayer === 'host') ||
    (!isHost && matchState.activePlayer === 'guest');

  const inputManagerRef = useRef<InputManager | null>(null);
  
  const cueStickRef = useRef<THREE.Group>(null);
  const aimLineRef = useRef<THREE.Group>(null);

  const aimAngleRef = useRef(0);
  const lastEmittedAngle = useRef(0);
  const pullbackRef = useRef(0);
  const powerRef = useRef(0);
  const pauseTimeRef = useRef(0.18); // 180ms pause at peak pullback
  const hasEmittedShootRef = useRef(false);

  // Sync state power to ref for hot path useFrame access
  useEffect(() => {
    powerRef.current = power;
  }, [power]);

  // Instantiate InputManager
  useEffect(() => {
    const inputManager = new InputManager(gl);
    inputManagerRef.current = inputManager;

    return () => {
      inputManager.deactivate();
    };
  }, [gl]);

  // Synchronize state changes when parent updates power prop directly (e.g. from slider)
  useEffect(() => {
    if (isLocalTurn) {
      if (power > 0 && (turnState === 'idle' || turnState === 'aiming')) {
        setTurnState('charging');
      } else if (power === 0 && turnState === 'charging') {
        setTurnState('idle');
      }
    }
  }, [power, turnState, isLocalTurn, setTurnState]);

  // Listen to keyboard & scroll wheel inputs
  useEffect(() => {
    if (!isLocalTurn) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Spacebar to shoot
      if (e.code === 'Space') {
        e.preventDefault();
        if (powerRef.current >= 5 && (turnState === 'idle' || turnState === 'aiming' || turnState === 'charging')) {
          setTurnState('shooting');
        }
      }
      // Arrow Up or W to increase power
      else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (turnState !== 'balls-moving' && turnState !== 'shooting') {
          const nextPower = Math.min(100, powerRef.current + 5);
          setPower(nextPower);
        }
      }
      // Arrow Down or S to decrease power
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (turnState !== 'balls-moving' && turnState !== 'shooting') {
          const nextPower = Math.max(0, powerRef.current - 5);
          setPower(nextPower);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (turnState === 'balls-moving' || turnState === 'shooting') return;
      
      e.preventDefault();
      const change = e.deltaY < 0 ? 5 : -5;
      const nextPower = Math.min(Math.max(0, powerRef.current + change), 100);
      setPower(nextPower);
    };

    window.addEventListener('keydown', handleKeyDown);
    gl.domElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gl.domElement) {
        gl.domElement.removeEventListener('wheel', handleWheel);
      }
    };
  }, [gl, isLocalTurn, turnState, roomId, setPower, setTurnState]);



  // Activate/deactivate inputs depending on turnState and active player turn
  useEffect(() => {
    const inputManager = inputManagerRef.current;
    if (!inputManager) return;

    if (isLocalTurn && (turnState === 'idle' || turnState === 'aiming' || turnState === 'charging')) {
      inputManager.activate(
        (dragPower) => {
          setPower(dragPower);
        },
        () => {
          if (powerRef.current >= 5) {
            setTurnState('shooting');
          }
        }
      );
    } else {
      inputManager.deactivate();
    }
  }, [turnState, isLocalTurn, setPower, setTurnState]);

  // Sync opponent aiming angles from server
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket || !roomId || isLocalTurn) return;

    const handleOpponentAim = (data: { userId: string; angle: number }) => {
      aimAngleRef.current = data.angle;
      if (turnState === 'idle') {
        setTurnState('aiming');
      }
    };

    socket.on('aim', handleOpponentAim);
    return () => {
      socket.off('aim', handleOpponentAim);
    };
  }, [roomId, isLocalTurn, turnState]);

  // Sync opponent shot releases from server
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket || !roomId || isLocalTurn) return;

    const handleOpponentShoot = (data: { angle: number; power: number }) => {
      aimAngleRef.current = data.angle;
      setPower(data.power);
      powerRef.current = data.power;
      pullbackRef.current = (data.power / 100) * 1.5;
      setTurnState('shooting');
    };

    socket.on('shoot', handleOpponentShoot);
    return () => {
      socket.off('shoot', handleOpponentShoot);
    };
  }, [roomId, isLocalTurn]);

  // Helper to cast shape and render the smart aim line + deflection split vectors
  const updateSmartAimLine = (cueBallPos: THREE.Vector3) => {
    if (!cueBallRef.current || !cueBallRef.current.isValid()) return;

    const aimLine = aimLineRef.current;
    if (!aimLine) return;

    aimLine.visible = true;

    const primary = aimLine.getObjectByName('primaryLine') as THREE.Mesh;
    const ghost = aimLine.getObjectByName('ghostBall') as THREE.Mesh;
    const targetL = aimLine.getObjectByName('targetLine') as THREE.Mesh;
    const deflectL = aimLine.getObjectByName('deflectionLine') as THREE.Mesh;

    const dir = new THREE.Vector3(
      Math.sin(aimAngleRef.current - Math.PI),
      0,
      Math.cos(aimAngleRef.current - Math.PI)
    ).normalize();

    const shape = new rapier.Ball(0.18); // Ball radius 0.18
    const cueBallCollider = cueBallRef.current.collider(0);

    const hit = world.castShape(
      { x: cueBallPos.x, y: cueBallPos.y, z: cueBallPos.z },
      { x: 0, y: 0, z: 0, w: 1 },
      { x: dir.x, y: dir.y, z: dir.z },
      shape,
      0.0,  // targetDistance
      15.0, // maxToi (Max lookahead distance)
      true, // stopAtPenetration
      undefined,
      undefined,
      cueBallCollider || undefined
    );

    if (hit) {
      const dist = hit.time_of_impact;
      const contactPos = new THREE.Vector3().copy(cueBallPos).addScaledVector(dir, dist);
      
      const hitColliderParent = hit.collider.parent();
      const isBall = hitColliderParent && hitColliderParent.isDynamic();

      // A. Primary line to contact point
      if (primary) {
        primary.visible = true;
        primary.position.copy(cueBallPos).add(contactPos).multiplyScalar(0.5);
        primary.position.y = 0.28 - 0.05;
        primary.scale.set(1, 1, dist);
        primary.rotation.set(0, Math.atan2(dir.x, dir.z), 0);

        const primaryMat = primary.material as THREE.ShaderMaterial;
        if (primaryMat && primaryMat.uniforms && primaryMat.uniforms.dashScale) {
          primaryMat.uniforms.dashScale.value = dist * 35.0;
        }
      }

      // B. Ghost Ball contact outline
      if (ghost) {
        ghost.visible = true;
        ghost.position.copy(contactPos);
      }

      if (isBall && hitColliderParent && hitColliderParent.isValid()) {
        let rawTargetPos;
        try {
          rawTargetPos = hitColliderParent.translation();
        } catch (e) {
          return;
        }
        const targetBallPos = new THREE.Vector3(rawTargetPos.x, 0.28, rawTargetPos.z);

        // C. Target ball path line
        const targetDir = new THREE.Vector3().subVectors(targetBallPos, contactPos).normalize();
        if (targetL) {
          targetL.visible = true;
          targetL.position.copy(contactPos).addScaledVector(targetDir, 0.75);
          targetL.position.y = 0.28 - 0.05;
          targetL.scale.set(1, 1, 1.5);
          targetL.rotation.set(0, Math.atan2(targetDir.x, targetDir.z), 0);

          const targetMat = targetL.material as THREE.ShaderMaterial;
          if (targetMat && targetMat.uniforms && targetMat.uniforms.dashScale) {
            targetMat.uniforms.dashScale.value = 1.5 * 35.0;
          }
        }

        // D. Cue ball deflection line
        const dot = dir.dot(targetDir);
        const deflectDir = new THREE.Vector3().subVectors(dir, targetDir.clone().multiplyScalar(dot)).normalize();
        if (deflectL) {
          deflectL.visible = true;
          deflectL.position.copy(contactPos).addScaledVector(deflectDir, 0.75);
          deflectL.position.y = 0.28 - 0.05;
          deflectL.scale.set(1, 1, 1.5);
          deflectL.rotation.set(0, Math.atan2(deflectDir.x, deflectDir.z), 0);

          const deflectMat = deflectL.material as THREE.ShaderMaterial;
          if (deflectMat && deflectMat.uniforms && deflectMat.uniforms.dashScale) {
            deflectMat.uniforms.dashScale.value = 1.5 * 35.0;
          }
        }
      } else {
        if (targetL) targetL.visible = false;

        // Cushion bounce reflection
        const rawNormal = hit.normal2;
        const normal = new THREE.Vector3(rawNormal.x, 0, rawNormal.z).normalize();
        const deflectDir = dir.clone().reflect(normal).normalize();

        if (deflectL) {
          deflectL.visible = true;
          deflectL.position.copy(contactPos).addScaledVector(deflectDir, 0.75);
          deflectL.position.y = 0.28 - 0.05;
          deflectL.scale.set(1, 1, 1.5);
          deflectL.rotation.set(0, Math.atan2(deflectDir.x, deflectDir.z), 0);

          const deflectMat = deflectL.material as THREE.ShaderMaterial;
          if (deflectMat && deflectMat.uniforms && deflectMat.uniforms.dashScale) {
            deflectMat.uniforms.dashScale.value = 1.5 * 35.0;
          }
        }
      }
    } else {
      // Default line projection if no collision hit
      const dist = 6.0;
      const contactPos = new THREE.Vector3().copy(cueBallPos).addScaledVector(dir, dist);

      if (primary) {
        primary.visible = true;
        primary.position.copy(cueBallPos).add(contactPos).multiplyScalar(0.5);
        primary.position.y = 0.28 - 0.05;
        primary.scale.set(1, 1, dist);
        primary.rotation.set(0, Math.atan2(dir.x, dir.z), 0);

        const primaryMat = primary.material as THREE.ShaderMaterial;
        if (primaryMat && primaryMat.uniforms && primaryMat.uniforms.dashScale) {
          primaryMat.uniforms.dashScale.value = dist * 35.0;
        }
      }

      if (ghost) ghost.visible = false;
      if (targetL) targetL.visible = false;
      if (deflectL) deflectL.visible = false;
    }
  };

  useFrame((state, delta) => {
    if (!cueBallRef.current || !cueBallRef.current.isValid() || !inputManagerRef.current) return;

    let translation;
    try {
      translation = cueBallRef.current.translation();
    } catch (e) {
      return;
    }
    const cueBallPos = new THREE.Vector3(translation.x, 0.28, translation.z);
    const inputManager = inputManagerRef.current;

    // Handle Ball-in-Hand placement dragging
    if (gameManager.getState().ballInHand) {
      if (cueStickRef.current) {
        cueStickRef.current.visible = false;
      }
      if (aimLineRef.current) {
        aimLineRef.current.visible = false;
      }

      if (inputManager.getIsDragging()) {
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.28);
        const target = new THREE.Vector3();
        state.raycaster.ray.intersectPlane(plane, target);

        // Clamp coordinates within play area cushions (scaled by 1.2x)
        const clampedX = Math.min(Math.max(target.x, -6.744), 6.744);
        const clampedZ = Math.min(Math.max(target.z, -3.144), 3.144);

        cueBallRef.current.setTranslation({ x: clampedX, y: 0.28, z: clampedZ }, true);
        cueBallRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        cueBallRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
      return; // Suspend standard aiming/power charging during placement
    }

    // A. Handle Idle / Aiming states
    if (turnState === 'idle' || turnState === 'aiming') {
      let currentAngle = aimAngleRef.current;
      if (isLocalTurn) {
        currentAngle = InputManager.calculateAimAngle(state.raycaster, cueBallPos);
      }
      
      const angleDiff = Math.abs(currentAngle - aimAngleRef.current);
      
      if (isLocalTurn) {
        aimAngleRef.current = currentAngle;
        
        // Throttled emit to avoid overloading socket link
        if (Math.abs(currentAngle - lastEmittedAngle.current) > 0.005) {
          lastEmittedAngle.current = currentAngle;
          if (roomId) {
            socketService.emit('aim', { roomId, angle: currentAngle });
          }
        }

        if (angleDiff > 0.001 && turnState === 'idle') {
          setTurnState('aiming');
        }
      }

      // Position visual cue stick
      if (cueStickRef.current) {
        cueStickRef.current.visible = true;
        cueStickRef.current.position.copy(cueBallPos);
        cueStickRef.current.rotation.set(0.12, aimAngleRef.current, 0, 'YXZ');
        
        const inner = cueStickRef.current.children[0] as THREE.Group;
        if (inner) {
          inner.position.z = 0.22;
        }
      }

      // Render the smart aim line
      updateSmartAimLine(cueBallPos);
    }

    // B. Handle Charging state
    else if (turnState === 'charging') {
      pullbackRef.current = (power / 100) * 1.5;

      // Allow aiming adjustment while charging
      if (isLocalTurn) {
        const currentAngle = InputManager.calculateAimAngle(state.raycaster, cueBallPos);
        aimAngleRef.current = currentAngle;
        
        if (Math.abs(currentAngle - lastEmittedAngle.current) > 0.005) {
          lastEmittedAngle.current = currentAngle;
          if (roomId) {
            socketService.emit('aim', { roomId, angle: currentAngle });
          }
        }
      }

      // Position visual cue stick at pulled back coordinate
      if (cueStickRef.current) {
        cueStickRef.current.visible = true;
        cueStickRef.current.position.copy(cueBallPos);
        cueStickRef.current.rotation.set(0.12, aimAngleRef.current, 0, 'YXZ');
        
        const inner = cueStickRef.current.children[0] as THREE.Group;
        if (inner) {
          inner.position.z = 0.22 + pullbackRef.current;
        }
      }

      // Render target aim line
      updateSmartAimLine(cueBallPos);
    }

    // C. Handle Shooting state (Strike Animation + Pause)
    else if (turnState === 'shooting') {
      if (isLocalTurn && !hasEmittedShootRef.current) {
        hasEmittedShootRef.current = true;
        if (roomId) {
          socketService.emit('shoot', { roomId, angle: aimAngleRef.current, power: powerRef.current });
        }
      }

      // 1. Backswing peak pause (180ms)
      if (pauseTimeRef.current > 0) {
        pauseTimeRef.current -= delta;
        
        if (cueStickRef.current) {
          cueStickRef.current.visible = true;
          cueStickRef.current.position.copy(cueBallPos);
          cueStickRef.current.rotation.set(0.12, aimAngleRef.current, 0, 'YXZ');
          
          const inner = cueStickRef.current.children[0] as THREE.Group;
          if (inner) {
            inner.position.z = 0.22 + pullbackRef.current;
          }
        }
        return; // Wait out the pause
      }

      // 2. Strike animation: slide stick forward rapidly
      const strikeSpeed = 20.0;
      pullbackRef.current = Math.max(0, pullbackRef.current - strikeSpeed * delta);

      if (cueStickRef.current) {
        cueStickRef.current.visible = true;
        cueStickRef.current.position.copy(cueBallPos);
        cueStickRef.current.rotation.set(0.12, aimAngleRef.current, 0, 'YXZ');
        
        const inner = cueStickRef.current.children[0] as THREE.Group;
        if (inner) {
          inner.position.z = 0.22 + pullbackRef.current;
        }
      }

      if (aimLineRef.current) {
        aimLineRef.current.visible = false;
      }

      // 3. Contact! Apply impulse and transition to balls-moving
      if (pullbackRef.current === 0) {
        gameManager.startNewShot();
        setTurnState('balls-moving');
        audioManager.playCue(powerRef.current);
        ShotController.executeShot(cueBallRef, powerRef.current, aimAngleRef.current);
        setPower(0);
        pauseTimeRef.current = 0.18; // Reset pause timer for next turn
        hasEmittedShootRef.current = false; // Reset emission flag
      }
    }

    // D. Handle Balls Moving state (Simulation active)
    else if (turnState === 'balls-moving') {
      if (cueStickRef.current) {
        cueStickRef.current.visible = false;
      }
      if (aimLineRef.current) {
        aimLineRef.current.visible = false;
      }
    }
  });

  return (
    <>
      <CueStick ref={cueStickRef} />
      <AimLine ref={aimLineRef} />
    </>
  );
};

export default CueController;
