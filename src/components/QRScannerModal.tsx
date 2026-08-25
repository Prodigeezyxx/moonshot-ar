import { useRef, useEffect, useState } from 'react'

export default function QRScannerModal({
  isOpen,
  onClose,
  onScanSuccess
}: {
  isOpen: boolean
  onClose: () => void
  onScanSuccess: (nodeId: string, name: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [streamActive, setStreamActive] = useState(false)

  // Start real camera stream
  useEffect(() => {
    if (!isOpen) return

    let mediaStream: MediaStream | null = null

    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          })
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream
            videoRef.current.play()
            setStreamActive(true)
          }
        } else {
          setCameraError('Camera access not supported on this browser.')
        }
      } catch (err: any) {
        console.warn('Camera stream could not start in this environment', err)
        setCameraError('Camera permission not granted or device has no camera.')
      }
    }

    startCamera()

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop())
      }
      setStreamActive(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  // Fast test check-in simulations for dev / environments without back camera
  const quickTestNodes = [
    { id: 'zone-main-stage', name: 'Main Bowl Stage (Stage)', type: 'zone' },
    { id: 'zone-hall-xyz', name: 'Hall XYZ (North Wing)', type: 'zone' },
    { id: 'zone-startup-festival', name: 'Startup Festival Arena', type: 'zone' },
    { id: 'booth-grey', name: 'Grey Finance Stand (B01)', type: 'booth' },
    { id: 'booth-sabi', name: 'Sabi Stand (B02)', type: 'booth' }
  ]

  return (
    <div className="qr-scanner-backdrop" onClick={onClose}>
      <div className="qr-scanner-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="qr-header">
          <h3>SCAN VENUE QR CODE</h3>
          <button className="qr-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="qr-camera-viewport">
          <video
            ref={videoRef}
            className="qr-video-feed"
            playsInline
            muted
          />

          {/* Holographic QR Aim Reticle */}
          <div className="qr-aim-reticle">
            <div className="corner top-left" />
            <div className="corner top-right" />
            <div className="corner bottom-left" />
            <div className="corner bottom-right" />
            <div className="qr-laser-scanner" />
          </div>

          {!streamActive && (
            <div className="qr-camera-fallback-msg">
              <span>📷 Point camera at physical corridor or booth placard</span>
              {cameraError && <small className="error-hint">{cameraError}</small>}
            </div>
          )}
        </div>

        {/* Quick Simulated Physical Checkpoints for Instant Testing */}
        <div className="qr-quick-stations">
          <div className="qr-quick-title">Or Test Check-In with Virtual Placards:</div>
          <div className="qr-station-chips">
            {quickTestNodes.map((st) => (
              <button
                key={st.id}
                className="qr-station-btn"
                onClick={() => {
                  onScanSuccess(st.id, st.name)
                  onClose()
                }}
              >
                📍 {st.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
