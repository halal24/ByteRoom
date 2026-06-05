# ByteRoom 🚀

> Collaborative interview platform with real-time code editing, live video/audio, collaborative whiteboards, cursor tracking, and interview scheduling.

## Overview
ByteRoom is a comprehensive MERN stack application designed to facilitate remote technical interviews seamlessly. It combines a real-time code editor with execution capabilities, WebRTC-based video conferencing, a collaborative whiteboard, and built-in evaluation tools.

## Key Features
- **Real-time Collaborative Code Editor**: Powered by CodeMirror 6 and Yjs, featuring multi-language support (JS, TS, Python, C++, Go, Java) and live remote cursor tracking.
- **P2P Video & Audio**: WebRTC integration for direct, low-latency video and audio communication between interviewers and candidates.
- **Shared Whiteboard**: Real-time collaborative canvas built with Konva.js for system design and visual problem-solving.
- **Code Execution**: Built-in code runner using the Judge0 API to compile and execute code without leaving the room.
- **Interview Management**: Dashboard to schedule interviews, track status, and manage rooms.
- **Real-time Chat & Evaluation**: In-room text chat and an evaluation panel for interviewers to score candidates on the fly.

## Tech Stack
- **Frontend**: React 18, TypeScript, React Router v6
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Real-time Sync**: Socket.IO, Yjs (CRDTs)
- **Video/Audio**: Native WebRTC API
- **Styling**: CSS Modules with custom design tokens

## Project Structure
- `/client` - React frontend application
- `/server` - Express and Socket.IO backend
- `BYTEROOM_PROJECT_PLAN.md` - Detailed breakdown of phases and architecture
- `TASKS.md` - Task list and progress tracker
- `CONTEXT_HANDOFF.md` - Important context rules for continuing development

## Getting Started (Coming Soon)
*Instructions for setting up the local development environment will be added as the foundation is implemented.*

---
*Developed iteratively as part of the ByteRoom project.*
