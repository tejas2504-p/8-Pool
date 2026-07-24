import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Canvas } from '@react-three/fiber';
import { api } from '../services/api';
import Lights from '../game/Lights';
import Environment from '../game/Environment';
import PoolTable from '../game/PoolTable';
import { CameraController } from '../game/cue';
import { getBallTexture } from '../utils/ballTexture';

interface PlayerSummary {
  _id: string;
  username: string;
  avatar: string;
  rank?: string;
}

interface ShotRecord {
  shotNumber: number;
  shooterId: string;
  shooterRole: 'host' | 'guest';
  angle: number;
  power: number;
  timestamp: string;
  ballsSnapshot: Array<{
    id: number;
    x: number;
    y: number;
    z: number;
    isActive: boolean;
  }>;
}

interface ReplayItem {
  _id: string;
  roomId: string;
  host: PlayerSummary;
  guest?: PlayerSummary | null;
  winner: 'host' | 'guest';
  winnerUser?: PlayerSummary | null;
  shots: ShotRecord[];
  gameDuration: number;
  createdAt: string;
}

// Sub-component to render static snapshot balls in 3D Replay Scene
const ReplayBalls: React.FC<{
  ballsSnapshot: Array<{ id: number; x: number; y: number; z: number; isActive: boolean }>;
}> = ({ ballsSnapshot }) => {
  return (
    <group>
      {ballsSnapshot
        .filter((b) => b.isActive)
        .map((b) => (
          <mesh key={b.id} position={[b.x, 0.28, b.z]} castShadow receiveShadow>
            <sphereGeometry args={[0.18, 32, 32]} />
            <meshStandardMaterial
              map={getBallTexture(b.id)}
              roughness={0.28}
              metalness={0.0}
            />
          </mesh>
        ))}
    </group>
  );
};

