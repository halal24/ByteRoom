import React, { useState, useRef, useEffect } from 'react';
import { useRoomContext } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';

const Chat = ({ roomId }: { roomId: string }) => {
  const { messages, sendMessage } = useRoomContext();
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim()) {
      sendMessage(roomId, inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to get consistent color per user
  const getColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360}, 70%, 65%)`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-800/30">
      <div className="p-3 border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Room Chat
      </div>
      
      {/* Message List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-hide"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-500 font-mono italic">
            No messages yet. Say hi!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === user?.name;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-gray-500 mb-0.5 px-1 font-mono">
                  {isMe ? 'You' : msg.sender}
                </span>
                <div 
                  className={`max-w-[90%] px-3 py-2 rounded-xl text-sm break-words ${isMe ? 'bg-accent-cyan/20 text-accent-cyan rounded-tr-sm' : 'bg-white/5 text-gray-200 rounded-tl-sm border border-white/5'}`}
                  style={!isMe ? { borderLeftColor: getColor(msg.socketId), borderLeftWidth: '3px' } : {}}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-white/10 bg-black/20">
        <form onSubmit={handleSend} className="relative">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..." 
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-3 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-accent-cyan/50 transition-colors" 
          />
          <button 
            type="submit"
            disabled={!inputValue.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-accent-cyan disabled:text-gray-600 hover:text-white transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
