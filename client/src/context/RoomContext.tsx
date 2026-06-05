import React, { createContext, useContext } from 'react';
import { useSocket } from '../hooks/useSocket';

type RoomContextType = ReturnType<typeof useSocket>;

const RoomContext = createContext<RoomContextType | null>(null);

export const RoomProvider = ({ children }: { children: React.ReactNode }) => {
  const socketState = useSocket();

  return (
    <RoomContext.Provider value={socketState}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoomContext = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoomContext must be used within a RoomProvider');
  }
  return context;
};
