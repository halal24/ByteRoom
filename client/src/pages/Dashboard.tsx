import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Logo from '../components/Logo';
import Button from '../components/Button';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  
  React.useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const { data } = await api.get('/schedule');
        const now = new Date().getTime();
        
        let upcoming = 0;
        let completed = 0;
        
        data.forEach((item: any) => {
           const endTime = new Date(item.scheduledAt).getTime() + item.duration * 60000;
           if (endTime > now) {
              upcoming++;
           } else {
              completed++;
           }
        });
        
        setUpcomingCount(upcoming);
        setCompletedCount(completed);
      } catch (err) {
        console.error('Failed to fetch schedules', err);
      }
    };
    fetchSchedules();
  }, []);
  
  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinRoomId.trim()) {
      navigate(`/room/${joinRoomId.trim()}`);
    }
  };
  
  const createRoom = async () => {
    setIsCreating(true);
    try {
      const { data } = await api.post('/rooms', {
        title: 'Technical Interview',
        language: 'javascript'
      });
      navigate(`/room/${data.roomId}`);
    } catch (err) {
      console.error('Failed to create room', err);
      alert('Failed to create room');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/10 flex flex-col p-4 bg-dark-800/50">
        <div className="flex items-center gap-3 mb-10 px-2">
          <Logo className="w-40" />
        </div>

        <nav className="space-y-2 flex-1">
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/10 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            Dashboard
          </Link>
          <Link to="/schedule" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Schedule
          </Link>
        </nav>
        
        <div className="border-t border-white/10 pt-4 mt-auto">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold">Welcome Back, {user?.name?.split(' ')[0] || 'User'}</h2>
            <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
          </div>
          <div className="flex gap-4">
            <form onSubmit={handleJoin} className="flex gap-2">
               <input 
                 type="text" 
                 value={joinRoomId} 
                 onChange={e => setJoinRoomId(e.target.value)} 
                 placeholder="Enter Room ID" 
                 className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan/50 w-40 placeholder:text-gray-600"
               />
               <Button 
                 type="submit"
                 disabled={!joinRoomId.trim()}
                 icon
               >
                 Join
               </Button>
            </form>
            <Button 
              onClick={createRoom}
              disabled={isCreating}
              icon
            >
              {isCreating ? 'Creating...' : '+ New Room'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 border-l-2 border-l-accent-cyan">
            <h3 className="text-gray-400 font-mono text-sm mb-2">Upcoming Interviews</h3>
            <p className="text-3xl font-bold">{upcomingCount}</p>
          </div>
          <div className="glass-panel p-6 border-l-2 border-l-accent-purple">
            <h3 className="text-gray-400 font-mono text-sm mb-2">Completed</h3>
            <p className="text-3xl font-bold">{completedCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
