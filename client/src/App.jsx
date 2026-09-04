import { useState, useEffect } from 'react';
import './styles/App.css';
import Auth from './pages/Auth';
import Registration from './pages/Registration';
import Investigation from './pages/Investigation';
import Leaderboard from './pages/Leaderboard';
import Admin from './pages/Admin';

export default function App() {
  const [currentPage, setCurrentPage] = useState('auth');
  const [user, setUser] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      setCurrentPage('registration');
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setCurrentPage('registration');
  };

  const handleRegistration = (participantData, eventData) => {
    setParticipant(participantData);
    setEvent(eventData);
    setCurrentPage('investigation');
  };

  const handleEventEnd = () => {
    setCurrentPage('leaderboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setParticipant(null);
    setEvent(null);
    setCurrentPage('auth');
  };

  return (
    <div className="app">
      {currentPage === 'auth' && (
        <Auth onLogin={handleLogin} onAdminMode={() => setCurrentPage('admin')} />
      )}
      {currentPage === 'registration' && (
        <Registration user={user} onRegister={handleRegistration} onLogout={handleLogout} />
      )}
      {currentPage === 'investigation' && participant && event && (
        <Investigation
          participant={participant}
          event={event}
          user={user}
          onEventEnd={handleEventEnd}
          onLogout={handleLogout}
        />
      )}
      {currentPage === 'leaderboard' && event && (
        <Leaderboard event={event} participant={participant} onLogout={handleLogout} />
      )}
      {currentPage === 'admin' && (
        <Admin user={user} onBack={() => setCurrentPage('auth')} />
      )}
    </div>
  );
}
