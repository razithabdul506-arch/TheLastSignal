import { useState } from 'react';

export default function FinalSubmission({ onSubmit, onClose, guilt }) {
  const [defense, setDefense] = useState('');
  const [accused, setAccused] = useState('');
  const [chain, setChain] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!defense.trim() || !accused.trim() || !chain.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(defense, accused, chain);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="final-submission-overlay">
      <div className="final-submission-dialog">
        <div className="dialog-header">
          <h2>FINAL INVESTIGATION SUBMISSION</h2>
          <button onClick={onClose} className="close-button" disabled={loading}>×</button>
        </div>

        <div className="guilt-warning">
          <p>Current Guilt Level: <strong>{guilt}%</strong></p>
          {guilt > 40 && (
            <p className="warning-text">
              ⚠️ Your guilt level is still high. A strong defense and correct culprit identification are critical.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="final-form">
          <div className="form-section">
            <h3>1. MY DEFENSE</h3>
            <p className="instruction">
              Explain why you did not kill Meera. Reference the evidence you've discovered.
            </p>
            <textarea
              value={defense}
              onChange={(e) => setDefense(e.target.value)}
              placeholder="I did not kill Meera because..."
              rows="6"
              disabled={loading}
            />
          </div>

          <div className="form-section">
            <h3>2. RESPONSIBLE PERSON</h3>
            <p className="instruction">
              Who is responsible for Meera's death? Provide a name.
            </p>
            <input
              type="text"
              value={accused}
              onChange={(e) => setAccused(e.target.value)}
              placeholder="Name of responsible person"
              disabled={loading}
            />
          </div>

          <div className="form-section">
            <h3>3. CHAIN OF CAUSALITY</h3>
            <p className="instruction">
              Explain the chain of events that led to Meera's death. How are the characters and evidence connected?
            </p>
            <textarea
              value={chain}
              onChange={(e) => setChain(e.target.value)}
              placeholder="The chain of causality is..."
              rows="8"
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="cancel-button"
            >
              Continue Investigating
            </button>
            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Submitting...' : 'Submit Final Answer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
