import { useState, useEffect } from 'react';
import { eventAPI } from '../api';
import '../styles/Registration.css';

export default function Registration({ user, onRegister, onLogout }) {
  const [event, setEvent] = useState(null);
  const [participantName, setParticipantName] = useState(user?.name || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await eventAPI.getActive();
        setEvent(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await eventAPI.register(event.id, participantName);
      setRegistered(true);
      setTimeout(() => {
        onRegister({ participant_name: participantName }, event);
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      setLoading(false);
    }
  };

  if (loading && !event) {
    return (
      <div className="registration-container">
        <div className="loading-spinner">
          <p>Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="registration-container">
        <div className="error-card">
          <h2>Event Not Available</h2>
          <p>{error}</p>
          <button onClick={onLogout} className="logout-button">
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="registration-container">
        <div className="success-card">
          <h2>Registration Confirmed</h2>
          <p>You are registered for:</p>
          <h3>{event.title}</h3>
          <p>Starting investigation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-container">
      <div className="registration-card">
        <div className="event-header">
          <h1>{event.title}</h1>
          <p className="event-description">{event.description}</p>
        </div>

        <div className="event-briefing">
          <h2>CASE BRIEFING</h2>
          <div className="briefing-content">
            <p>
              Your wife, <strong>Meera Krishnan</strong>, is dead.
            </p>
            <p>
              The circumstances surrounding her death are unclear.
            </p>
            <p>
              <strong>You are currently the primary suspect.</strong>
            </p>
            <p>
              The initial evidence appears to place you at the center of the investigation.
            </p>
            <p>
              You have one hour to investigate the available evidence, reconstruct the events
              surrounding Meera's death, defend yourself, and identify the person responsible.
            </p>
            <p>
              <strong>You cannot simply claim innocence. You must prove it through evidence.</strong>
            </p>
          </div>
        </div>

        <div className="event-timing">
          <div className="timing-item">
            <span className="label">EVENT START:</span>
            <span className="value">09:00 AM</span>
          </div>
          <div className="timing-item">
            <span className="label">EVENT END:</span>
            <span className="value">10:00 AM</span>
          </div>
          <div className="timing-item">
            <span className="label">TIME AVAILABLE:</span>
            <span className="value">60:00</span>
          </div>
        </div>

        <form onSubmit={handleRegister} className="registration-form">
          <div className="form-group">
            <label>Enter your name to begin</label>
            <input
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Your name"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="register-button">
            {loading ? 'Registering...' : 'Enter Investigation'}
          </button>
        </form>

        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </div>
    </div>
  );
}
