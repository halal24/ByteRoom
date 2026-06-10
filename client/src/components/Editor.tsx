import React, { useEffect, useRef, useState, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { ViewUpdate } from '@codemirror/view';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { remoteCursorsField, updateRemoteCursors, RemoteCursor } from './editor/remoteCursorExtension';
import api from '../utils/api';

interface EditorProps {
  roomId: string;
}

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5005';

const getExtension = (lang: string) => {
  if (lang === 'python') return python();
  if (lang === 'cpp') return cpp();
  return javascript();
};

const Editor: React.FC<EditorProps> = ({ roomId }) => {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [connected, setConnected] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [output, setOutput] = useState<{ stdout: string; stderr: string; time: string; status: any } | null>(null);

  // Use a ref for the socket so it persists across renders without causing re-renders
  const socketRef = useRef<Socket | null>(null);
  // Guard flag - prevents local onChange from echoing back a remote update
  const isRemoteChange = useRef(false);
  // Keep track of CodeMirror view instance so we can dispatch cursor updates
  const viewRef = useRef<any>(null);
  const [view, setView] = useState<any>(null);
  
  // Keep track of active remote cursors
  const remoteCursorsMap = useRef<Record<string, RemoteCursor>>({});

  // Helper to get a stable color from a socket ID
  const getColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360}, 80%, 60%)`;
  };

  useEffect(() => {
    if (!user) return;

    // Create a dedicated socket connection just for the editor
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Editor] Socket connected:', socket.id);
      setConnected(true);
      // Join the socket.io room channel so we receive broadcasts
      // (We use a special editor prefix to keep editor sockets separate from presence)
      socket.emit('editor-join', { roomId, user });
      // Request the current code state for this room
      socket.emit('code-request', { roomId });
    });

    // Receive the current code when joining
    socket.on('code-response', ({ code: existingCode, language: existingLang }) => {
      isRemoteChange.current = true;
      setCode(existingCode || '');
      setLanguage(existingLang || 'javascript');
      // Reset after React has had a chance to re-render with the new value
      setTimeout(() => { isRemoteChange.current = false; }, 0);
    });

    // When a remote user types, update our local editor
    socket.on('code-change', ({ code: remoteCode, language: remoteLang }) => {
      isRemoteChange.current = true;
      setCode(remoteCode);
      if (remoteLang) setLanguage(remoteLang);
      // Reset after React has had a chance to re-render with the new value
      setTimeout(() => { isRemoteChange.current = false; }, 0);
    });

    // When a remote cursor moves
    socket.on('cursor-change', ({ socketId, name, cursor }) => {
      remoteCursorsMap.current[socketId] = {
        id: socketId,
        pos: cursor,
        name: name || 'Anonymous',
        color: getColor(socketId),
      };
      
      // Dispatch the updated list of cursors to CodeMirror
      if (viewRef.current) {
        viewRef.current.dispatch({
          effects: updateRemoteCursors.of(Object.values(remoteCursorsMap.current))
        });
      }
    });

    // When a user leaves, remove their cursor
    socket.on('user-left', ({ socketId }) => {
      if (remoteCursorsMap.current[socketId]) {
        delete remoteCursorsMap.current[socketId];
        if (viewRef.current) {
          viewRef.current.dispatch({
            effects: updateRemoteCursors.of(Object.values(remoteCursorsMap.current))
          });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('[Editor] Socket disconnected');
      setConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, user]);

  // Keep language in a ref so handleCodeChange can always access the latest value
  const languageRef = useRef(language);
  useEffect(() => { languageRef.current = language; }, [language]);

  // Called by CodeMirror on every keystroke/change
  const handleCodeChange = useCallback((value: string, viewUpdate: ViewUpdate) => {
    // If this is a remote change being applied, don't emit back to avoid echo loop
    if (isRemoteChange.current) return;

    setCode(value);

    if (socketRef.current?.connected) {
      socketRef.current.emit('code-change', { roomId, code: value, language: languageRef.current });
    }
  }, [roomId]); // roomId only - language accessed via ref to avoid stale closure
  
  // Called by CodeMirror on cursor movement / selection changes
  const handleUpdate = useCallback((viewUpdate: ViewUpdate) => {
    if (viewUpdate.selectionSet && socketRef.current?.connected) {
      // The head represents the active cursor position
      const pos = viewUpdate.state.selection.main.head;
      socketRef.current.emit('cursor-change', { roomId, cursor: pos });
    }
  }, [roomId]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    if (socketRef.current?.connected) {
      socketRef.current.emit('code-change', { roomId, code, language: newLang });
    }
  };

  const handleRunCode = async () => {
    setExecuting(true);
    setOutput(null);
    try {
      const response = await api.post('/execute', { code, language });
      setOutput(response.data);
    } catch (error: any) {
      console.error('Execution failed:', error);
      setOutput({
        stdout: '',
        stderr: error.response?.data?.message || error.message || 'Execution failed',
        time: '',
        status: { description: 'Error' }
      });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full rounded-xl overflow-hidden glass-panel border border-white/5">
      {/* Editor Header / Toolbar */}
      <div className="h-12 bg-black/40 border-b border-white/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <span className="text-sm font-mono text-gray-400 ml-4">
            main.{language === 'javascript' ? 'js' : language === 'python' ? 'py' : 'cpp'}
          </span>
          {/* Connection indicator */}
          <span className={`text-xs font-mono ml-2 ${connected ? 'text-green-400' : 'text-red-400'}`}>
            ● {connected ? 'live' : 'disconnected'}
          </span>
        </div>
        
        {/* Toolbar Right: Run & Language */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleRunCode}
            disabled={executing || !code.trim()}
            className="flex items-center gap-2 bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan text-xs font-semibold px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-accent-cyan/30"
          >
            {executing ? (
              <>
                <svg className="animate-spin h-3 w-3 text-accent-cyan" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running...
              </>
            ) : (
              <>
                ▶ Run Code
              </>
            )}
          </button>
          
          <select 
            value={language}
            onChange={handleLanguageChange}
            className="bg-white/5 border border-white/10 text-white text-xs rounded px-2 py-1.5 outline-none focus:border-accent-cyan transition-colors"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="go">Go</option>
            <option value="java">Java</option>
          </select>
        </div>
      </div>

      {/* CodeMirror Area */}
      <div className="flex-1 overflow-auto text-sm bg-black/20 flex flex-col">
        <div className="flex-1 overflow-auto">
          <CodeMirror
            value={code}
            theme="dark"
            height="100%"
            extensions={[getExtension(language), remoteCursorsField]}
            onChange={handleCodeChange}
            onUpdate={handleUpdate}
            onCreateEditor={(v) => { viewRef.current = v; setView(v); }}
            className="h-full"
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              foldGutter: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              highlightActiveLine: true,
            }}
          />
        </div>

        {/* Output Panel */}
        {(output || executing) && (
          <div className="h-48 border-t border-white/10 bg-dark-900 flex flex-col">
            <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between bg-dark-800/50">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Execution Output</span>
              {output && (
                <div className="flex items-center gap-3 text-xs">
                  {output.time && <span className="text-gray-500 font-mono">Time: {output.time}s</span>}
                  <span className={`font-mono px-2 py-0.5 rounded ${
                    output.status?.description === 'Accepted' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {output.status?.description || 'Finished'}
                  </span>
                  <button onClick={() => setOutput(null)} className="text-gray-500 hover:text-white">✕</button>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-auto p-4 font-mono text-xs">
              {executing ? (
                <div className="text-gray-500 italic">Waiting for Judge0 API...</div>
              ) : (
                <>
                  {output?.stderr && (
                    <div className="text-red-400 whitespace-pre-wrap mb-2">{output.stderr}</div>
                  )}
                  {output?.stdout && (
                    <div className="text-gray-300 whitespace-pre-wrap">{output.stdout}</div>
                  )}
                  {!output?.stdout && !output?.stderr && (
                    <div className="text-gray-500 italic">No output</div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;
