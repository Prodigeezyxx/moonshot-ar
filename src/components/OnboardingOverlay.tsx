export default function OnboardingOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="onboarding-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="onboarding-header">
          <div className="brand-identity">
            <div className="brand-title">
              MOONSHOT <span className="brand-badge">WAYFINDER</span>
            </div>
            <span className="brand-sub">National Theatre Lagos • Aug 25-27, 2026</span>
          </div>
        </div>

        <div className="onboarding-visual">
          <div className="camera-icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
                stroke="var(--cyan-glow)"
                strokeWidth="2"
              />
              <circle cx="12" cy="13" r="3.5" stroke="var(--action-yellow)" strokeWidth="2" />
            </svg>
          </div>
        </div>

        <h1>EXPERIENCE MOONSHOT</h1>
        <p>
          Find stages, discover sponsor booths, and navigate the venue with live
          AR wayfinding and gamified rewards.
        </p>

        <button className="btn primary" onClick={onClose}>
          START EXPLORING
        </button>
      </div>
    </div>
  )
}
