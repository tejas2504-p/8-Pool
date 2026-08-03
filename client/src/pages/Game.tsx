import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { api } from '../services/api';
import PlayerCard from '../components/PlayerCard';
import socketService from '../socket/socket';
import { SOCKET_EVENTS } from '../socket/socketEvents';
import { GameRoom, SharedUser } from '@pool/shared';
import Scene from '../game/Scene';
import { audioManager } from '../audio';
import { ParticleProvider } from '../effects';

export const Game: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const currentRoom = useGameStore((state) => state.currentRoom);
  const setRoom = useGameStore((state) => state.setRoom);
  const user = useGameStore((state) => state.user);
  const navigate = useNavigate();

  const isPractice = roomId === 'practice';

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  // Game start transition placeholder state
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Temporary chat message logs
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Synchronize BGM tracks depending on match stage
  useEffect(() => {
    if (gameStarted) {
      audioManager.startMusic('game');
    } else {
      audioManager.startMusic('lobby');
    }
  }, [gameStarted]);

  useEffect(() => {
    return () => {
      audioManager.stopMusic();
    };
  }, []);

  // Fetch initial room details and verify connection on mount
  useEffect(() => {
    if (isPractice) {
      setRoom({
        roomId: 'practice',
        isPrivate: true,
        status: 'playing',
        host: { _id: user?.id || 'practice-user', username: user?.username || 'Player' },
        guest: null,
        hostReady: true,
        guestReady: false,
      } as any);
      setGameStarted(true);
      setIsLoading(false);
      return;
    }

    const fetchRoomDetails = async () => {
      if (!roomId) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/rooms/${roomId}`);
        setRoom(res.data);
      } catch (err: any) {
        console.error('Error fetching room details:', err);
        setError(err.response?.data?.error || err.message || 'Room not found.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomDetails();

    const token = localStorage.getItem('token');
    if (token) {
      socketService.connect(token);
    }
  }, [roomId, setRoom, isPractice, user]);

  // Setup Socket listeners for real-time room updates
  useEffect(() => {
    if (isPractice) return;
    const socket = socketService.getSocket();
    if (!socket || !roomId) return;

    // Join room channel immediately
    socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId });
    audioManager.playRoomJoined();

    socket.on(SOCKET_EVENTS.ROOM_UPDATED, (updatedRoom: GameRoom) => {
      setRoom(updatedRoom);
      
      // If we are currently playing, sync status
      if (updatedRoom.status === 'playing') {
        setGameStarted(true);
      } else {
        setGameStarted(false);
      }
    });

    socket.on(SOCKET_EVENTS.ROOM_ENDED, (data: { message: string }) => {
      setRoom(null);
      setError(data.message || 'Room has been closed by host.');
      setGameStarted(false);
      setCountdown(null);
    });

    socket.on(SOCKET_EVENTS.ROOM_ERROR, (errData: { message: string }) => {
      setError(errData.message);
    });

    // Auto Start Game Listener
    socket.on(SOCKET_EVENTS.START_GAME, (roomDetails: GameRoom) => {
      setRoom(roomDetails);
      
      // Trigger a 3-second countdown transition
      let count = 3;
      setCountdown(count);
      audioManager.playCountdown(false);

      const timer = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(timer);
          setCountdown(null);
          setGameStarted(true);
          audioManager.playCountdown(true);
        } else {
          setCountdown(count);
          audioManager.playCountdown(false);
        }
      }, 1000);
    });

    // Message listener
    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, (payload: any) => {
      setMessages((prev) => [...prev, payload]);
    });

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_UPDATED);
      socket.off(SOCKET_EVENTS.ROOM_ENDED);
      socket.off(SOCKET_EVENTS.ROOM_ERROR);
      socket.off(SOCKET_EVENTS.START_GAME);
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE);
    };
  }, [roomId, setRoom]);

  const handleToggleReady = () => {
    if (!currentRoom || !user || !roomId) return;

    const host = typeof currentRoom.host === 'object' ? (currentRoom.host as SharedUser) : null;
    const guest = typeof currentRoom.guest === 'object' ? (currentRoom.guest as SharedUser) : null;
    
    const isHost = host && user.id === host._id;
    const isGuest = guest && user.id === guest._id;

    if (isHost) {
      if (currentRoom.hostReady) {
        socketService.emit(SOCKET_EVENTS.PLAYER_NOT_READY, { roomId });
      } else {
        socketService.emit(SOCKET_EVENTS.PLAYER_READY, { roomId });
      }
    } else if (isGuest) {
      if (currentRoom.guestReady) {
        socketService.emit(SOCKET_EVENTS.PLAYER_NOT_READY, { roomId });
      } else {
        socketService.emit(SOCKET_EVENTS.PLAYER_READY, { roomId });
      }
    }
  };

  const handleLeaveRoom = () => {
    if (!roomId) return;
    if (!isPractice) {
      socketService.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId });
    }
    setRoom(null);
    navigate('/dashboard');
  };

  const handleCopyCode = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !roomId) return;
    socketService.emit(SOCKET_EVENTS.SEND_MESSAGE, { roomId, message: chatInput.trim() });
    setChatInput('');
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <div className="text-5xl mb-6 animate-bounce">🎱</div>
        <p className="text-slate-400 font-display text-sm font-semibold tracking-wide uppercase">
          Loading game room details...
        </p>
      </div>
    );
  }

  if (error || !currentRoom) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-6 bg-slate-900 border border-white/10 rounded-2xl shadow-xl">
        <span className="text-4xl block mb-4">⚠️</span>
        <h3 className="text-lg font-bold font-display text-white">Lobby Error</h3>
        <p className="text-xs text-slate-400 font-body mt-2 leading-relaxed">
          {error || 'Unable to join the room.'}
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block py-2.5 px-6 bg-gradient-to-r from-pool-cyan to-pool-cyan/85 text-pool-dark font-display font-bold text-xs rounded-xl shadow-lg hover:brightness-110 transition"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const host = typeof currentRoom.host === 'object' ? (currentRoom.host as SharedUser) : null;
  const guest = typeof currentRoom.guest === 'object' ? (currentRoom.guest as SharedUser) : null;
  
  const isHost = host && user && user.id === host._id;
  const isGuest = guest && user && user.id === guest._id;
  const isSpectator = !isPractice && currentRoom && !isHost && !isGuest;
  
  const currentUserReady = isHost ? currentRoom.hostReady : isGuest ? currentRoom.guestReady : false;

  // ─── PLAYING VIEW (GAME STARTED PLACEHOLDER) ───
  if (gameStarted || (isSpectator && currentRoom.status === 'playing')) {
    return (
      <div className="max-w-[1300px] mx-auto w-full px-4 py-8">
        <div className="p-8 bg-slate-950 border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden text-center">
          {/* Subtle neon glowing table border */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pool-cyan via-pool-purple to-pool-cyan shadow-[0_0_15px_#00f0ff]" />

          <h2 className="text-3xl font-extrabold font-display text-white tracking-widest uppercase animate-pulse">
            {isPractice ? '🎱 PRACTICE & TRAINING' : isSpectator ? '📹 SPECTATOR MODE (LIVE)' : '🎱 MATCH IN PROGRESS'}
          </h2>
          <p className="text-xs text-pool-cyan font-body mt-2">
            {isPractice 
              ? 'Practice your shots, test angles, and refine your controls.' 
              : isSpectator
              ? 'You are spectating this live match in real-time. Shot controls are disabled.'
              : 'Dynamic waiting room countdown finished. Game successfully initialized!'}
          </p>

          {/* 3D Scene Viewport rendered from structured boilerplate */}
          <div className="my-8 max-w-[1200px] mx-auto">
            <ParticleProvider>
              <Scene roomId={roomId} isHost={!!isHost} isPractice={isPractice} isSpectator={!!isSpectator} />
            </ParticleProvider>
          </div>

          {!isPractice && (
            <div className="flex justify-center items-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-sm font-bold text-white font-display truncate max-w-[120px]">{host?.username}</div>
                <div className="text-[10px] font-bold text-pool-cyan uppercase tracking-wider mt-0.5">Host</div>
              </div>
              <div className="text-slate-600 font-display text-2xl font-bold">VS</div>
              <div className="text-center">
                <div className="text-sm font-bold text-white font-display truncate max-w-[120px]">{guest?.username}</div>
                <div className="text-[10px] font-bold text-pool-purple uppercase tracking-wider mt-0.5">Opponent</div>
              </div>
            </div>
          )}

          <button
            onClick={handleLeaveRoom}
            className="py-3 px-8 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-display font-bold text-xs rounded-xl shadow transition duration-300 transform active:scale-95"
          >
            Leave Match & Exit
          </button>
        </div>
      </div>
    );
  }

  // ─── WAITING ROOM VIEW WITH SOCKET SYNC ───
  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8">
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl">
          <div className="text-8xl font-black font-display text-pool-cyan animate-ping">
            {countdown}
          </div>
          <p className="text-sm font-bold text-slate-400 font-display uppercase tracking-widest mt-6">
            Both players ready! Launching match...
          </p>
        </div>
      )}

      <div className="p-8 bg-slate-900 border border-white/10 rounded-2xl shadow-xl relative overflow-hidden">
        {/* Glowing background highlights */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-pool-cyan/5 blur-3xl pointer-events-none" />

        {/* Heading */}
        <div className="text-center mb-8">
          <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest bg-pool-cyan/15 text-pool-cyan border border-pool-cyan/35 rounded-full select-none">
            Match Waiting Room
          </span>
          <h2 className="text-3xl font-extrabold font-display text-white mt-4 tracking-wide">
            ROOM CODE: <span className="text-pool-cyan select-all">{currentRoom.roomId}</span>
          </h2>
          <div className="flex justify-center items-center gap-3 mt-3">
            <button
              onClick={handleCopyCode}
              className="py-1 px-3 bg-white/5 hover:bg-white/10 border border-white/15 rounded-lg text-xs font-semibold text-slate-300 transition duration-300 font-display flex items-center gap-1.5 active:scale-95"
            >
              {copyFeedback ? '✓ Copied' : '📋 Copy Code'}
            </button>
            <span className="text-slate-600 font-display">|</span>
            <span className="text-slate-400 font-body text-xs">
              {currentRoom.isPrivate ? '🔒 Private' : '🌐 Public'}
            </span>
          </div>
        </div>

        {/* Players Slot Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div>
            <div className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest font-display mb-2 flex items-center justify-center gap-1.5">
              <span>Player 1 (Host)</span>
              {currentRoom.hostReady ? (
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              ) : (
                <span className="w-2 h-2 bg-rose-500 rounded-full" />
              )}
            </div>
            <PlayerCard 
              user={host} 
              isHost={true} 
              label={currentRoom.hostReady ? 'READY' : 'WAITING'} 
            />
          </div>
          <div>
            <div className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest font-display mb-2 flex items-center justify-center gap-1.5">
              <span>Player 2 (Opponent)</span>
              {guest && (
                currentRoom.guestReady ? (
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                ) : (
                  <span className="w-2 h-2 bg-rose-500 rounded-full" />
                )
              )}
            </div>
            <PlayerCard 
              user={guest} 
              isHost={false} 
              label={guest ? (currentRoom.guestReady ? 'READY' : 'WAITING') : undefined} 
            />
          </div>
        </div>

        {/* Status & Toggle Ready Box */}
        <div className="p-4 bg-slate-950 border border-white/5 rounded-xl text-center mb-6">
          {guest ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-emerald-400 font-display font-semibold text-sm">
                Opponent Joined! Ready up to start match.
              </p>
              
              <button
                onClick={handleToggleReady}
                className={`py-2.5 px-6 font-display font-bold text-xs rounded-xl shadow-md transition-all duration-300 transform active:scale-95 ${
                  currentUserReady
                    ? 'bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400'
                    : 'bg-gradient-to-r from-pool-cyan to-pool-cyan/85 hover:brightness-110 text-pool-dark hover:shadow-lg hover:shadow-pool-cyan/10'
                }`}
              >
                {currentUserReady ? '✕ Set Not Ready' : '✓ Set Ready'}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-pool-cyan font-display font-semibold text-sm flex items-center justify-center gap-2">
                <span className="inline-block w-2 h-2 bg-pool-cyan rounded-full animate-ping" />
                Waiting for an opponent to join...
              </p>
              <p className="text-[11px] text-slate-500 font-body mt-1 leading-normal">
                Give friends the code above or keep it public for matchmaking.
              </p>
            </div>
          )}
        </div>

        {/* Lobby Chat Panel */}
        <div className="mb-6 bg-slate-950/60 border border-white/5 rounded-xl p-4 flex flex-col h-[280px]">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-display mb-2 border-b border-white/5 pb-2 text-left">
            💬 Lobby Chat (Temporary)
          </div>
          
          {/* Messages Log */}
          <div className="flex-grow overflow-y-auto mb-3 space-y-2 pr-1 text-left">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-600 font-body select-none">
                No messages yet. Start typing below!
              </div>
            ) : (
              messages.map((msg, index) => {
                const isSelf = msg.senderId === user?.id;
                return (
                  <div key={index} className={`flex items-start gap-2.5 ${isSelf ? 'flex-row-reverse' : ''}`}>
                    {/* Mini Avatar */}
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs overflow-hidden shrink-0">
                      {msg.avatar ? (
                        <img 
                          src={`/src/assets/avatars/${msg.avatar}.png`} 
                          alt="Avatar" 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as any).style.display = 'none';
                          }}
                        />
                      ) : null}
                      <span className="text-[10px]">👤</span>
                    </div>
                    
                    {/* Message Bubble */}
                    <div className="max-w-[75%]">
                      <div className={`text-[9px] text-slate-500 font-display mb-0.5 ${isSelf ? 'text-right' : 'text-left'}`}>
                        {msg.username}
                      </div>
                      <div className={`py-1.5 px-3 rounded-xl text-xs font-body break-words leading-relaxed ${
                        isSelf 
                          ? 'bg-pool-cyan/15 border border-pool-cyan/25 text-pool-cyan rounded-tr-none' 
                          : 'bg-slate-900 border border-white/5 text-slate-200 rounded-tl-none'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>
          
          {/* Chat Input Field */}
          <form onSubmit={handleSendChatMessage} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow px-3 py-2 bg-slate-900 border border-white/5 focus:border-pool-cyan focus:outline-none rounded-lg text-white font-body text-xs transition duration-200"
            />
            <button
              type="submit"
              className="py-2 px-4 bg-pool-cyan hover:brightness-110 active:scale-95 text-pool-dark font-display font-bold text-xs rounded-lg transition"
            >
              Send
            </button>
          </form>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleLeaveRoom}
            disabled={isActionLoading}
            className="w-full py-3.5 bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 text-slate-300 font-display font-bold text-xs rounded-xl shadow transition duration-300 transform active:scale-95 disabled:opacity-50"
          >
            {isActionLoading ? 'Leaving...' : '🚪 Leave Room'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Game;
