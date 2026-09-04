export default function EvidenceBoard({ evidence, selectedEvidence, onSelect, onDiscover }) {
  const getCategoryIcon = (category) => {
    const icons = {
      emergency: '🚨',
      police: '🔍',
      cctv: '📹',
      messages: '💬',
      phone: '☎️',
      financial: '💰',
      medical: '⚕️',
      digital: '💻',
      timeline: '⏰',
      evidence: '📦',
      workplace: '🏢'
    };
    return icons[category] || '📄';
  };

  return (
    <div className="evidence-board">
      <h3>DISCOVERED EVIDENCE ({evidence.length})</h3>
      <div className="evidence-list">
        {evidence.length === 0 ? (
          <p className="no-evidence">No evidence discovered yet. Ask the AI investigator for guidance.</p>
        ) : (
          evidence.map(ev => (
            <div
              key={ev.id}
              className={`evidence-card ${selectedEvidence?.id === ev.id ? 'selected' : ''}`}
              onClick={() => onSelect(ev)}
            >
              <span className="icon">{getCategoryIcon(ev.category)}</span>
              <div className="evidence-info">
                <span className="id">{ev.id}</span>
                <span className="title">{ev.title}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
