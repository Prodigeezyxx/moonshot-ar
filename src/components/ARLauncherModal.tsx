import { useEffect, useRef, useState, useCallback } from 'react'

interface ARLauncherModalProps {
  targetName: string
  targetCoords?: { x: number; y: number }
  currentCoords?: { x: number; y: number }
  remainingDistanceMeters?: number
  onClose: () => void
  onArrived?: () => void
}

export default function ARLauncherModal({
  targetName,
  targetCoords = { x: 320, y: 290 },
  currentCoords = { x: 320, y: 500 },
  remainingDistanceMeters = 24,
  onClose,
  onArrived
}: ARLauncherModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasCameraStream, setHasCameraStream] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isLowBatteryMode, setIsLowBatteryMode] = useState(false)
  const [heading, setHeading] = useState<number | null>(null)
  const [devicePitch, setDevicePitch] = useState<number>(0)
  const [targetBearing, setTargetBearing] = useState<number>(0)
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt')

  // Calculate geometric bearing between SVG coordinates
  // SVG coordinates: (0,0) is top-left, +x is east, +y is south.
  // Standard compass bearing: 0 deg = North (-y), 90 deg = East (+x), 180 deg = South (+y), 270 deg = West (-x)
  useEffect(() => {
    const dx = targetCoords.x - currentCoords.x
    const dy = targetCoords.y - currentCoords.y
    // Angle in degrees clockwise from North
    const rad = Math.atan2(dx, -dy)
    let deg = (rad * 180) / Math.PI
    if (deg < 0) deg += 360
    setTargetBearing(Math.round(deg))
  }, [targetCoords, currentCoords])

  // Gyroscope & Compass Listener with iOS 13+ permission support
  const requestOrientationAccess = useCallback(async () => {
    const DeviceOrientation = (window as any).DeviceOrientationEvent
    if (typeof DeviceOrientation?.requestPermission === 'function') {
      try {
        const response = await DeviceOrientation.requestPermission()
        if (response === 'granted') {
          setPermissionState('granted')
        } else {
          setPermissionState('denied')
        }
      } catch (err) {
        console.warn('Orientation permission error:', err)
        setPermissionState('denied')
      }
    } else {
      setPermissionState('granted')
    }
  }, [])

  useEffect(() => {
    requestOrientationAccess()

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading is available on iOS Safari
      let compassHeading: number | null = null
      if ((e as any).webkitCompassHeading !== undefined) {
        compassHeading = (e as any).webkitCompassHeading
      } else if (e.alpha !== null) {
        // Standard Android/Chrome alpha is counter-clockwise; invert to clockwise
        compassHeading = (360 - e.alpha) % 360
      }

      if (compassHeading !== null) {
        setHeading(compassHeading)
      }

      if (e.beta !== null) {
        // Device tilt up/down (-90 to +90 deg)
        setDevicePitch(Math.max(-45, Math.min(45, e.beta - 60)))
      }
    }

    window.addEventListener('deviceorientation', handleOrientation, true)
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true)
    }
  }, [requestOrientationAccess])

  // Camera stream activation
  useEffect(() => {
    let stream: MediaStream | null = null

    async function activateCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: false
          })
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play()
            setHasCameraStream(true)
            setCameraError(null)
          }
        } else {
          setCameraError('Camera API unsupported on this browser')
        }
      } catch (err: any) {
        console.warn('Camera stream error:', err)
        setCameraError(err.message || 'Camera permission denied')
      }
    }

    if (!isLowBatteryMode) {
      activateCamera()
    } else {
      setHasCameraStream(false)
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [isLowBatteryMode])

  // Calculate relative arrow deflection angle
  // If user is facing North (0 deg) and target is East (90 deg), deflection is +90 deg (point right).
  const currentHeadingVal = heading !== null ? heading : 0
  let relativeAngle = (targetBearing - currentHeadingVal) % 360
  if (relativeAngle > 180) relativeAngle -= 360
  if (relativeAngle < -180) relativeAngle += 360

  // Calculate horizontal screen offset based on deflection (clamped to screen width)
  const isTargetInView = Math.abs(relativeAngle) <= 35
  const horizontalOffset = Math.max(-140, Math.min(140, relativeAngle * 4))

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

        {/* High-Tech Grid Backdrop (Fallback / Low Battery Mode) */}
        {(!hasCameraStream || isLowBatteryMode) && (
          <div className="ar-mock-feed-backdrop">
            <div className="ar-grid-lines" />
            {cameraError && (
              <div className="ar-camera-notice">
                <span>⚡ Spatial Simulation Active ({cameraError})</span>
              </div>
            )}
          </div>
        )}

        {/* Spatial HUD Top Strip */}
        <header className="ar-hud-header">
          <div className="ar-live-badge">
            <span className="live-dot" />
            <span>{isLowBatteryMode ? 'BATTERY SAVER AR' : 'SPATIAL WAYFINDER'}</span>
          </div>

          <div className="ar-header-actions">
            <button
              className={`ar-toggle-battery-btn ${isLowBatteryMode ? 'active' : ''}`}
              onClick={() => setIsLowBatteryMode(!isLowBatteryMode)}
              title="Toggle Battery Saving Mode"
            >
              {isLowBatteryMode ? '⚡ Eco Active' : '🔋 Eco'}
            </button>
            <button className="ar-close-btn" onClick={onClose}>
              MAP VIEW
            </button>
          </div>
        </header>

        {/* Compass Heading & Telemetry Bar */}
        <div className="ar-telemetry-pill">
          <span className="telemetry-label">HEADING</span>
          <span className="telemetry-value">
            {heading !== null ? `${Math.round(heading)}°` : 'SIMULATED (360°)'}
          </span>
          <span className="telemetry-sep">•</span>
          <span className="telemetry-label">BEARING</span>
          <span className="telemetry-value">{targetBearing}°</span>
        </div>

        {/* 3D Spatial Guidance Stage */}
        <div
          className="ar-spatial-overlay"
          style={{
            transform: `perspective(800px) rotateX(${devicePitch}deg)`
          }}
        >
          {/* Spatial Target Billboard Floating in World Space */}
          <div
            className={`ar-floating-target-card ${isTargetInView ? 'in-view' : 'off-screen'}`}
            style={{
              transform: `translateX(${horizontalOffset}px) scale(${isTargetInView ? 1 : 0.88})`
            }}
          >
            <div className="ar-target-icon">🎯</div>
            <div className="ar-target-content">
              <div className="ar-target-title">{targetName}</div>
              <div className="ar-target-metrics">
                <span className="neon-dist">{remainingDistanceMeters}m</span> away
                {isTargetInView ? ' • Target In View' : ` • Turn ${relativeAngle > 0 ? 'Right' : 'Left'}`}
              </div>
            </div>
          </div>

          {/* Dynamic 3D Directional Ground Arrow Stack */}
          <div
            className="ar-floor-arrow-stack"
            style={{
              transform: `rotateZ(${relativeAngle}deg)`
            }}
          >
            <div className="ar-3d-arrow pulse-1" />
            <div className="ar-3d-arrow pulse-2" />
            <div className="ar-3d-arrow pulse-3" />
          </div>

          {/* Spatial Ground Corridor Anchor */}
          <div className="ar-ground-grid-anchor">
            <div className="ar-neon-anchor-ring" />
          </div>
        </div>

        {/* Footer HUD Action Bar */}
        <footer className="ar-hud-footer">
          <div className="ar-footer-info">
            <span className="vps-status-badge">⚡ Niantic Studio VPS Active</span>
            <p className="ar-instruction-text">
              Keep camera level with corridor wayfinding signage
            </p>
          </div>

          {onArrived && remainingDistanceMeters <= 8 && (
            <button className="ar-arrival-trigger-btn" onClick={onArrived}>
              🎉 Arrived at Destination
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
