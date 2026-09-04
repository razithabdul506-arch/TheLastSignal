export default function Timer({ timeRemaining }) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const isLowTime = timeRemaining < 300;
  const isCritical = timeRemaining < 60;

  return (
    <div className={`timer ${isCritical ? 'critical' : isLowTime ? 'low' : ''}`}>
      <span className="timer-label">TIME REMAINING</span>
      <span className="timer-display">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