export const Replays: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const cueBallRef = useRef<any>(null);

  const [replays, setReplays] = useState<ReplayItem[]>([]);
  const [selectedReplay, setSelectedReplay] = useState<ReplayItem | null>(null);
  const [currentShotIndex, setCurrentShotIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
      );
    }

    fetchReplays();
  }, []);

  const fetchReplays = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/replays');
      setReplays(res.data);
    } catch (err) {
      console.error('Failed to load replays:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-play timer loop
  useEffect(() => {
    if (!isPlaying || !selectedReplay || selectedReplay.shots.length === 0) return;

    const intervalTime = (3000 / playbackSpeed);
    const timer = setInterval(() => {
      setCurrentShotIndex((prev) => {
        if (prev >= selectedReplay.shots.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, selectedReplay, playbackSpeed]);

  const handleSelectReplay = (replay: ReplayItem) => {
    setSelectedReplay(replay);
    setCurrentShotIndex(0);
    setIsPlaying(false);
  };

  const currentShot = selectedReplay?.shots[currentShotIndex];
  const isWinnerStep = selectedReplay && currentShotIndex === selectedReplay.shots.length;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500 selection:text-black pb-12">
      {/* Background Neon Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div ref={containerRef} className="relative z-10 max-w-6xl mx-auto px-4 pt-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 uppercase tracking-widest transition-colors mb-2"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500">
              📺 Match Replay System
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Playback shot-by-shot recorded history of completed pool matches.
            </p>
          </div>
        </div>

        {/* REPLAY VIEWER MODAL / ACTIVE VIEW */}
        {selectedReplay ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Viewer Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-xl">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-extrabold text-white">
                    Room Code: <span className="text-cyan-400">{selectedReplay.roomId}</span>
                  </h2>
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                    {selectedReplay.shots.length} Total Shots
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedReplay.host?.username || 'Host'} (Solids) vs {selectedReplay.guest?.username || 'Guest'} (Stripes) • Winner: <span className="text-emerald-400 font-bold">{selectedReplay.winnerUser?.username || selectedReplay.winner.toUpperCase()}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedReplay(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all"
              >
                ✕ Close Replay
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* 3D Replay Canvas Viewport */}
              <div className="lg:col-span-3 space-y-4">
                <div className="w-full aspect-[2/1] bg-slate-950 border-4 border-amber-900 rounded-3xl relative overflow-hidden shadow-2xl">
                  {/* Floating Replay HUD Badge */}
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none select-none">
                    <span className="px-3 py-1 text-xs font-black tracking-widest uppercase rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg">
                      📺 REPLAY PLAYER
                    </span>
                    {currentShot && (
                      <span className="px-3 py-1 text-xs font-bold text-slate-300 bg-slate-900/80 border border-white/10 rounded-full">
                        {currentShot.shooterRole === 'host' ? selectedReplay.host?.username : selectedReplay.guest?.username || 'Guest'}'s Shot
                      </span>
                    )}
                  </div>

                  {/* 3D Scene */}
                  <Canvas shadows camera={{ position: [0, 6, 8], fov: 45 }}>
                    <CameraController cueBallRef={cueBallRef} />
                    <Lights />
                    <Environment />
                    <PoolTable />
                    {currentShot && <ReplayBalls ballsSnapshot={currentShot.ballsSnapshot} />}
                  </Canvas>

                  {/* Winner Banner */}
                  {isWinnerStep && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md">
                      <span className="text-6xl mb-2">🏆</span>
                      <h2 className="text-3xl font-black text-white tracking-widest uppercase">
                        MATCH WINNER: {selectedReplay.winnerUser?.username || selectedReplay.winner.toUpperCase()}
                      </h2>
                      <p className="text-xs text-slate-400 mt-2">Replay playback complete!</p>
                    </div>
                  )}
                </div>

                {/* Playback Controls Toolbar */}
                <div className="flex flex-wrap items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-2xl gap-4">
                  {/* Step Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setCurrentShotIndex(0); setIsPlaying(false); }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-all"
                      title="First Shot"
                    >
                      ⏮️ First
                    </button>
                    <button
                      onClick={() => { setCurrentShotIndex((p) => Math.max(0, p - 1)); setIsPlaying(false); }}
                      disabled={currentShotIndex === 0}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                      title="Previous Shot"
                    >
                      ◀️ Prev
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-black text-white rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
                    >
                      {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                    </button>
                    <button
                      onClick={() => { setCurrentShotIndex((p) => Math.min(selectedReplay.shots.length - 1, p + 1)); setIsPlaying(false); }}
                      disabled={currentShotIndex >= selectedReplay.shots.length - 1}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                      title="Next Shot"
                    >
                      Next ▶️
                    </button>
                    <button
                      onClick={() => { setCurrentShotIndex(selectedReplay.shots.length - 1); setIsPlaying(false); }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-all"
                      title="Last Shot"
                    >
                      ⏭️ Last
                    </button>
                  </div>

                  {/* Playback Speed Switcher */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {[1, 2, 4].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          playbackSpeed === speed
                            ? 'bg-cyan-500 text-black font-black'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Shot List Sidebar Drawer */}
              <div className="lg:col-span-1 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl h-[560px] flex flex-col">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Match Shot Log ({selectedReplay.shots.length})
                </h3>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {selectedReplay.shots.map((shot, idx) => {
                    const isSelected = idx === currentShotIndex;
                    const shooterName = shot.shooterRole === 'host' ? selectedReplay.host?.username : selectedReplay.guest?.username || 'Guest';

                    return (
                      <button
                        key={shot.shotNumber}
                        onClick={() => { setCurrentShotIndex(idx); setIsPlaying(false); }}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-500/50 text-white shadow-md'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-white">Shot #{shot.shotNumber}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                            Power: {shot.power}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Shooter: <span className="text-slate-200 font-semibold">{shooterName}</span>
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* REPLAY LIBRARY CARDS GRID */
          <>
            {loading ? (
              <div className="py-20 text-center text-slate-500">
                <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium">Fetching saved match replays...</p>
              </div>
            ) : replays.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                <span className="text-5xl block mb-3">📺</span>
                <h3 className="text-lg font-bold text-white">No Match Replays Saved Yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Play 8-ball pool multiplayer matches to automatically save full shot-by-shot replay history!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {replays.map((replay) => (
                  <div
                    key={replay._id}
                    className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-xl hover:border-cyan-500/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
                          Room {replay.roomId}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(replay.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-3 px-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl mb-4">
                        <div className="text-center">
                          <p className="text-xs font-bold text-white truncate max-w-[90px]">{replay.host?.username || 'Host'}</p>
                          <p className="text-[10px] text-cyan-400 font-semibold mt-0.5">Solids</p>
                        </div>
                        <span className="text-xs font-black text-slate-600">VS</span>
                        <div className="text-center">
                          <p className="text-xs font-bold text-white truncate max-w-[90px]">{replay.guest?.username || 'Guest'}</p>
                          <p className="text-[10px] text-purple-400 font-semibold mt-0.5">Stripes</p>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-slate-400 mb-6">
                        <p>🏆 Winner: <span className="text-emerald-400 font-bold">{replay.winnerUser?.username || replay.winner.toUpperCase()}</span></p>
                        <p>🎱 Total Shots: <span className="text-white font-semibold">{replay.shots.length}</span></p>
                        <p>⏱️ Duration: <span className="text-white font-semibold">{Math.floor(replay.gameDuration / 60)}m {replay.gameDuration % 60}s</span></p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectReplay(replay)}
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <span>📺 Watch Match Replay</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Replays;
