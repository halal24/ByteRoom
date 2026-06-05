# ByteRoom Tasks

## Phase 1 — Foundation & Auth
- [ ] Set up MongoDB Atlas + Mongoose connection
- [ ] Build `POST /api/auth/register` and `/login` with bcrypt + JWT
- [ ] `AuthContext` in React: stores `user`, `token`, exposes `login()`, `logout()`, `register()`
- [ ] Protected route wrapper using `AuthContext`
- [ ] Landing page with login/register tabs
- [ ] Dashboard shell with sidebar navigation

## Phase 2 — Room System
- [ ] `POST /api/rooms` — create room, get back `roomId`
- [ ] `GET /api/rooms/:roomId` — fetch room metadata
- [ ] `RoomContext` — holds `roomId`, `users[]`, `socket` instance
- [ ] Socket server: `join-room`, `user-joined`, `user-left` events
- [ ] Room page shell with left sidebar + main panel layout
- [ ] "Create Room" flow from Dashboard
- [ ] Shareable join link (`/room/:roomId`)

## Phase 3 — Collaborative Code Editor
- [ ] Integrate `@uiw/react-codemirror` with `oneDark` theme
- [ ] Add CodeMirror language extensions: JavaScript, TypeScript, Python, C++, Go, Java
- [ ] `useCollabEditor` hook: Yjs `Doc` + `y-codemirror.next` binding for CRDT sync
- [ ] Socket relay: broadcast Yjs update messages between room peers
- [ ] `CursorLayer` overlay: colored cursor labels per remote user
- [ ] Language switcher in sidebar — emits `language-change` socket event
- [ ] File tab bar (multiple scratch files per session)

## Phase 4 — Live Video & Audio (WebRTC)
- [ ] `MediaContext`: calls `getUserMedia({ video: true, audio: true })`, stores `localStream`
- [ ] `useWebRTC` hook (setup connections, signaling, ICE)
- [ ] `VideoTile` component: attach stream to `<video ref>` with `srcObject`
- [ ] Mute mic button: `track.enabled = false` on local audio track
- [ ] Disable camera button: replace video track with blank / hide tile
- [ ] Speaking indicator: `AudioContext` + `AnalyserNode` to detect active speaker
- [ ] `media-state` socket event: broadcast mute/camera state to peers

## Phase 5 — Collaborative Whiteboard
- [ ] `Whiteboard.jsx` using `react-konva` Stage + Layer
- [ ] Tool palette: pen (freehand), line, rectangle, circle, text, eraser
- [ ] Color picker + stroke width selector
- [ ] On draw: emit `whiteboard-draw` with serialized operation object
- [ ] Socket server: broadcast ops, persist last 500 ops in memory
- [ ] New joiners receive full `whiteboardOps` array and replay on canvas
- [ ] `whiteboard-clear` event + confirm dialog
- [ ] Undo: local stack of ops, emit `whiteboard-undo`

## Phase 6 — Real-time Chat
- [ ] `Chat.jsx` with scrollable message list + input field
- [ ] `chat-message` socket emit on send (Enter key or button)
- [ ] Server broadcasts to all room members, appends to `room.chat[]`
- [ ] New joiners receive chat history in `room-state`
- [ ] User color derived from socket ID (consistent per session)
- [ ] Unread badge when chat panel is collapsed

## Phase 7 — Interview Scheduling
- [ ] `Schedule` model in MongoDB
- [ ] `POST /api/schedule` — interviewer creates a session with candidate email, time, type, duration
- [ ] `GET /api/schedule` — returns all sessions for the logged-in user
- [ ] `SchedulePanel.jsx` in room sidebar: shows today's + upcoming sessions
- [ ] Full `Schedule.jsx` page: calendar-style list view, create/edit/cancel
- [ ] Status transitions: `scheduled → live → completed`
- [ ] Mark session as live when room is joined within 10 min of `scheduledAt`
- [ ] "Join Room" button on each scheduled item links to `/room/:roomId`

## Phase 8 — Evaluation Panel
- [ ] `Evaluation.jsx`: sliders for Problem Solving, Code Quality, Communication, Time Complexity, Edge Cases (0–100)
- [ ] Notes textarea for written feedback
- [ ] `update-evaluation` socket event: live score sync so candidate can optionally see scores
- [ ] `PATCH /api/rooms/:roomId/evaluation` — persist final scores to MongoDB
- [ ] Summary card: weighted overall score + color-coded rating
- [ ] Export evaluation as JSON (browser download)

## Phase 9 — Code Execution
- [ ] Integrate Judge0 API (free tier at `api.judge0.com` or self-hosted)
- [ ] `POST /api/execute` proxy route on Express (hides Judge0 API key)
- [ ] Language ID map: JavaScript → 63, Python → 71, C++ → 54, Go → 95, Java → 62
- [ ] Output panel below editor: stdout, stderr, exit code, execution time
- [ ] Run button in sidebar triggers execution with current editor content
- [ ] Loading state + timeout handling (Judge0 async polling)

## Phase 10 — Polish & Production
- [ ] Responsive layout for 1280px+ (interview rooms are desktop-first)
- [ ] Error boundaries around each major panel
- [ ] Toast notifications for join/leave/errors
- [ ] Room end flow: interviewer clicks End → saves evaluation → redirects to summary
- [ ] Add TURN server credentials from Metered.ca to WebRTC config
- [ ] Environment variable audit (no secrets in client bundle)
- [ ] Build React with `npm run build`, serve from Express `/` in production
- [ ] Deploy backend to Railway, frontend to Vercel (or serve together from Railway)
- [ ] MongoDB Atlas network access + connection string in Railway env vars
