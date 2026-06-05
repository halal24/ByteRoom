import React from 'react';

const Logo = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 400 150" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="bracketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#818cf8', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#22d3ee', stopOpacity: 1 }} />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Transparent background is better for components but keeping user spec */}
    <rect width="100%" height="100%" fill="transparent" rx="8"/>
    <path d="M60 40L30 75L60 110" fill="none" stroke="url(#bracketGradient)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)"/>
    <text x="200" y="90" fontFamily="'Courier New', Courier, monospace" fontWeight="900" fontSize="48" textAnchor="middle" fill="#f8fafc" letterSpacing="-1">ByteRoom</text>
    <path d="M340 40L370 75L340 110" fill="none" stroke="url(#bracketGradient)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)"/>
    <rect x="315" y="55" width="6" height="40" fill="#22d3ee" filter="url(#glow)">
      <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
    </rect>
  </svg>
);

export default Logo;
