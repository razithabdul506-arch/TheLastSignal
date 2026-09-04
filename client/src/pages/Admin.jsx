import { useState, useEffect } from 'react';
import { adminAPI } from '../api';
import '../styles/Admin.css';

export default function Admin({ user, onBack }) {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [overview, setOverview] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('events');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await adminAPI.getEvents();
        setEvents(response.data);
        if (response.data.length > 0) {
          selectEvent(response.data[0]);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const selectEvent = async (event) => {
    setSelectedEvent(event);
    try {
      const overviewRes = await adminAPI.getEventOverview(event.id);
      setOverview(overviewRes.data);

      const participantsRes = await adminAPI.getEventParticipants(event.id);
      setParticipants(participantsRes.data);
    } catch (err) {
      console.error('Error loading event details:', err);
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>MERCY ADMIN PANEL</h1>
        <button onClick={onBack} className="back-button">← Back</button>
      </div>

      <div className="admin-content">
        <div className="admin-sidebar">
          <h3>Events</h3>
          <div className="events-list">
            {events.map(event => (
              <button
                key={event.id}
                className={`event-item ${selectedEvent?.id === event.id ? 'active' : ''}`}
                onClick={() => selectEvent(event)}
              >
                <span className="event-title">{event.title}</span>
                <span className={`status ${event.status}`}>{event.status}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="admin-main">
          {selectedEvent && overview && (
            <>
              <div className="admin-header-info">
                <h2>{selectedEvent.title}</h2>
                <p>{selectedEvent.description}</p>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <h4>Total Participants</h4>
                  <div className="stat-value">{overview.stats.totalParticipants}</div>
                </div>
                <div className="stat-card">
                  <h4>Completed</h4>
                  <div className="stat-value">{overview.stats.completed}</div>
                </div>
                <div className="stat-card">
                  <h4>Investigating</h4>
                  <div className="stat-value">{overview.stats.investigating}</div>
                </div>
                <div className="stat-card">
                  <h4>Avg Guilt</h4>
                  <div className="stat-value">{overview.stats.averageGuilt}%</div>
                </div>
                <div className="stat-card">
                  <h4>Avg Score</h4>
                  <div className="stat-value">{overview.stats.averageScore}</div>
                </div>
                <div className="stat-card">
                  <h4>AI Messages</h4>
                  <div className="stat-value">{overview.stats.aiMessagesTotal}</div>
                </div>
              </div>

              <div className="participants-section">
                <h3>Participants</h3>
                <table className="participants-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Guilt</th>
                      <th>Score</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map(p => (
                      <tr key={p.id}>
                        <td>{p.participant_name}</td>
                        <td>{p.status}</td>
                        <td>{p.guilt}%</td>
                        <td>{p.final_score || '-'}</td>
                        <td>{p.final_submitted ? '✓' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
