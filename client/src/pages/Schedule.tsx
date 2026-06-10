import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Button from '../components/Button';
import Card from '../components/Card';
import Sidebar from '../components/Sidebar';

interface ScheduleItem {
  _id: string;
  title: string;
  candidateEmail: string;
  scheduledAt: string;
  duration: number;
  roomId: string;
  status: string;
  interviewer: { name: string; email: string };
}

const Schedule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSchedules = async () => {
    try {
      const { data } = await api.get('/schedule');
      setSchedules(data);
    } catch (err) {
      console.error('Error fetching schedules', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Combine date and time into ISO string
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      
      await api.post('/schedule', {
        title,
        candidateEmail,
        scheduledAt,
        duration: parseInt(duration)
      });
      
      setShowModal(false);
      // Reset form
      setTitle('');
      setCandidateEmail('');
      setDate('');
      setTime('');
      setDuration('60');
      
      // Refresh list
      fetchSchedules();
    } catch (err) {
      console.error('Failed to schedule', err);
      alert('Failed to schedule interview');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white flex">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-8 relative">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold">Interview Schedule</h2>
            <p className="text-gray-400 text-sm mt-1">Manage your technical interviews.</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex bg-dark-800/80 rounded-lg p-1 border border-white/10">
              <button 
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'upcoming' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Upcoming
              </button>
              <button 
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'completed' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Completed
              </button>
            </div>
            <Button 
              onClick={() => setShowModal(true)}
              icon
            >
              + Schedule Interview
            </Button>
          </div>
        </div>

        {loading ? (
           <div className="text-gray-500 text-sm">Loading schedules...</div>
        ) : (
           <div className="flex-1">
             {(() => {
                const now = new Date().getTime();
                const filteredSchedules = schedules.filter(item => {
                  const endTime = new Date(item.scheduledAt).getTime() + item.duration * 60000;
                  return activeTab === 'upcoming' ? endTime > now : endTime <= now;
                });

                if (filteredSchedules.length === 0) {
                  return (
                     <Card innerClassName="p-12 items-center justify-center text-center">
                       <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-500">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                       </div>
                       <h3 className="text-xl font-bold mb-2">No {activeTab} Interviews</h3>
                       <p className="text-gray-400 mb-6">
                         {activeTab === 'upcoming' ? "You don't have any interviews scheduled yet." : "You haven't completed any interviews yet."}
                       </p>
                       {activeTab === 'upcoming' && (
                         <div className="mt-2">
                           <Button onClick={() => setShowModal(true)} icon>
                              Schedule One Now
                           </Button>
                         </div>
                       )}
                     </Card>
                  );
                }

                return (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredSchedules.map(item => {
                 const date = new Date(item.scheduledAt);
                 const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
                 const hours = date.getHours() % 12 || 12;
                 const mins = date.getMinutes().toString().padStart(2, '0');
                 const timeStr = `${hours}:${mins} ${ampm}`;
                 
                 const isCandidate = user?.email === item.candidateEmail;
                 
                 return (
                     <Card key={item._id} innerClassName="p-5">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                             <span className="inline-block px-2.5 py-0.5 rounded-full bg-accent-cyan/20 text-accent-cyan text-xs font-bold mb-2">
                                {date.toLocaleDateString()}
                             </span>
                             <h3 className="text-lg font-bold">{item.title}</h3>
                           </div>
                        </div>
                        
                        <div className="text-sm text-gray-400 mb-4 space-y-1 font-mono">
                           <p>⏰ {timeStr} ({item.duration} min)</p>
                           <p>👥 {isCandidate ? 'Interviewer: ' + item.interviewer.name : 'Candidate: ' + item.candidateEmail}</p>
                           <p>🔗 Room: <span className="text-white">{item.roomId}</span></p>
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-white/10 flex gap-2 w-full">
                          <Button 
                             onClick={() => navigate(`/room/${item.roomId}`)}
                             className="w-full"
                          >
                             Join Room
                          </Button>
                        </div>
                     </Card>
                  );
               })}
            </div>
          );
        })()}
      </div>
    )}
  </div>

      {/* Schedule Modal */}
      {showModal && (
         <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md" innerClassName="p-6 border border-white/5">
               <h3 className="text-xl font-bold mb-6">Schedule Interview</h3>
               <form onSubmit={handleScheduleSubmit} className="space-y-4">
                  <div>
                     <label className="block text-sm text-gray-400 mb-1">Title</label>
                     <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Frontend Engineer - Round 1" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-accent-cyan outline-none" />
                  </div>
                  <div>
                     <label className="block text-sm text-gray-400 mb-1">Candidate Email</label>
                     <input required type="email" value={candidateEmail} onChange={e => setCandidateEmail(e.target.value)} placeholder="candidate@example.com" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-accent-cyan outline-none" />
                  </div>
                  <div className="flex gap-4">
                     <div className="flex-1">
                        <label className="block text-sm text-gray-400 mb-1">Date</label>
                        <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-accent-cyan outline-none" />
                     </div>
                     <div className="flex-1">
                        <label className="block text-sm text-gray-400 mb-1">Time</label>
                        <input required type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-accent-cyan outline-none" />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm text-gray-400 mb-1">Duration (minutes)</label>
                     <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-accent-cyan outline-none">
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">60 minutes</option>
                        <option value="90">90 minutes</option>
                        <option value="120">120 minutes</option>
                     </select>
                  </div>
                  <div className="flex justify-end gap-4 pt-4 border-t border-white/10 mt-6 items-center">
                     <button type="button" onClick={() => setShowModal(false)} disabled={isSubmitting} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50">Cancel</button>
                     <Button type="submit" disabled={isSubmitting} icon={!isSubmitting}>
                       {isSubmitting ? 'Scheduling...' : 'Schedule Session'}
                     </Button>
                  </div>
               </form>
            </Card>
         </div>
      )}
    </div>
  );
};

export default Schedule;
