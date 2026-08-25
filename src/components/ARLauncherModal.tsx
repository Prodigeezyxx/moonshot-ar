import { useEffect, useRef, useState } from 'react'

export default function ARLauncherModal({
  targetName,
  onClose
}: {
  targetName: string
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasCameraStream, setHasCameraStream] = useState(false)
  const [isLowBatteryMode, setIsLowBatteryMode] = useState(false)

  // Real getUserMedia integration for live camera AR
  useEffect(() => {
    let stream: MediaStream | null = null

    async function activateCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
          })
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play()
            setHasCameraStream(true)
          }
        }
      } catch (err) {
        console.warn('Real camera not accessible in this context, falling back to simulated AR background', err)
      }
    }

    if (!isLowBatteryMode) {
      activateCamera()
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [isLowBatteryMode])

  return (
    <div className="ar-modal-overlay">
      <div className="ar-camera-container">
        {/* Real Live Camera Stream Feed */}
        <video
          ref={videoRef}
          className={`ar-live-video-stream ${hasCameraStream && !isLowBatteryMode ? 'visible' : 'hidden'}`}
          playsInline
          muted
        />

        {/* Fallback Interior Gradient when camera is ungranted or in battery-saver mode */}
        {(!hasCameraStream || isLowBatteryMode) && (
          <div className="ar-mock-feed-backdrop" />
        )}

        {/* Top Floating Controls */}
        <div className="ar-hud-header">
          <div className="ar-live-badge">
            <span className="live-dot" /> {isLowBatteryMode ? 'BATTERY SAVER AR' : 'LIVE AR CAMERA'}
          </div>
          <div className="ar-header-actions">
            <button
              className="ar-toggle-battery-btn"
              onClick={() => setIsLowBatteryMode(!isLowBatteryMode)}
              title="Toggle Battery Saving Mode"
            >
              {isLowBatteryMode ? '⚡ Eco On' : '🔋 Eco'}
            </button>
            <button className="ar-close-btn" onClick={onClose}>
              MAP MODE
            </button>
          </div>
        </div>

        {/* 3D AR Ground Arrow Overlay with Spatial Perspective */}
        <div className="ar-spatial-overlay">
          <div className="ar-floor-arrow-stack">
            <div className="ar-3d-arrow" />
            <div className="ar-3d-arrow delay-1" />
            <div className="ar-3d-arrow delay-2" />
          </div>

          {/* Floating Spatial Landmark Billboard */}
          <div className="ar-floating-target-card">
            <div className="ar-target-icon">📍</div>
            <div className="ar-target-title">{targetName}</div>
            <div className="ar-target-metrics">24m away • Follow ground neon line</div>
          </div>
        </div>

        {/* Footer HUD info */}
        <div className="ar-hud-footer">
          <p>
            ⚡ Niantic Studio VPS ready • Point device at corridor anchors or sponsor signs to auto-calibrate.
          </p>
        </div>
      </div>
    </div>
  )
}
