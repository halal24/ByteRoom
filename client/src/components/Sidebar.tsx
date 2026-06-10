import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// The compact <> icon shown when collapsed
const BracketIcon = () => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
    <defs>
      <linearGradient id="sidebarBracketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#0ea5e9', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
      </linearGradient>
      <filter id="sidebarGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <rect width="100" height="100" fill="#0b1326" rx="16" />
    <path d="M42 35 L30 50 L42 65" fill="none" stroke="url(#sidebarBracketGrad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" filter="url(#sidebarGlow)" />
    <path d="M58 35 L70 50 L58 65" fill="none" stroke="url(#sidebarBracketGrad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" filter="url(#sidebarGlow)" />
  </svg>
);

// The full <ByteRoom> logo shown when expanded
const FullLogo = () => (
  <svg viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
    <defs>
      <linearGradient id="fullLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#818cf8', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#22d3ee', stopOpacity: 1 }} />
      </linearGradient>
      <filter id="fullLogoGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="transparent" rx="8"/>
    <path d="M60 40L30 75L60 110" fill="none" stroke="url(#fullLogoGrad)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" filter="url(#fullLogoGlow)"/>
    <text x="200" y="90" fontFamily="'Courier New', Courier, monospace" fontWeight="900" fontSize="48" textAnchor="middle" fill="#f8fafc" letterSpacing="-1">ByteRoom</text>
    <path d="M340 40L370 75L340 110" fill="none" stroke="url(#fullLogoGrad)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" filter="url(#fullLogoGlow)"/>
    <rect x="315" y="55" width="6" height="40" fill="#22d3ee" filter="url(#fullLogoGlow)">
      <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
    </rect>
  </svg>
);

const Sidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const [hovered, setHovered] = useState(false);

  // Sidebar is expanded only while hovered
  const expanded = hovered;

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      to: '/schedule',
      label: 'Schedule',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="relative flex flex-col border-r border-white/10 bg-dark-800/50 transition-all duration-300 ease-in-out overflow-hidden"
      style={{ width: expanded ? '220px' : '68px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Logo Area */}
      <div className="flex items-center justify-center h-20 px-2 overflow-hidden">
        {/* Bracket icon always visible, fades out when expanded */}
        <div
          className="absolute transition-all duration-300"
          style={{ opacity: expanded ? 0 : 1, transform: expanded ? 'scale(0.7)' : 'scale(1)' }}
        >
          <BracketIcon />
        </div>
        {/* Full logo fades in when expanded */}
        <div
          className="w-full px-3 transition-all duration-300"
          style={{ opacity: expanded ? 1 : 0, transform: expanded ? 'scale(1)' : 'scale(0.9)' }}
        >
          <FullLogo />
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 space-y-1 mt-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              <span
                className="text-sm font-medium whitespace-nowrap transition-all duration-300"
                style={{
                  opacity: expanded ? 1 : 0,
                  maxWidth: expanded ? '160px' : '0px',
                  overflow: 'hidden',
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="border-t border-white/10 p-2 mt-auto">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span
            className="text-sm font-medium whitespace-nowrap transition-all duration-300"
            style={{
              opacity: expanded ? 1 : 0,
              maxWidth: expanded ? '160px' : '0px',
              overflow: 'hidden',
            }}
          >
            Sign Out
          </span>
        </button>
      </div>
    </div>
  );
};

// Keep export for compatibility with Dashboard and Schedule imports
export const useSidebarState = () => {
  const [collapsed] = useState(false);
  const toggle = () => {};
  return { collapsed, toggle };
};

export default Sidebar;
