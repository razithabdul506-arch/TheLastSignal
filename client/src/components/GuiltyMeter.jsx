export default function GuiltyMeter({ guilt }) {
  const getStatus = () => {
    if (guilt >= 80) return 'HIGHLY SUSPICIOUS';
    if (guilt >= 60) return 'SUSPECT';
    if (guilt >= 40) return 'QUESTIONED';
    if (guilt >= 20) return 'CLEARED (Partial)';
    return 'CLEARED';
  };

  return (
    <div className="guilty-meter">
      <h3>YOUR STATUS</h3>
      <div className="guilt-display">
        <div className="guilt-bar-container">
          <div className="guilt-bar" style={{ width: `${guilt}%` }}></div>
        </div>
        <span className="guilt-percentage">{guilt}%</span>
      </div>
      <span className="guilt-status">{getStatus()}</span>
    </div>
  );
}
