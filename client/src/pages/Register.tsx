import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { api } from '../services/api';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useGameStore((state) => state.setUser);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/users', { 
        username: username.trim(),
        email: email.trim(),
        password 
      });
      
      const { _id, username: returnedUsername, email: returnedEmail, avatar, coins, xp, wins, losses, rank, token } = response.data;

      // Save token to localStorage
      if (token) {
        localStorage.setItem('token', token);
      }

      // Save credentials for login page autofill
      localStorage.setItem('remembered_username', returnedUsername);
      localStorage.setItem('remember_me', 'true');

      // Update Zustand store
      setUser({
        id: _id,
        username: returnedUsername,
        email: returnedEmail,
        avatar,
        coins,
        xp,
        wins,
        losses,
        rank,
      });

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.error || 
        (err.response 
          ? 'Failed to create profile. The username or email might already be taken.'
          : 'Unable to connect to the server. Please check if the backend server is running.');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full px-6 py-8 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl shadow-xl">
      <h2 className="text-3xl font-extrabold tracking-wider font-display mb-2 text-center text-white">
        CREATE PROFILE
      </h2>
      <p className="text-slate-400 text-xs font-body text-center mb-8">
        Register a new unique profile to start playing
      </p>

      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold rounded-xl text-center">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-display">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Min 3 characters"
            className="w-full px-4 py-3 bg-pool-dark/50 border border-white/10 focus:border-pool-cyan focus:outline-none rounded-xl text-white font-body transition-all duration-200 text-sm"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-display">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter a valid email"
            className="w-full px-4 py-3 bg-pool-dark/50 border border-white/10 focus:border-pool-cyan focus:outline-none rounded-xl text-white font-body transition-all duration-200 text-sm"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-display">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            className="w-full px-4 py-3 bg-pool-dark/50 border border-white/10 focus:border-pool-cyan focus:outline-none rounded-xl text-white font-body transition-all duration-200 text-sm"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 px-6 bg-gradient-to-r from-pool-cyan to-pool-cyan/80 hover:from-pool-cyan/95 hover:to-pool-cyan/75 text-pool-dark font-display font-bold rounded-xl shadow-lg shadow-pool-cyan/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none"
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Register & Play'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-400 font-body">
        Already have a profile?{' '}
        <Link to="/login" className="text-pool-cyan hover:underline font-semibold">
          Sign in here
        </Link>
      </p>
    </div>
  );
};

export default Register;
