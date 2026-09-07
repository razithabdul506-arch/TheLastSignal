import { useState, useEffect, useRef } from 'react';
import { eventAPI, evidenceAPI, chatAPI, scoreAPI } from '../api';
import Timer from '../components/Timer';
import GuiltyMeter from '../components/GuiltyMeter';
import EvidenceBoard from '../components/EvidenceBoard';
import AIInvestigator from '../components/AIInvestigator';
import FinalSubmission from '../components/FinalSubmission';
import '../styles/Investigation.css';

export default function Investigation({ participant, event, user, onEventEnd, onLogout }) {
  const [status, setStatus] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [guilt, setGuilt] = useState(100);
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [activeTab, setActiveTab] = useState('evidence');
  const [showFinalSubmission, setShowFinalSubmission] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await eventAPI.getStatus();
        setStatus(response.data);
        setGuilt(response.data.guilt);
        setTimeRemaining(response.data.timeRemaining);

        const evidenceResponse = await evidenceAPI.getAll();
        setEvidence(evidenceResponse.data);
      } catch (err) {
        console.error('Error fetching status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Update timer every second
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(timerIntervalRef.current);
          onEventEnd();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [onEventEnd]);

  const handleEvidenceSelect = (ev) => {
    setSelectedEvidence(ev);
  };

  const handleDiscoverEvidence = async (evidenceId) => {
    try {
      await evidenceAPI.discover(evidenceId);
      const response = await evidenceAPI.getAll();
      setEvidence(response.data);
    } catch (err) {
      console.error('Error discovering evidence:', err);
    }
  };

  const handleGuiltUpdate = (newGuilt) => {
    setGuilt(newGuilt);
    if (status) {
      setStatus({ ...status, guilt: newGuilt });
    }
  };

  const handleFinalSubmit = async (defense, accused, chain) => {
    try {
      const response = await scoreAPI.submitFinal(defense, accused, chain);
      setSubmitted(true);
      setTimeout(() => onEventEnd(), 2000);
    } catch (err) {
      console.error('Error submitting final answer:', err);
    }
  };

  if (loading) {
    return (
      <div className="investigation-container">
        <div className="loading-spinner">
          <p>Initializing investigation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="investigation-container">
      <div className="investigation-header">
        <div className="header-left">
          <h1>MERCY — THE LAST HEARTBEAT</h1>
          <div className="case-info">
            <span>CASE SUBJECT: <strong>{participant.participant_name}</strong></span>
            <span>RELATIONSHIP: <strong>Husband of Meera Krishnan</strong></span>
            <span>STATUS: <strong>PRIMARY SUSPECT</strong></span>
          </div>
        </div>

        <div className="header-right">
          <Timer timeRemaining={timeRemaining} />
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </div>

      <div className="investigation-content">
        <div className="left-panel">
          <GuiltyMeter guilt={guilt} />

          <div className="tabs">
            <button
              className={`tab ${activeTab === 'evidence' ? 'active' : ''}`}
              onClick={() => setActiveTab('evidence')}
            >
              📁 Evidence
            </button>
            <button
              className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              📅 Timeline
            </button>
            <button
              className={`tab ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              📋 Details
            </button>
          </div>

          {activeTab === 'evidence' && (
            <EvidenceBoard
              evidence={evidence}
              selectedEvidence={selectedEvidence}
              onSelect={handleEvidenceSelect}
              onDiscover={handleDiscoverEvidence}
            />
          )}

          {activeTab === 'timeline' && (
            <div className="timeline-view">
              <h3>Investigation Timeline</h3>
              <div className="timeline-list">
                {evidence
                  .filter(e => e.timestamp)
                  .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
                  .map(e => (
                    <div
                      key={e.id}
                      className="timeline-event"
                      onClick={() => handleEvidenceSelect(e)}
                    >
                      <span className="time">{e.timestamp}</span>
                      <span className="title">{e.title}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'details' && selectedEvidence && (
            <div className="evidence-details">
              <h3>{selectedEvidence.title}</h3>
              <p className="evidence-category">{selectedEvidence.category}</p>
              <p>{selectedEvidence.description}</p>
              {selectedEvidence.timestamp && (
                <p className="evidence-timestamp">Time: {selectedEvidence.timestamp}</p>
              )}
              {selectedEvidence.related_characters && (
                <p className="evidence-related">Related: {selectedEvidence.related_characters}</p>
              )}
              <div className="evidence-content">
                {selectedEvidence.content}
              </div>
            </div>
          )}
        </div>

        <div className="right-panel">
          <AIInvestigator
            participantName={participant.participant_name}
            onGuiltUpdate={handleGuiltUpdate}
          />
        </div>
      </div>

      <div className="investigation-footer">
        <button
          className="submit-button"
          onClick={() => setShowFinalSubmission(true)}
          disabled={submitted}
        >
          {submitted ? 'Final Answer Submitted' : 'Submit Final Answer'}
        </button>
      </div>

      {showFinalSubmission && (
        <FinalSubmission
          onSubmit={handleFinalSubmit}
          onClose={() => setShowFinalSubmission(false)}
          guilt={guilt}
        />
      )}
    </div>
  );
}
