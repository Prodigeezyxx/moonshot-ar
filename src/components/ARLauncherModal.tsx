export default function ARLauncherModal({
  targetName,
  onClose
}: {
  targetName: string
  onClose: () => void
}) {
  return (
    <div className="ar-modal-overlay">
      <div className="ar-camera-container">
        {/* Mock Camera Interior Feed (Simulated dark venue interior) */}
        <div className="ar-mock-feed">
          <div className="ar-hud-header">
            <div className="ar-live-badge">● AR LIVE PREVIEW</div>
            <button className="ar-close-btn" onClick={onClose}>
              MAP MODE
            </button>
          </div>

          {/* 3D AR Ground Arrow Overlay (Matches reference Screenshot 3) */}
          <div className="ar-spatial-overlay">
            <div className="ar-floor-arrow-stack">
              <div className="ar-3d-arrow" />
              <div className="ar-3d-arrow delay-1" />
              <div className="ar-3d-arrow delay-2" />
            </div>

            {/* Floating Destination Billboard */}
            <div className="ar-floating-target-card">
              <div className="ar-target-icon">📍</div>
              <div className="ar-target-title">{targetName}</div>
              <div className="ar-target-metrics">28m away • Follow arrows</div>
            </div>
          </div>

          <div className="ar-hud-footer">
            <p>Niantic Studio VPS localization will lock to venue anchors once scanned.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
