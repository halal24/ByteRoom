import { useCallback, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { User } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5005';

export interface ChatMessage {
  id: string;
  socketId: string;
  sender: string;
  text: string;
  timestamp: string;
}

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'whiteboard' | 'evaluation'>('editor');

  const connectSocket = useCallback(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket'],
      });
    }
    return socketRef.current;
  }, []);

  const joinRoom = useCallback((roomId: string, user: User) => {
    const socket = connectSocket();
    socket.emit('join-room', { roomId, user });

    // Clean up our specific listeners to prevent duplicates if joinRoom is called multiple times.
    // NOTE: We do NOT call socket.off('user-joined') or 'user-left' without arguments,
    // because useWebRTC also listens to those events and we don't want to wipe them out!
    socket.off('room-state');
    socket.off('chat-message');

    socket.on('room-state', ({ users, chat }) => {
      setUsers(users);
      if (chat) setMessages(chat);
    });

    socket.on('user-joined', ({ user, users }) => {
      setUsers(users);
    });

    socket.on('user-left', ({ socketId, users }) => {
      setUsers(users);
    });

    socket.on('chat-message', (message: ChatMessage) => {
      setMessages(prev => {
        // Bulletproof deduplication: prevent same message from being added twice
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    // Listen for tab switches from other users in the room
    socket.off('tab-change');
    socket.on('tab-change', ({ tab }: { tab: 'editor' | 'whiteboard' | 'evaluation' }) => {
      setActiveTab(tab);
    });
  }, [connectSocket]);

  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setUsers([]);
    setMessages([]);
  }, []);

  const sendMessage = useCallback((roomId: string, text: string) => {
    if (socketRef.current && text.trim()) {
      socketRef.current.emit('chat-message', { roomId, text: text.trim() });
    }
  }, []);

  // Emit a tab-change event so all other users in the room switch view
  const emitTabChange = useCallback((roomId: string, tab: 'editor' | 'whiteboard' | 'evaluation') => {
    if (socketRef.current) {
      socketRef.current.emit('tab-change', { roomId, tab });
      // Also update our own local state so it's consistent
      setActiveTab(tab);
    }
  }, []);

  return {
    socket: socketRef.current,
    users,
    messages,
    activeTab,
    joinRoom,
    leaveRoom,
    sendMessage,
    emitTabChange,
  };
};
