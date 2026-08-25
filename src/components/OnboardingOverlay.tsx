export default function OnboardingOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay">
      <div>
        <div className="camera">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
              stroke="#FAF3E0"
              strokeWidth="2"
            />
            <circle cx="12" cy="13" r="3.5" stroke="#FAF3E0" strokeWidth="2" />
          </svg>
        </div>
        <h1>POINT YOUR CAMERA</h1>
        <p>
          Find your spot instantly. When you enter a scanned zone, hold your
          phone up and Moonshot locks your position with VPS — no app install.
        </p>
        <button className="btn primary" onClick={onClose}>
          FIND YOUR WAY
        </button>
      </div>
    </div>
  )
}
