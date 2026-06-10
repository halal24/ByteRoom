import React, { useRef, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5005';

const Whiteboard = ({ roomId }: { roomId: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#00ffcc'); // accent-cyan
  const [lineWidth, setLineWidth] = useState(3);
  const [connected, setConnected] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, { x: number, y: number, name: string, color: string }>>({});

  // Helper to get a stable color from a socket ID
  const getColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360}, 80%, 60%)`;
  };

  // Keep track of previous coordinates
  const lastPos = useRef<{x: number, y: number} | null>(null);

  // Resize canvas to match container exactly
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      
      // Save canvas content
      const ctx = canvas.getContext('2d');
      const data = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      // Restore canvas content
      if (ctx && data) {
        ctx.putImageData(data, 0, 0);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Setup Socket.io
  useEffect(() => {
    if (!user) return;
    
    // Dedicated socket connection for whiteboard (uses same channel logic as editor)
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('editor-join', { roomId, user }); // Reuse room channel and send user
    });

    socket.on('whiteboard-draw', ({ stroke }) => {
      drawStroke(stroke.x0, stroke.y0, stroke.x1, stroke.y1, stroke.color, stroke.width, false);
    });

    socket.on('whiteboard-clear', () => {
       const canvas = canvasRef.current;
       if (canvas) {
         const ctx = canvas.getContext('2d');
         ctx?.clearRect(0, 0, canvas.width, canvas.height);
       }
    });

    socket.on('whiteboard-cursor', ({ socketId, name, cursor }) => {
      setRemoteCursors(prev => ({
        ...prev,
        [socketId]: { x: cursor.x, y: cursor.y, name, color: getColor(socketId) }
      }));
    });

    socket.on('user-left', ({ socketId }) => {
      setRemoteCursors(prev => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    });

    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.disconnect();
    };
  }, [roomId, user]);

  const drawStroke = (x0: number, y0: number, x1: number, y1: number, c: string, w: number, emit: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Broadcast stroke if it's local
    if (emit && socketRef.current?.connected) {
      socketRef.current.emit('whiteboard-draw', {
        roomId,
        stroke: { x0, y0, x1, y1, color: c, width: w }
      });
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    lastPos.current = getCoordinates(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    const newPos = getCoordinates(e);

    // Broadcast cursor position even if not drawing
    if (socketRef.current?.connected) {
      socketRef.current.emit('whiteboard-cursor', { roomId, cursor: newPos });
    }

    if (!isDrawing || !lastPos.current) return;
    
    drawStroke(lastPos.current.x, lastPos.current.y, newPos.x, newPos.y, color, lineWidth, true);
    lastPos.current = newPos;
  };

  const clearBoard = () => {
     const canvas = canvasRef.current;
     if (canvas) {
       const ctx = canvas.getContext('2d');
       ctx?.clearRect(0, 0, canvas.width, canvas.height);
     }
     if (socketRef.current?.connected) {
        socketRef.current.emit('whiteboard-clear', { roomId });
     }
  };

  return (
    <div className="flex-1 flex flex-col h-full rounded-xl overflow-hidden glass-panel border border-white/5 relative">
       {/* Transparent Overlay Toolbar */}
       <div className="h-12 bg-black/40 border-b border-white/5 flex items-center justify-between px-4 absolute top-0 left-0 right-0 z-10 pointer-events-none">
          <div className="flex gap-3 items-center pointer-events-auto">
             <div className="flex gap-1.5 mr-2">
               <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
               <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
               <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
             </div>
             
             <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded border border-white/10">
               <input 
                 type="color" 
                 value={color} 
                 onChange={e => setColor(e.target.value)} 
                 className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0" 
                 title="Brush Color"
               />
               <div className="w-px h-4 bg-white/10 mx-1"></div>
               <select 
                 value={lineWidth} 
                 onChange={e => setLineWidth(Number(e.target.value))} 
                 className="bg-transparent text-white text-xs outline-none cursor-pointer"
                 title="Brush Size"
               >
                  <option value={2} className="bg-dark-900">Thin</option>
                  <option value={5} className="bg-dark-900">Medium</option>
                  <option value={10} className="bg-dark-900">Thick</option>
                  <option value={20} className="bg-dark-900">Marker</option>
               </select>
             </div>
          </div>
          
          <div className="flex gap-4 items-center pointer-events-auto">
             <span className={`text-xs font-mono ${connected ? 'text-green-400' : 'text-red-400'}`}>
               ● {connected ? 'live' : 'disconnected'}
             </span>
             <button 
               onClick={clearBoard} 
               className="bg-red-500/20 text-red-400 px-3 py-1.5 text-xs rounded hover:bg-red-500/30 transition-colors font-semibold"
             >
               Clear Board
             </button>
          </div>
       </div>

       {/* Canvas Container */}
       <div ref={containerRef} className="flex-1 w-full h-full bg-[#1e1e1e]" style={{ touchAction: 'none', position: 'relative', overflow: 'hidden' }}>
         <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onMouseMove={draw}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={draw}
            className="cursor-crosshair w-full h-full block relative z-0"
         />
         
         {/* Remote Cursors Overlay */}
         {Object.entries(remoteCursors).map(([id, c]) => (
           <div 
             key={id} 
             className="absolute pointer-events-none transition-all duration-75 ease-out z-20"
             style={{ left: c.x, top: c.y }}
           >
             <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: 'translate(-4px, -4px)' }}>
               <path d="M2.5 2.5L14.5 7.5L8.5 9.5L5.5 15.5L2.5 2.5Z" fill={c.color} stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
             </svg>
             <div 
               className="absolute left-3 top-3 text-[10px] text-white px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap font-mono tracking-tighter"
               style={{ backgroundColor: c.color }}
             >
               {c.name}
             </div>
           </div>
         ))}
       </div>
    </div>
  );
};

export default Whiteboard;
