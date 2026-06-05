module.exports = (io) => {
  // Store room state in memory for fast access
  const roomUsers = new Map(); // roomId -> Set of user objects
  const roomCode = new Map(); // roomId -> { code: string, language: string }
  const roomChat = new Map(); // roomId -> Array of message objects

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join Room
    socket.on('join-room', ({ roomId, user }) => {
      socket.join(roomId);
      
      const userData = { socketId: socket.id, ...user };
      
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Set());
      }
      
      const usersInRoom = roomUsers.get(roomId);
      
      // Deduplicate by user._id to prevent React StrictMode ghost connections
      for (const u of usersInRoom) {
        if (u._id === user._id) {
          usersInRoom.delete(u);
        }
      }
      
      usersInRoom.add(userData);
      
      // Store current room on socket for disconnect handling
      socket.roomId = roomId;
      socket.user = userData;

      // Broadcast to others in the room
      socket.to(roomId).emit('user-joined', { 
        user: userData, 
        users: Array.from(usersInRoom) 
      });

      // Send current state (users + existing code + chat) to the joining user
      socket.emit('room-state', {
        users: Array.from(usersInRoom),
        code: roomCode.get(roomId)?.code || '',
        language: roomCode.get(roomId)?.language || 'javascript',
        chat: roomChat.get(roomId) || [],
      });
      
      console.log(`User ${user.name} joined room ${roomId}`);
    });

    // ─── Code Collaboration ──────────────────────────────────────────────────

    // Editor/Whiteboard sockets join the room channel without affecting presence/user list
    socket.on('editor-join', ({ roomId, user }) => {
      socket.join(roomId);
      socket.user = user; // Store the user so cursor broadcasts know the name
    });

    // Editor requests current code on join (doesn't affect user list)
    socket.on('code-request', ({ roomId }) => {
      const state = roomCode.get(roomId);
      socket.emit('code-response', {
        code: state?.code || '',
        language: state?.language || 'javascript',
      });
    });

    // A user typed something - broadcast to everyone ELSE in the room
    socket.on('code-change', ({ roomId, code, language }) => {
      // Persist the latest code in server memory (so new joiners get it)
      roomCode.set(roomId, { code, language });
      // Relay to all OTHER sockets in the room (not the sender)
      socket.to(roomId).emit('code-change', { code, language });
    });

    // A user moved their cursor
    socket.on('cursor-change', ({ roomId, cursor }) => {
      socket.to(roomId).emit('cursor-change', {
        socketId: socket.id,
        name: socket.user?.name || 'Anonymous',
        cursor,
      });
    });

    // ─── Whiteboard Collaboration ────────────────────────────────────────────

    // A user drew a stroke - broadcast to others
    socket.on('whiteboard-draw', ({ roomId, stroke }) => {
      socket.to(roomId).emit('whiteboard-draw', { stroke });
    });

    // A user cleared the whiteboard
    socket.on('whiteboard-clear', ({ roomId }) => {
      socket.to(roomId).emit('whiteboard-clear');
    });

    // A user moved their cursor on the whiteboard
    socket.on('whiteboard-cursor', ({ roomId, cursor }) => {
      socket.to(roomId).emit('whiteboard-cursor', {
        socketId: socket.id,
        name: socket.user?.name || 'Anonymous',
        cursor,
      });
    });

    // ─── Evaluation Sync ─────────────────────────────────────────────────────

    socket.on('update-evaluation', ({ roomId, scores }) => {
      // Broadcast live score updates to all OTHER participants in the room
      socket.to(roomId).emit('evaluation-updated', { scores });
    });

    // ─── Tab Sync ────────────────────────────────────────────────────────────

    // When any user switches tabs (editor/whiteboard), broadcast to others
    socket.on('tab-change', ({ roomId, tab }) => {
      socket.to(roomId).emit('tab-change', { tab });
    });

    // ─── Chat Collaboration ──────────────────────────────────────────────────

    socket.on('chat-message', ({ roomId, text }) => {
      if (!roomChat.has(roomId)) {
        roomChat.set(roomId, []);
      }
      
      const message = {
        id: Math.random().toString(36).substring(2, 9),
        socketId: socket.id,
        sender: socket.user?.name || 'Anonymous',
        text,
        timestamp: new Date().toISOString()
      };
      
      roomChat.get(roomId).push(message);
      
      // Keep only last 500 messages to prevent memory leak
      if (roomChat.get(roomId).length > 500) {
        roomChat.get(roomId).shift();
      }

      // Broadcast to everyone (including sender, or we could use socket.to() and let sender append locally)
      // We'll use io.to() so everyone gets the exact same server-side message object
      io.to(roomId).emit('chat-message', message);
    });

    // ─── WebRTC Video/Audio Signaling ────────────────────────────────────────

    socket.on('webrtc-offer', ({ targetSocketId, offer }) => {
      io.to(targetSocketId).emit('webrtc-offer', {
        socketId: socket.id,
        offer
      });
    });

    socket.on('webrtc-answer', ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit('webrtc-answer', {
        socketId: socket.id,
        answer
      });
    });

    socket.on('webrtc-ice-candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('webrtc-ice-candidate', {
        socketId: socket.id,
        candidate
      });
    });

    // ─── Disconnect ──────────────────────────────────────────────────────────

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      const roomId = socket.roomId;
      const user = socket.user;
      
      if (roomId && user) {
        const usersInRoom = roomUsers.get(roomId);
        if (usersInRoom) {
          usersInRoom.forEach(u => {
            if (u.socketId === socket.id) usersInRoom.delete(u);
          });
          
          if (usersInRoom.size === 0) {
            roomUsers.delete(roomId);
            roomCode.delete(roomId); // Clean up code when room is empty
          } else {
            // Broadcast to others
            io.to(roomId).emit('user-left', { 
              socketId: socket.id,
              users: Array.from(usersInRoom)
            });
          }
        }
      }
    });
  });
};
