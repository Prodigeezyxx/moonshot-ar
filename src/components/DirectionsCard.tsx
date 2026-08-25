import { type RouteResult } from '../utils/pathfinding'

export default function DirectionsCard({
  route,
  destinationName,
  onClear,
  onLaunchAR
}: {
  route: RouteResult
  destinationName: string
  onClear: () => void
  onLaunchAR: () => void
}) {
  const nextStep = route.steps.length > 0 ? route.steps[0] : null

  return (
    <div className="active-nav-dock">
      {/* Top GPS Instruction Strip (Matches Reference Screen 1/3) */}
      <div className="nav-step-strip">
        <div className="nav-direction-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="nav-step-text">
          <div className="nav-step-headline">
            {nextStep ? nextStep.instruction : `Arrived at ${destinationName}`}
          </div>
          {nextStep && <div className="nav-step-sub">{nextStep.distanceMeters} meters along corridor</div>}
        </div>
      </div>

      {/* Destination & Arrival ETA summary */}
      <div className="nav-metrics-row">
        <div className="nav-dest-info">
          <div className="nav-dest-name">{destinationName}</div>
          <div className="nav-badges">
            <span className="badge eta">{route.estimatedWalkingMinutes} min walk</span>
            <span className="badge distance">{route.totalDistanceMeters} m total</span>
          </div>
        </div>

        <button className="nav-cancel-btn" onClick={onClear} aria-label="Exit navigation">
          End Route
        </button>
      </div>

      {/* Primary Action Button (Start AR Mode / Preview) */}
      <div className="nav-action-bar">
        <button className="btn-ar-walk" onClick={onLaunchAR}>
          <span className="ar-icon">📷</span>
          <span>LAUNCH AR WALK</span>
        </button>
      </div>
    </div>
  )
}
