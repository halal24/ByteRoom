import React, { useEffect, useRef, useState } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useRoomContext } from '../context/RoomContext';

const VideoPlayer = ({ stream, muted }: { stream: MediaStream | null, muted: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className="w-full h-full object-cover transform scale-x-[-1]" // mirror local video naturally
    />
  );
};

const VideoGrid = ({ roomId }: { roomId: string }) => {
  const { socket, users } = useRoomContext();
  const { localStream, remoteStreams, toggleAudio, toggleVideo } = useWebRTC(socket, roomId);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);

  const handleToggleMic = () => {
    const state = toggleAudio();
    setIsMicOn(state);
  };

  const handleToggleCam = () => {
    const state = toggleVideo();
    setIsCamOn(state);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-800/30 overflow-hidden">
      {/* Remote Streams */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-3 scrollbar-hide">
        {Object.entries(remoteStreams).map(([socketId, stream]) => {
          const remoteUser = users.find(u => u.socketId === socketId);
          return (
            <div key={socketId} className="relative w-full aspect-video bg-black/60 rounded-xl overflow-hidden border border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <VideoPlayer stream={stream} muted={false} />
              <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-xs text-white font-mono shadow-sm">
                {remoteUser?.name || 'User'}
              </div>
            </div>
          );
        })}
        {Object.keys(remoteStreams).length === 0 && (
          <div className="h-32 flex flex-col items-center justify-center text-xs text-gray-500 font-mono italic opacity-70">
             <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-600 animate-spin mb-3"></div>
             Waiting for others to join...
          </div>
        )}
      </div>

      {/* Local Video & Controls */}
      <div className="h-[120px] w-full bg-black/40 border-t border-white/5 p-3 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
         <div className="relative h-full aspect-video bg-black/60 rounded-lg overflow-hidden border border-white/10 shadow-md shrink-0">
            {localStream ? (
               <VideoPlayer stream={localStream} muted={true} />
            ) : (
               <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">Camera Off</div>
            )}
            <div className="absolute bottom-1.5 left-1.5 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-white font-mono shadow-sm">
              You
            </div>
         </div>
         <div className="flex-1 flex flex-row items-center justify-center gap-3">
            <button 
              onClick={handleToggleMic} 
              title={isMicOn ? 'Mute' : 'Unmute'}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isMicOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:bg-red-600'}`}
            >
              {isMicOn ? '🎤' : '🔇'}
            </button>
            <button 
              onClick={handleToggleCam} 
              title={isCamOn ? 'Stop Video' : 'Start Video'}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCamOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:bg-red-600'}`}
            >
              {isCamOn ? '📷' : '🚫'}
            </button>
         </div>
      </div>
    </div>
  );
};

export default VideoGrid;
