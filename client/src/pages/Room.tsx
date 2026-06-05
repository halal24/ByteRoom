import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { useRoomContext } from '../context/RoomContext';
import api from '../utils/api';
import Editor from '../components/Editor';
import Whiteboard from '../components/Whiteboard';
import VideoGrid from '../components/VideoGrid';
import Chat from '../components/Chat';
import Evaluation from '../components/Evaluation';

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinRoom, leaveRoom, users, activeTab, emitTabChange } = useRoomContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roomTitle, setRoomTitle] = useState('');
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const initRoom = async () => {
      if (!roomId) return;
      try {
        // Validate room exists
        const response = await api.get(`/rooms/${roomId}`);
        setRoomTitle(response.data.title);
        // Determine if current user is the host/interviewer
        const hostId = response.data.host?._id || response.data.host;
        setIsHost(String(hostId) === String(user?._id));
        
        // Connect socket
        if (user) {
          joinRoom(roomId, user);
        }
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || err.message || 'Room not found or invalid');
        setLoading(false);
      }
    };

    initRoom();

    return () => {
      leaveRoom();
    };
  }, [roomId, user, joinRoom, leaveRoom]);

  if (loading) {
    return <div className="min-h-screen bg-dark-900 text-white flex items-center justify-center font-mono">Connecting to room...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center font-mono">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="bg-white/10 px-4 py-2 rounded">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-dark-900 text-white overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 border-b border-white/10 bg-dark-800/80 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Logo className="w-24" />
          <span className="font-semibold text-sm">{roomTitle || 'Technical Interview'} <span className="text-gray-500 font-mono text-xs ml-2">(ID: {roomId})</span></span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs font-mono text-accent-cyan">{users.length} connected</div>
          <button onClick={() => navigate('/dashboard')} className="bg-red-500/20 text-red-400 text-sm px-3 py-1.5 rounded hover:bg-red-500/30 transition-colors">
            Leave Room
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (Tools) */}
        <div className="w-16 border-r border-white/10 bg-dark-800/50 flex flex-col items-center py-4 gap-4">
          <button 
            onClick={() => emitTabChange(roomId!, 'editor')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${activeTab === 'editor' ? 'bg-accent-cyan/10 text-accent-cyan' : 'text-gray-500 hover:text-white hover:bg-white/5'}`} 
            title="Code Editor"
          >
            &lt;/&gt;
          </button>
          <button 
            onClick={() => emitTabChange(roomId!, 'whiteboard')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${activeTab === 'whiteboard' ? 'bg-accent-cyan/10 text-accent-cyan' : 'text-gray-500 hover:text-white hover:bg-white/5'}`} 
            title="Whiteboard"
          >
            ✎
          </button>
          {/* Evaluation tab: only visible to the interviewer (room host) */}
          {isHost && (
            <button 
              onClick={() => emitTabChange(roomId!, 'evaluation')}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors text-sm ${activeTab === 'evaluation' ? 'bg-accent-cyan/10 text-accent-cyan' : 'text-gray-500 hover:text-white hover:bg-white/5'}`} 
              title="Evaluation"
            >
              ★
            </button>
          )}
        </div>

        {/* Main Panel (Editor or Whiteboard) */}
        <div className="flex-1 flex flex-col p-4 relative">
          {activeTab === 'editor' ? (
            <Editor roomId={roomId!} />
          ) : activeTab === 'whiteboard' ? (
            <Whiteboard roomId={roomId!} />
          ) : activeTab === 'evaluation' && isHost ? (
            <div className="flex-1 flex flex-col glass-panel rounded-xl overflow-hidden">
              <div className="p-3 border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-gray-400">Evaluation Panel</div>
              <Evaluation roomId={roomId!} />
            </div>
          ) : (
            <Editor roomId={roomId!} />
          )}
        </div>

        {/* Right Panel (Video/Chat Placeholder) */}
        <div className="w-80 border-l border-white/10 bg-dark-800/30 flex flex-col gap-4">
          {/* Video Grid */}
          <div className="h-3/5 border-b border-white/10 flex flex-col relative">
             <VideoGrid roomId={roomId!} />
          </div>
          
          {/* Chat */}
          <div className="flex-1 flex flex-col bg-black/20 rounded-xl overflow-hidden border border-white/10 shadow-lg relative">
            <Chat roomId={roomId!} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
