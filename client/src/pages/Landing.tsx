import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { audioManager } from '../audio';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
    audioManager.startMusic('home');
  }, [navigate]);

  return (
    <div className="max-w-md mx-auto text-center px-4 py-12 flex flex-col items-center justify-center">
      <div className="text-8xl mb-6 animate-bounce">🎱</div>
      <h1 className="text-4xl font-extrabold tracking-wider font-display mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pool-cyan to-pool-purple">
        8-BALL POOL
      </h1>
      <p className="text-slate-400 font-body mb-8 text-sm max-w-xs leading-relaxed">
        Experience real-time multiplayer pool matches right in your browser. Rack the balls and start pocketing!
      </p>
      
      <div className="flex flex-col gap-4 w-full">
        <Link
          to="/login"
          className="py-3 px-6 bg-gradient-to-r from-pool-cyan to-pool-cyan/80 hover:from-pool-cyan/95 hover:to-pool-cyan/75 text-pool-dark font-display font-bold rounded-xl shadow-lg shadow-pool-cyan/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 text-center"
        >
          Sign In
        </Link>
        <Link
          to="/register"
          className="py-3 px-6 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-display font-semibold rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 text-center"
        >
          Register New Account
        </Link>
      </div>

      <div className="mt-12 text-slate-500 text-xs font-semibold uppercase tracking-wider">
        Phase 2: Persistent State Connected
      </div>
    </div>
  );
};

export default Landing;
