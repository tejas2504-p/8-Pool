import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import Scene from '../game/Scene';
import { ParticleProvider } from '../effects';
import { AiAgent, AiDifficulty, AiShotDecision } from '../game/ai/AiAgent';
import { GameManager } from '../game/rules/GameManager';

export const AiMatch: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [difficulty, setDifficulty] = useState<AiDifficulty>('medium');
  const [matchStarted, setMatchStarted] = useState<boolean>(false);
  const [aiThinking, setAiThinking] = useState<boolean>(false);
  const [latestAiDecision, setLatestAiDecision] = useState<AiShotDecision | null>(null);

  // Re-key 3D canvas on match restart
  const [matchResetKey, setMatchResetKey] = useState<number>(0);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
      );
    }
  }, []);

  const handleStartMatch = (selectedDifficulty: AiDifficulty) => {
    setDifficulty(selectedDifficulty);
    setMatchStarted(true);
    setMatchResetKey((prev) => prev + 1);
  };

  const handleRestart = () => {
    setMatchStarted(false);
    setAiThinking(false);
    setLatestAiDecision(null);
  };

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
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
              🤖 Single-Player Vs AI Bot
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Test your pool skills against an offline physics-driven AI opponent with customizable difficulty.
            </p>
          </div>

          {matchStarted && (
            <button
              onClick={handleRestart}
              className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all"
            >
              🔄 Change Difficulty
            </button>
          )}
        </div>

        {!matchStarted ? (
          /* DIFFICULTY SELECTOR CARDS */
          <div className="py-8 max-w-3xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">Select AI Difficulty Level</h2>
              <p className="text-xs text-slate-400">Choose your challenge level to launch the match</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Easy */}
              <button
                onClick={() => handleStartMatch('easy')}
                className="p-6 bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-3xl backdrop-blur-xl text-left transition-all hover:scale-105 group"
              >
                <span className="text-4xl block mb-3">🟢</span>
                <h3 className="text-lg font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                  Easy Bot
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Higher shot error margin, casual power control. Great for beginners learning table positioning.
                </p>
              </button>

              {/* Medium */}
              <button
                onClick={() => handleStartMatch('medium')}
                className="p-6 bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-3xl backdrop-blur-xl text-left transition-all hover:scale-105 group"
              >
                <span className="text-4xl block mb-3">🟡</span>
                <h3 className="text-lg font-extrabold text-white group-hover:text-amber-400 transition-colors">
                  Medium Bot
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Physics collision heuristics with accurate pocket targeting. Balanced competitve challenge.
                </p>
              </button>

              {/* Hard */}
              <button
                onClick={() => handleStartMatch('hard')}
                className="p-6 bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 rounded-3xl backdrop-blur-xl text-left transition-all hover:scale-105 group"
              >
                <span className="text-4xl block mb-3">🔴</span>
                <h3 className="text-lg font-extrabold text-white group-hover:text-rose-400 transition-colors">
                  Hard Bot
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Near zero error vector targeting, line-of-sight pocketing, and optimal shot speed control.
                </p>
              </button>
            </div>
          </div>
        ) : (
          /* MATCH ARENA VIEW */
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Status Bar */}
            <div className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-xs font-black uppercase tracking-widest rounded-full border ${
                  difficulty === 'easy'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : difficulty === 'medium'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  Difficulty: {difficulty.toUpperCase()}
                </span>
                {aiThinking && (
                  <span className="text-xs font-bold text-purple-400 animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                    🤖 AI Bot is thinking...
                  </span>
                )}
              </div>

              {latestAiDecision && (
                <span className="text-xs text-slate-400">
                  AI Target: <span className="text-cyan-300 font-bold">Ball #{latestAiDecision.targetBallId} ({latestAiDecision.pocketName})</span>
                </span>
              )}
            </div>

            {/* 3D Scene */}
            <div className="my-2 max-w-[1200px] mx-auto">
              <ParticleProvider>
                <Scene key={matchResetKey} isHost={true} />
              </ParticleProvider>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiMatch;
