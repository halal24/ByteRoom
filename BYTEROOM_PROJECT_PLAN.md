# ByteRoom — Project Plan

> Collaborative interview platform with real-time code editing, live video/audio, collaborative whiteboards, cursor tracking, and interview scheduling.

---

## Tech Stack

### Frontend
| Layer | Technology | Purpose |
|---|---|---|
| Framework | React 18 + TypeScript | UI, component model |
| Routing | React Router v6 | Page navigation |
| State | Context API + useReducer | Global auth, room, media state |
| Code Editor | @uiw/react-codemirror + CodeMirror 6 | Multi-language editor with syntax highlighting |
| Real-time Collab | Yjs + y-codemirror | CRDT-based conflict-free collaborative editing |
| Socket Client | socket.io-client | Room events, signaling, chat |
| Video/Audio | WebRTC (native browser API) | Peer-to-peer video and microphone |
| Whiteboard | Konva.js / react-konva | Canvas-based collaborative whiteboard |
| Styling | CSS Modules + custom design tokens | Scoped styling, consistent theme |
| HTTP Client | Axios | REST API calls |
| Fonts | Syne (headings) + Space Mono (code/UI) | Brand typography |

### Backend
| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js 20+ | Server runtime |
| Framework | Express.js | REST API |
| Real-time | Socket.IO 4 | WebSocket rooms, WebRTC signaling, sync |
| Database | MongoDB (Mongoose) | Users, rooms, schedules, evaluations |
| Auth | JWT (jsonwebtoken) + bcryptjs | Stateless auth, password hashing |
| UUID | uuid v4 | Room ID generation |
| Env | dotenv | Environment config |
| Dev | nodemon | Hot reload in development |

### Infrastructure (Recommended)
| Service | Option | Purpose |
|---|---|---|
| MongoDB | MongoDB Atlas (free tier) | Hosted DB |
| Backend hosting | Railway / Render | Node server |
| Frontend hosting | Vercel / Netlify | React build |
| TURN server | Metered.ca (free tier) | WebRTC NAT traversal |
| Code execution | Judge0 API | Sandboxed multi-language run |

---

## Project Structure

```
byteroom/
├── server/                        # Express + Socket.IO backend
│   ├── index.js                   # Entry: HTTP server, Socket.IO, MongoDB connect
│   ├── socket/
│   │   └── index.js               # All socket event handlers
│   ├── models/
│   │   ├── User.js                # User schema (name, email, password, role)
│   │   ├── Room.js                # Room schema (roomId, host, language, evaluation)
│   │   └── Schedule.js            # Schedule schema (interviewer, candidate, time, type)
│   ├── routes/
│   │   ├── auth.js                # POST /api/auth/register, /login, GET /me
│   │   ├── rooms.js               # CRUD rooms, evaluation update
│   │   └── schedule.js            # CRUD scheduled interviews
│   └── middleware/
│       └── auth.js                # JWT verification middleware
│
├── client/                        # React frontend
│   └── src/
│       ├── context/
│       │   ├── AuthContext.jsx     # User session, login/logout/register
│       │   ├── RoomContext.jsx     # Active room state, socket connection
│       │   └── MediaContext.jsx    # WebRTC streams, mic/camera state
│       ├── hooks/
│       │   ├── useSocket.js        # Socket.IO connection + event subscriptions
│       │   ├── useWebRTC.js        # Peer connections, offer/answer/ICE flow
│       │   ├── useCollabEditor.js  # Yjs doc + CodeMirror binding
│       │   └── useWhiteboard.js    # Konva canvas sync over socket
│       ├── pages/
│       │   ├── Landing.jsx         # Marketing/login page
│       │   ├── Dashboard.jsx       # Room list + schedule overview
│       │   ├── Room.jsx            # Main interview room (all panels)
│       │   └── Schedule.jsx        # Full schedule management page
│       ├── components/
│       │   ├── Editor/
│       │   │   ├── CodeEditor.jsx  # CodeMirror + Yjs + language switcher
│       │   │   └── CursorLayer.jsx # Remote cursor overlays
│       │   ├── Video/
│       │   │   ├── VideoGrid.jsx   # All participant video tiles
│       │   │   └── VideoTile.jsx   # Single peer: stream, mute/cam controls
│       │   ├── Whiteboard/
│       │   │   └── Whiteboard.jsx  # Konva canvas with tool palette
│       │   ├── Chat/
│       │   │   └── Chat.jsx        # Real-time room chat
│       │   ├── Evaluation/
│       │   │   └── Evaluation.jsx  # Scoring panel, persisted to MongoDB
│       │   ├── Schedule/
│       │   │   └── SchedulePanel.jsx # Upcoming interview list
│       │   └── UI/
│       │       ├── Navbar.jsx
│       │       ├── Avatar.jsx
│       │       └── Modal.jsx
│       ├── utils/
│       │   ├── api.js              # Axios instance with auth header injection
│       │   └── languages.js        # CodeMirror language extension map
│       ├── App.jsx                 # Router, context providers
│       └── index.css               # Global design tokens + utility classes
│
├── package.json                   # Root: concurrently dev script
└── BYTEROOM_PROJECT_PLAN.md       # This file
```

