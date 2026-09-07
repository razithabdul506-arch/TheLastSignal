import { useState, useEffect } from 'react';
import { scoreAPI } from '../api';
import '../styles/Leaderboard.css';

export default function Leaderboard({ event, participant, onLogout }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentScore, setCurrentScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const leaderboardRes = await scoreAPI.getLeaderboard();
        setLeaderboard(leaderboardRes.data.leaderboard);

        const scoreRes = await scoreAPI.getCurrent();
        setCurrentScore(scoreRes.data);
      } catch (err) {
        console.error('Error fetching results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="leaderboard-container">
        <div className="loading-spinner">
          <p>Calculating results...</p>
        </div>
      </div>
    );
  }

  const yourRank = leaderboard.findIndex(item => item.name === participant.participant_name) + 1;

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-card">
        <div className="leaderboard-header">
          <h1>INVESTIGATION COMPLETE</h1>
          <p className="subtitle">{event.title}</p>
        </div>

        {currentScore && (
          <div className="your-results">
            <h2>YOUR FINAL RESULTS</h2>
            <div className="result-grid">
              <div className="result-item">
                <span className="label">Final Score</span>
                <span className="value">{currentScore.finalScore || 0}/100</span>
              </div>
              <div className="result-item">
                <span className="label">Guilt Level</span>
                <span className="value">{currentScore.guilt}%</span>
              </div>
              <div className="result-item">
                <span className="label">Your Rank</span>
                <span className="value">#{yourRank} of {leaderboard.length}</span>
              </div>
            </div>
          </div>
        )}

        <div className="leaderboard">
          <h2>LEADERBOARD</h2>
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, idx) => (
                <tr
                  key={idx}
                  className={entry.name === participant.participant_name ? 'your-entry' : ''}
                >
                  <td className="rank">{entry.rank}</td>
                  <td className="name">{entry.name}</td>
                  <td className="score">{entry.score}</td>
                  <td className="status">{entry.submitted ? '✓ Submitted' : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="leaderboard-footer">
          <button onClick={onLogout} className="logout-button">
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}
