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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [streamActive, setStreamActive] = useState(false)
  const [detectionNotice, setDetectionNotice] = useState<string | null>(null)

  // Parse scannable data from text / QR content
  const processScannedText = (rawText: string) => {
    try {
      // Check if it's a URL query param: ?zone=..., ?booth=..., ?dest=...
      let parsedUrl: URL | null = null
      try {
        parsedUrl = new URL(rawText)
      } catch {
        if (rawText.startsWith('?') || rawText.includes('=')) {
          parsedUrl = new URL(`http://dummy.local/${rawText.startsWith('?') ? '' : '?'}${rawText}`)
        }
      }

      if (parsedUrl) {
        const zone = parsedUrl.searchParams.get('zone')
        const booth = parsedUrl.searchParams.get('booth')
        const dest = parsedUrl.searchParams.get('dest')

        if (zone) {
          const zoneNames: Record<string, string> = {
            'main-bowl': 'Main Stage Bowl',
            'hall-xyz': 'Hall XYZ Exhibition',
            'startup-festival': 'Startup Festival Arena',
            'studios': 'Studios 2 & 3',
            'atrium': 'South Atrium Lobby'
          }
          const targetNode = zone === 'main-bowl' ? 'zone-main-stage' : `zone-${zone}`
          const name = zoneNames[zone] || zone
          setDetectionNotice(`Scanned: ${name}`)
          setTimeout(() => {
            onScanSuccess(targetNode, name)
            onClose()
          }, 600)
          return true
        }

        if (booth) {
          const boothNames: Record<string, string> = {
            grey: 'Grey Finance Stand',
            sabi: 'Sabi Stand',
            accrue: 'Accrue Stand',
            breet: 'Breet Stand',
            sentz: 'Sentz Stand'
          }
          const targetNode = `booth-${booth}`
          const name = boothNames[booth] || `${booth.toUpperCase()} Booth`
          setDetectionNotice(`Scanned: ${name}`)
          setTimeout(() => {
            onScanSuccess(targetNode, name)
            onClose()
          }, 600)
          return true
        }

        if (dest) {
          setDetectionNotice(`Scanned: ${dest}`)
          setTimeout(() => {
            onScanSuccess(dest, dest)
            onClose()
          }, 600)
          return true
        }
      }

      // Direct node IDs
      if (rawText.startsWith('zone-') || rawText.startsWith('booth-') || rawText.startsWith('poi-')) {
        setDetectionNotice(`Detected: ${rawText}`)
        setTimeout(() => {
          onScanSuccess(rawText, rawText)
          onClose()
        }, 600)
        return true
      }
    } catch (e) {
      console.warn('Could not parse scanned QR payload', e)
    }
    return false
  }

  // Native BarcodeDetector API for Web Standards / Modern Browsers
  useEffect(() => {
    if (!isOpen) return

    let mediaStream: MediaStream | null = null
    let scanInterval: any = null

    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          })
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream
            videoRef.current.play()
            setStreamActive(true)

            // If browser supports BarcodeDetector API
            if ('BarcodeDetector' in window) {
              const barcodeDetector = new (window as any).BarcodeDetector({
                formats: ['qr_code']
              })

              scanInterval = setInterval(async () => {
                if (videoRef.current && videoRef.current.readyState >= 2) {
                  try {
                    const barcodes = await barcodeDetector.detect(videoRef.current)
                    if (barcodes.length > 0) {
                      const code = barcodes[0].rawValue
                      if (code) {
                        const handled = processScannedText(code)
                        if (handled && scanInterval) clearInterval(scanInterval)
                      }
                    }
                  } catch (err) {
                    // Ignore non-fatal frame decode errors
                  }
                }
              }, 400)
            }
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
      if (scanInterval) clearInterval(scanInterval)
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
    { id: 'booth-sabi', name: 'Sabi Stand (B02)', type: 'booth' },
    { id: 'booth-accrue', name: 'Accrue Stand (B03)', type: 'booth' },
    { id: 'booth-breet', name: 'Breet Stand (B04)', type: 'booth' },
    { id: 'booth-sentz', name: 'Sentz Stand (B05)', type: 'booth' }
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
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Holographic QR Aim Reticle */}
          <div className="qr-aim-reticle">
            <div className="corner top-left" />
            <div className="corner top-right" />
            <div className="corner bottom-left" />
            <div className="corner bottom-right" />
            <div className="qr-laser-scanner" />
          </div>

          {detectionNotice && (
            <div className="qr-scan-detected-toast">
              <span>{detectionNotice}</span>
            </div>
          )}

          {!streamActive && (
            <div className="qr-camera-fallback-msg">
              <span>📷 Point camera at physical corridor or booth placard</span>
              {cameraError && <small className="error-hint">{cameraError}</small>}
            </div>
          )}
        </div>

        {/* Quick Simulated Physical Checkpoints for Instant Testing */}
        <div className="qr-quick-stations">
          <div className="qr-quick-title">Or Tap Virtual Corridor Placards:</div>
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