---

## Development Phases

### Phase 1 — Foundation & Auth
**Goal:** Users can register, log in, and land on a dashboard.

Tasks:
- Set up MongoDB Atlas + Mongoose connection
- Build `POST /api/auth/register` and `/login` with bcrypt + JWT
- `AuthContext` in React: stores `user`, `token`, exposes `login()`, `logout()`, `register()`
- Protected route wrapper using `AuthContext`
- Landing page with login/register tabs
- Dashboard shell with sidebar navigation

Completion signal: a registered user can log in and see their dashboard.

---

### Phase 2 — Room System
**Goal:** Interviewers can create rooms; participants can join via link.

Tasks:
- `POST /api/rooms` — create room, get back `roomId`
- `GET /api/rooms/:roomId` — fetch room metadata
- `RoomContext` — holds `roomId`, `users[]`, `socket` instance
- Socket server: `join-room`, `user-joined`, `user-left` events
- Room page shell with left sidebar + main panel layout
- "Create Room" flow from Dashboard
- Shareable join link (`/room/:roomId`)

Completion signal: two browser tabs can join the same room and see each other's names.

---

### Phase 3 — Collaborative Code Editor
**Goal:** Both participants see and edit code simultaneously with cursor tracking.

Tasks:
- Integrate `@uiw/react-codemirror` with `oneDark` theme
- Add CodeMirror language extensions: JavaScript, TypeScript, Python, C++, Go, Java
- `useCollabEditor` hook: Yjs `Doc` + `y-codemirror.next` binding for CRDT sync
- Socket relay: broadcast Yjs update messages between room peers
- `CursorLayer` overlay: colored cursor labels per remote user
- Language switcher in sidebar — emits `language-change` socket event
- File tab bar (multiple scratch files per session)

Completion signal: two users type simultaneously with no conflicts and see each other's cursors.

---

### Phase 4 — Live Video & Audio (WebRTC)
**Goal:** Full peer-to-peer video and microphone between all room participants.

Tasks:
- `MediaContext`: calls `getUserMedia({ video: true, audio: true })`, stores `localStream`
- `useWebRTC` hook:
  - On `user-joined` → create `RTCPeerConnection`, add local tracks, create offer
  - Socket signaling: `webrtc-offer`, `webrtc-answer`, `webrtc-ice-candidate`
  - ICE servers: use free Metered.ca TURN + Google STUN
  - Store remote streams in a `Map<socketId, MediaStream>`
- `VideoTile` component: attach stream to `<video ref>` with `srcObject`
- Mute mic button: `track.enabled = false` on local audio track
- Disable camera button: replace video track with blank / hide tile
- Speaking indicator: `AudioContext` + `AnalyserNode` to detect active speaker
- `media-state` socket event: broadcast mute/camera state to peers

