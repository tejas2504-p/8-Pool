import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import Scene from '../game/Scene';
import { ParticleProvider } from '../effects';

export const Practice: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Practice session metrics
  const [shotsTaken, setShotsTaken] = useState(0);
  const [potsMade, setPotsMade] = useState(0);

  // Key trigger for re-mounting/resetting the 3D scene instance
  const [sceneResetKey, setSceneResetKey] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
      );
    }
  }, []);

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 2500);
  };

  const handleResetRack = () => {
    setSceneResetKey((prev) => prev + 1);
    showToast('🔄 Rack & balls reset to starting positions!');
  };

  const handleResetStats = () => {
    setShotsTaken(0);
    setPotsMade(0);
    showToast('📊 Practice session metrics reset!');
  };

  const accuracy = shotsTaken > 0 ? Math.round((potsMade / shotsTaken) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500 selection:text-black pb-12">
      {/* Background Neon Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div ref={containerRef} className="relative z-10 max-w-[1300px] mx-auto px-4 pt-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 uppercase tracking-widest transition-colors mb-2"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-teal-400 to-cyan-400">
              🎮 Practice & Training Arena
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Offline single-player mode • Unlimited shots • No turn timers • Perfect for mastering bank shots and angles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              100% Offline Mode
            </span>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMessage && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold text-center animate-in fade-in">
            {feedbackMessage}
          </div>
        )}

        {/* Practice Metrics Dashboard Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl text-center">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Shots Taken</span>
            <span className="text-2xl font-black text-white font-display">{shotsTaken}</span>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl text-center">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Pots Made</span>
            <span className="text-2xl font-black text-emerald-400 font-display">{potsMade}</span>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl text-center">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Accuracy</span>
            <span className="text-2xl font-black text-cyan-400 font-display">{accuracy}%</span>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl text-center flex flex-col justify-center items-center">
            <button
              onClick={handleResetStats}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition-all"
            >
              📊 Reset Stats
            </button>
          </div>
        </div>

        {/* 3D Practice Viewport */}
        <div className="mb-6">
          <div className="my-2 max-w-[1200px] mx-auto">
            <ParticleProvider>
              <Scene key={sceneResetKey} isPractice={true} />
            </ParticleProvider>
          </div>
        </div>

        {/* Practice Controls & Learning Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Action Dock */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              ⚡ Practice Controls
            </h3>

            <button
              onClick={handleResetRack}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              🔄 Reset Rack & Balls
            </button>

            <button
              onClick={handleResetRack}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              🧹 Respawn Pocketed Balls
            </button>
          </div>

          {/* Learning & Controls Guide */}
          <div className="md:col-span-2 p-5 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              📖 How to Practice & Learn
            </h3>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">🖱️ Aiming & Shot:</span> Move mouse around cue ball to aim, Left-Click & drag backward to set power, then release to shoot.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-400">🔄 Camera Rotation:</span> Right-Click and drag across the screen to orbit the 3D camera around the table.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-400">🎯 Ball in Hand:</span> Click the "Ball in Hand" button on the table HUD to drag the cue ball anywhere on the felt.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">⚡ Unlimited Practice:</span> Take unlimited shots without turn switching, fouls, or game-over timeouts!
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Practice;
