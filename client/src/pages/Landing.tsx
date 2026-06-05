import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Card from '../components/Card';

const Landing = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const cursorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        // Offset by half the width/height (250px) to center the glow on the cursor
        cursorRef.current.style.transform = `translate(${e.clientX - 250}px, ${e.clientY - 250}px)`;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (activeTab === 'register') {
        const { data } = await api.post('/auth/register', { name, email, password });
        login(data, data.token);
      } else {
        const { data } = await api.post('/auth/login', { email, password });
        login(data, data.token);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="relative min-h-screen bg-dark-900 overflow-hidden flex items-center justify-center p-4">
      {/* Background Shader Placeholder */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-dark-800 via-dark-900 to-black z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-cyan/20 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/20 rounded-full blur-[128px]"></div>
      </div>

      {/* Interactive Cursor Glow */}
      <div 
        ref={cursorRef} 
        className="pointer-events-none fixed top-0 left-0 w-[500px] h-[500px] rounded-full blur-[150px] opacity-50 mix-blend-screen bg-gradient-to-r from-accent-cyan/30 to-accent-purple/30 z-0 transition-transform duration-700 ease-out"
        style={{ transform: 'translate(-500px, -500px)' }} // Start hidden off-screen
      ></div>

      <Card className="w-full max-w-md relative z-10" innerClassName="p-8 items-center border border-white/5">
        <Logo className="w-64 mb-6" />
        <p className="text-gray-400 text-sm mb-8 text-center font-mono">
          Collaborative technical interviews engineered for scale.
        </p>

        <div className="flex w-full bg-black/40 rounded-lg p-1 mb-6 border border-white/5">
          <button
            onClick={() => { setActiveTab('login'); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'login' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'register' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && <div className="w-full text-red-400 text-sm mb-4 font-mono text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {activeTab === 'register' && (
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-mono">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-cyan transition-colors"
                placeholder="John Doe"
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-mono">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-cyan transition-colors"
              placeholder="name@company.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-mono">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-cyan transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
              icon
            >
              {activeTab === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Landing;
