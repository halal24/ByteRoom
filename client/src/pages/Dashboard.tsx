import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Logo from '../components/Logo';
import Button from '../components/Button';

const LANGUAGE_COLORS: Record<string, string> = {
  javascript: '#f7df1e',
  python: '#3572A5',
  cpp: '#f34b7d',
  java: '#b07219',
  go: '#00ADD8',
};

const LANGUAGE_LABELS: Record<string, string> = {
  javascript: 'JavaScript',
  python: 'Python',
  cpp: 'C++',
  java: 'Java',
  go: 'Go',
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);
  const [recentRooms, setRecentRooms] = useState<any[]>([]);
  const [languageUsage, setLanguageUsage] = useState<Record<string, number>>({});
  const [loadingRooms, setLoadingRooms] = useState(true);

  React.useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const { data } = await api.get('/schedule');
        const now = new Date().getTime();

        let upcoming = 0;
        let completed = 0;
        const upcomingList: any[] = [];

        data.forEach((item: any) => {
          const endTime = new Date(item.scheduledAt).getTime() + item.duration * 60000;
          if (endTime > now) {
            upcoming++;
            upcomingList.push(item);
          } else {
            completed++;
          }
        });

        setUpcomingCount(upcoming);
        setCompletedCount(completed);
        setUpcomingInterviews(upcomingList.slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch schedules', err);
      }
    };

    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);
        const { data } = await api.get('/rooms');
        setRecentRooms(data.slice(0, 5));

        // Count language usage across rooms
        const langCount: Record<string, number> = {};
        data.forEach((room: any) => {
          const lang = room.language || 'javascript';
          langCount[lang] = (langCount[lang] || 0) + 1;
        });
        setLanguageUsage(langCount);
      } catch (err) {
        console.error('Failed to fetch rooms', err);
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchSchedules();
    fetchRooms();
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

  const totalRooms = Object.values(languageUsage).reduce((a, b) => a + b, 0);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const timeFromNow = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) return `in ${days}d`;
    if (hours > 0) return `in ${hours}h`;
    return 'soon';
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
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold">Welcome Back, {user?.name?.split(' ')[0] || 'User'} 👋</h2>
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
              <Button type="submit" disabled={!joinRoomId.trim()} icon>Join</Button>
            </form>
            <Button onClick={createRoom} disabled={isCreating} icon>
              {isCreating ? 'Creating...' : '+ New Room'}
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-panel p-6 border-l-2 border-l-accent-cyan">
            <h3 className="text-gray-400 font-mono text-sm mb-2">Upcoming Interviews</h3>
            <p className="text-3xl font-bold">{upcomingCount}</p>
          </div>
          <div className="glass-panel p-6 border-l-2 border-l-accent-purple">
            <h3 className="text-gray-400 font-mono text-sm mb-2">Completed</h3>
            <p className="text-3xl font-bold">{completedCount}</p>
          </div>
          <div className="glass-panel p-6 border-l-2 border-l-green-400">
            <h3 className="text-gray-400 font-mono text-sm mb-2">Total Rooms</h3>
            <p className="text-3xl font-bold">{totalRooms}</p>
          </div>
        </div>

        {/* Bottom Grid: Upcoming + Recent Rooms + Languages */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Upcoming Interviews Expanded */}
          <div className="glass-panel p-6 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Upcoming</h3>
              <Link to="/schedule" className="text-xs text-accent-cyan hover:underline font-mono">View all →</Link>
            </div>
            {upcomingInterviews.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">📅</div>
                <p className="text-gray-500 text-sm">No upcoming interviews</p>
                <Link to="/schedule" className="text-accent-cyan text-xs hover:underline mt-2 inline-block">Schedule one →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingInterviews.map((item: any) => (
                  <div key={item._id} className="bg-white/5 rounded-lg p-3 border border-white/5 hover:border-accent-cyan/30 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium text-white truncate flex-1 mr-2">{item.title}</p>
                      <span className="text-xs font-mono text-accent-cyan bg-accent-cyan/10 px-1.5 py-0.5 rounded shrink-0">{timeFromNow(item.scheduledAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">{formatDate(item.scheduledAt)}</p>
                    <p className="text-xs text-gray-600 mt-1 truncate">📧 {item.candidateEmail}</p>
                    <button
                      onClick={() => navigate(`/room/${item.roomId}`)}
                      className="mt-2 w-full text-xs py-1.5 rounded bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan/20 transition-colors font-mono"
                    >
                      Join Room →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Rooms */}
          <div className="glass-panel p-6 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Recent Rooms</h3>
              <span className="text-xs text-gray-500 font-mono">{recentRooms.length} shown</span>
            </div>
            {loadingRooms ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentRooms.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">🚪</div>
                <p className="text-gray-500 text-sm">No rooms yet</p>
                <button onClick={createRoom} className="text-accent-cyan text-xs hover:underline mt-2 inline-block">Create your first room →</button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentRooms.map((room: any) => (
                  <button
                    key={room._id}
                    onClick={() => navigate(`/room/${room.roomId}`)}
                    className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-lg px-3 py-3 transition-colors group border border-transparent hover:border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent-purple/20 flex items-center justify-center text-accent-purple text-xs font-bold font-mono shrink-0">
                        {(room.title || 'R').charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-white truncate max-w-[130px]">{room.title || 'Untitled Room'}</p>
                        <p className="text-xs text-gray-500 font-mono">{room.roomId}</p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-600 group-hover:text-accent-cyan transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Usage Pills */}
          <div className="glass-panel p-6 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Languages Used</h3>
              <span className="text-xs text-gray-500 font-mono">{totalRooms} sessions</span>
            </div>
            {totalRooms === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">💻</div>
                <p className="text-gray-500 text-sm">No data yet</p>
                <p className="text-gray-600 text-xs mt-1">Start a room to track languages</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(languageUsage)
                  .sort(([, a], [, b]) => b - a)
                  .map(([lang, count]) => {
                    const pct = Math.round((count / totalRooms) * 100);
                    const color = LANGUAGE_COLORS[lang] || '#888';
                    return (
                      <div key={lang}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-sm text-gray-300">{LANGUAGE_LABELS[lang] || lang}</span>
                          </div>
                          <span className="text-xs font-mono text-gray-500">{count} session{count > 1 ? 's' : ''} · {pct}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.8 }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Quick language pills */}
            {totalRooms > 0 && (
              <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-white/5">
                {Object.entries(languageUsage).map(([lang]) => (
                  <span
                    key={lang}
                    className="text-xs px-2.5 py-1 rounded-full font-mono border"
                    style={{
                      color: LANGUAGE_COLORS[lang] || '#888',
                      borderColor: `${LANGUAGE_COLORS[lang] || '#888'}40`,
                      backgroundColor: `${LANGUAGE_COLORS[lang] || '#888'}15`,
                    }}
                  >
                    {LANGUAGE_LABELS[lang] || lang}
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