Completion signal: interviewer and candidate see and hear each other live.

---

### Phase 5 — Collaborative Whiteboard
**Goal:** Shared canvas for diagrams, pseudocode, and drawings.

Tasks:
- `Whiteboard.jsx` using `react-konva` Stage + Layer
- Tool palette: pen (freehand), line, rectangle, circle, text, eraser
- Color picker + stroke width selector
- On draw: emit `whiteboard-draw` with serialized operation object
- Socket server: broadcast ops, persist last 500 ops in memory
- New joiners receive full `whiteboardOps` array and replay on canvas
- `whiteboard-clear` event + confirm dialog
- Undo: local stack of ops, emit `whiteboard-undo`

Completion signal: both users draw on the board and see each other's strokes in real time.

---

### Phase 6 — Real-time Chat
**Goal:** In-room text chat with timestamps and user color coding.

Tasks:
- `Chat.jsx` with scrollable message list + input field
- `chat-message` socket emit on send (Enter key or button)
- Server broadcasts to all room members, appends to `room.chat[]`
- New joiners receive chat history in `room-state`
- User color derived from socket ID (consistent per session)
- Unread badge when chat panel is collapsed

Completion signal: multi-user text chat works in real time.

---

### Phase 7 — Interview Scheduling
**Goal:** Interviewers can schedule sessions; candidates see upcoming interviews.

Tasks:
- `Schedule` model in MongoDB
- `POST /api/schedule` — interviewer creates a session with candidate email, time, type, duration
- `GET /api/schedule` — returns all sessions for the logged-in user
- `SchedulePanel.jsx` in room sidebar: shows today's + upcoming sessions
- Full `Schedule.jsx` page: calendar-style list view, create/edit/cancel
- Status transitions: `scheduled → live → completed`
- Mark session as live when room is joined within 10 min of `scheduledAt`
- "Join Room" button on each scheduled item links to `/room/:roomId`

Completion signal: interviewer can schedule a session and candidate sees it on their dashboard.

---

### Phase 8 — Evaluation Panel
**Goal:** Interviewers can score and annotate candidates in real time.

Tasks:
- `Evaluation.jsx`: sliders for Problem Solving, Code Quality, Communication, Time Complexity, Edge Cases (0–100)
- Notes textarea for written feedback
- `update-evaluation` socket event: live score sync so candidate can optionally see scores
- `PATCH /api/rooms/:roomId/evaluation` — persist final scores to MongoDB
- Summary card: weighted overall score + color-coded rating
- Export evaluation as JSON (browser download)

Completion signal: interviewer scores a candidate; scores persist after room ends.

---

### Phase 9 — Code Execution
**Goal:** Run code inside the editor and see output without leaving ByteRoom.

Tasks:
- Integrate Judge0 API (free tier at `api.judge0.com` or self-hosted)
- `POST /api/execute` proxy route on Express (hides Judge0 API key)
- Language ID map: JavaScript → 63, Python → 71, C++ → 54, Go → 95, Java → 62
- Output panel below editor: stdout, stderr, exit code, execution time
- Run button in sidebar triggers execution with current editor content
- Loading state + timeout handling (Judge0 async polling)

Completion signal: candidate writes a solution, hits Run, and sees output in < 5 seconds.

---

### Phase 10 — Polish & Production
**Goal:** Deploy a production-ready application.

Tasks:
- Responsive layout for 1280px+ (interview rooms are desktop-first)
- Error boundaries around each major panel
- Toast notifications for join/leave/errors
- Room end flow: interviewer clicks End → saves evaluation → redirects to summary
- Add TURN server credentials from Metered.ca to WebRTC config
- Environment variable audit (no secrets in client bundle)
- Build React with `npm run build`, serve from Express `/` in production
- Deploy backend to Railway, frontend to Vercel (or serve together from Railway)
- MongoDB Atlas network access + connection string in Railway env vars
