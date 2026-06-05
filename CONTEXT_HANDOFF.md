Project: ByteRoom — MERN collaborative interview platform.

Stack: React 18 + TypeScript client, Express + Socket.IO server, MongoDB via Mongoose, WebRTC for P2P video/audio, Yjs for CRDT code sync, CodeMirror 6 for the editor, react-konva for whiteboard.

State is managed through three React contexts:
- AuthContext: user session, JWT, login/logout
- RoomContext: socket instance, room users, code, language, chat, evaluation scores
- MediaContext: local/remote MediaStreams, WebRTC RTCPeerConnections, mic/camera toggles

Socket.IO handles: room presence, code change relay, cursor positions, whiteboard op sync, chat, and WebRTC signaling (offer/answer/ICE).

Current phase: Phase 1 — Foundation & Auth
Current task: Starting Phase 1 tasks (setting up project structure and boilerplate).

Do not break the three-context architecture. All socket logic lives in hooks (useSocket, useWebRTC, useCollabEditor, useWhiteboard). Components only consume context and call hook functions — no raw socket.emit calls in JSX files.
