import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

export const useWebRTC = (socket: Socket | null, roomId: string) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  // Configuration for ICE servers
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  useEffect(() => {
    if (!socket || !roomId) return;

    // 1. Get Local Media Stream
    const initLocalMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        localStreamRef.current = stream;
      } catch (err) {
        console.error('Failed to get local media:', err);
      }
    };

    initLocalMedia();

    return () => {
      // Cleanup local stream on unmount
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      // Cleanup all peer connections
      Object.values(peerConnections.current).forEach(pc => pc.close());
    };
  }, [socket, roomId]);

  const createPeerConnection = (targetSocketId: string, isInitiator: boolean) => {
    if (peerConnections.current[targetSocketId]) {
      return peerConnections.current[targetSocketId];
    }

    const pc = new RTCPeerConnection(rtcConfig);
    peerConnections.current[targetSocketId] = pc;

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        if (localStreamRef.current) {
           pc.addTrack(track, localStreamRef.current);
        }
      });
    }

    // Handle incoming ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc-ice-candidate', {
          targetSocketId,
          candidate: event.candidate
        });
      }
    };

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [targetSocketId]: event.streams[0]
      }));
    };

    // Cleanup when connection closes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[targetSocketId];
          return next;
        });
        delete peerConnections.current[targetSocketId];
      }
    };

    return pc;
  };

  // Socket Event Listeners for Signaling
  useEffect(() => {
    if (!socket) return;

    // Helper to wait for the local stream to be ready before initiating or responding to connections
    const waitForStream = async () => {
      let attempts = 0;
      while (!localStreamRef.current && attempts < 100) { // wait up to 10 seconds
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }
    };

    // When a new user joins, initiate the WebRTC handshake
    const handleUserJoined = async ({ user }: any) => {
      await waitForStream();
      if (!localStreamRef.current) return; // if still no permissions, abort

      const targetSocketId = user.socketId;
      const pc = createPeerConnection(targetSocketId, true);
      
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', { targetSocketId, offer });
      } catch (err) {
        console.error('Error creating offer', err);
      }
    };

    const handleReceiveOffer = async ({ socketId, offer }: any) => {
      await waitForStream();
      if (!localStreamRef.current) return;

      const pc = createPeerConnection(socketId, false);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc-answer', { targetSocketId: socketId, answer });
      } catch (err) {
        console.error('Error handling offer', err);
      }
    };

    const handleReceiveAnswer = async ({ socketId, answer }: any) => {
      const pc = peerConnections.current[socketId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Error setting remote description from answer', err);
        }
      }
    };

    const handleReceiveIceCandidate = async ({ socketId, candidate }: any) => {
      const pc = peerConnections.current[socketId];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate', err);
        }
      }
    };

    const handleUserLeft = ({ socketId }: any) => {
       if (peerConnections.current[socketId]) {
          peerConnections.current[socketId].close();
          delete peerConnections.current[socketId];
       }
       setRemoteStreams(prev => {
         const next = { ...prev };
         delete next[socketId];
         return next;
       });
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('webrtc-offer', handleReceiveOffer);
    socket.on('webrtc-answer', handleReceiveAnswer);
    socket.on('webrtc-ice-candidate', handleReceiveIceCandidate);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('webrtc-offer', handleReceiveOffer);
      socket.off('webrtc-answer', handleReceiveAnswer);
      socket.off('webrtc-ice-candidate', handleReceiveIceCandidate);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket]); // Remove localStream dependency so listeners attach immediately

  // Controls
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  };

  return {
    localStream,
    remoteStreams,
    toggleAudio,
    toggleVideo
  };
};
