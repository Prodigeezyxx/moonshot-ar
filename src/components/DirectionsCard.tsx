import { type RouteResult } from '../utils/pathfinding'

export default function DirectionsCard({
  route,
  destinationName,
  onClear
}: {
  route: RouteResult
  destinationName: string
  onClear: () => void
}) {
  return (
    <div className="directions-card">
      <div className="directions-header">
        <div className="directions-summary">
          <div className="directions-title">
            <span className="nav-arrow">🧭</span> To: {destinationName}
          </div>
          <div className="directions-metrics">
            <span className="metric-badge eta">{route.estimatedWalkingMinutes} min walk</span>
            <span className="metric-badge dist">{route.totalDistanceMeters} m</span>
          </div>
        </div>
        <button className="directions-close-btn" onClick={onClear} aria-label="End directions">
          ✕
        </button>
      </div>

      <div className="directions-steps-list">
        {route.steps.length === 0 ? (
          <div className="step-item active">You are already at your destination!</div>
        ) : (
          route.steps.map((step, idx) => (
            <div key={idx} className="step-item">
              <div className="step-num">{idx + 1}</div>
              <div className="step-content">
                <div className="step-inst">{step.instruction}</div>
                <div className="step-dist">({step.distanceMeters}m)</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="directions-actions">
        <button className="btn primary full-width" onClick={() => alert('AR Navigation Mode (Niantic Studio Preview) lands in Phase 5!')}>
          START AR WALK
        </button>
      </div>
    </div>
  )
}
