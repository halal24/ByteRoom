import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RoomProvider } from './context/RoomContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Room from './pages/Room';

function App() {
  return (
    <AuthProvider>
      <RoomProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/room/:roomId" element={<Room />} />
            </Route>
          </Routes>
        </Router>
      </RoomProvider>
    </AuthProvider>
  );
}

export default App;
