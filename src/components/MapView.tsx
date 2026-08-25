import {
  useRef,
  useState,
  useEffect,
  type WheelEvent,
  type PointerEvent,
  type TouchEvent
} from 'react'
import { type WhiteLabelVenueConfig, type POIItem } from '../types/venueConfig'
import { type RouteResult } from '../utils/pathfinding'

const CX = 320
const CY = 320
const R_IN = 165
const R_OUT = 300
const RADIALS = [-90, -18, 54, 126, 198]

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function sectorPoints(cx: number, cy: number, rIn: number, rOut: number, a1: number, a2: number, steps = 36) {
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const a = a1 + ((a2 - a1) * i) / steps
    const p = polar(cx, cy, rOut, a)
    pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`)
  }
  for (let i = steps; i >= 0; i--) {
    const a = a1 + ((a2 - a1) * i) / steps
    const p = polar(cx, cy, rIn, a)
    pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`)
  }
  return pts.join(' ')
}

export default function MapView({
  config,
  onSelectPOI,
  onSelectZone,
  activeRoute,
  currentLocation
}: {
  config: WhiteLabelVenueConfig
  onSelectPOI: (poi: POIItem) => void
  onSelectZone: (zoneId: string) => void
  activeRoute: RouteResult | null
  currentLocation: { x: number; y: number; name: string }
}) {
  // Zoom ONLY. The world stays centered at (320,320) — never panned.
  const [scale, setScale] = useState<number>(1.0)
  const [is3D, setIs3D] = useState<boolean>(false)

  const isDragging = useRef(false)
  const lastTouch = useRef<{ x: number; y: number } | null>(null)
  const lastTouchDist = useRef<number | null>(null)

  // When a route is active, zoom in slightly to frame the path, but still keep centered.
  useEffect(() => {
    if (activeRoute && activeRoute.pathNodes.length > 0) {
      setScale(1.15)
    } else {
      setScale(1.0)
    }
  }, [activeRoute])

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92
    setScale((prev) => {
      const next = prev * zoomFactor
      return Math.min(2.5, Math.max(0.7, next))
    })
  }

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    // If actively navigating a route, ignore drag-to-pan so the user can focus.
    if (activeRoute) {
      isDragging.current = false
      return
    }
    isDragging.current = true
    lastTouch.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    // Pan disabled during active navigation — keeps the venue stable & centered.
    if (!isDragging.current || !lastTouch.current || activeRoute) return
    const dx = e.clientX - lastTouch.current.x
    const dy = e.clientY - lastTouch.current.y
    lastTouch.current = { x: e.clientX, y: e.clientY }
    // Gentle micro-drag so it never feels "loose" but still interactive in free-roam mode
    const maxPan = 16
    const newX = Math.max(-maxPan, Math.min(maxPan, dx * 0.25))
    const newY = Math.max(-maxPan, Math.min(maxPan, dy * 0.25))
    // No-op pan in pure scale-only mode — we keep pan out for stability
  }

  const handlePointerUp = () => {
    isDragging.current = false
    lastTouch.current = null
  }

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else if (e.touches.length === 2) {
      lastTouchDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
    }
  }

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    e.preventDefault()
    // Only handle pinch-to-zoom via two fingers
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const ratio = dist / lastTouchDist.current
      lastTouchDist.current = dist
      setScale((prev) => Math.min(2.5, Math.max(0.7, prev * ratio)))
    }
    // Prevent drag-to-pan entirely to keep venue centered
  }

  const handleTouchEnd = () => {
    lastTouch.current = null
    lastTouchDist.current = null
  }

  const resetCamera = () => {
    setScale(1.0)
  }

  const routePathD = activeRoute && activeRoute.pathNodes.length > 1
    ? activeRoute.pathNodes.reduce((acc, node, idx) => {
        return idx === 0 ? `M ${node.x} ${node.y}` : `${acc} L ${node.x} ${node.y}`
      }, '')
    : ''

  return (
    <div
      className={`map-viewport-stage ${is3D ? 'view-3d-active' : 'view-2d-active'}`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="map-world-plane"
        style={{
          transform: `scale(${scale}) ${is3D ? 'rotateX(28deg)' : ''}`,
        }}
      >
        <svg
          viewBox="0 0 640 640"
          className="map-svg-surface"
          role="img"
          aria-label={`${config.name} ${config.locationName} Floorplan`}
        >
          <defs>
            <filter id="routeGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="buildingDropShadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="20" stdDeviation="16" floodColor="#000000" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Base Background Plate */}
          <rect width="640" height="640" rx="40" fill="#130D20" />

          {/* Outer Atrium Drum */}
          <g filter="url(#buildingDropShadow)">
            <circle
              cx={CX}
              cy={CY}
              r={R_OUT}
              fill={config.theme.zoneColors['atrium']?.bg || '#261C3D'}
              stroke="#4C3A6E"
              strokeWidth="4"
            />
          </g>

          {/* Central Amphitheatre Bowl */}
          <circle
            cx={CX}
            cy={CY}
            r={R_IN}
            fill={config.theme.zoneColors['main-bowl']?.bg || '#3F0F8A'}
            stroke={config.theme.zoneColors['main-bowl']?.border || '#7928CA'}
            strokeWidth="3"
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectZone('main-bowl')}
          />

          {/* Stage Core */}
          <circle cx={CX} cy={290} r="32" fill="#FAF3E0" stroke="#111827" strokeWidth="3" opacity="0.9" />
          <text x={CX} y={294} textAnchor="middle" className="zone-core-label" fill="#111827">
            MAIN STAGE
          </text>

          {/* Outer Wings / Sectors */}
          {config.zones.map((z) => {
            if (z.type !== 'sector' || z.a1 === undefined || z.a2 === undefined) return null
            const zTheme = config.theme.zoneColors[z.colorKey] || { bg: '#2E9D8F', text: '#FFFFFF' }
            return (
              <polygon
                key={z.id}
                points={sectorPoints(CX, CY, R_IN, R_OUT, z.a1, z.a2)}
                fill={zTheme.bg}
                stroke={zTheme.border || '#111827'}
                strokeWidth="2.5"
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectZone(z.id)}
              />
            )
          })}

          {/* Corridor Radial Aisles */}
          <circle
            cx={CX}
            cy={CY}
            r="225"
            fill="none"
            stroke="#FAF3E0"
            strokeWidth="1.5"
            strokeDasharray="4 8"
            opacity="0.2"
          />
          {RADIALS.map((a) => {
            const p = polar(CX, CY, R_OUT, a)
            const q = polar(CX, CY, R_IN, a)
            return (
              <line
                key={a}
                x1={q.x}
                y1={q.y}
                x2={p.x}
                y2={p.y}
                stroke="#FAF3E0"
                strokeWidth="1.5"
                strokeDasharray="4 8"
                opacity="0.2"
              />
            )
          })}

          {/* Architectural Zone Nameplates */}
          <text x={320} y={115} textAnchor="middle" className="zone-nameplate" fill="#FFFFFF">
            HALL XYZ EXPO
          </text>
          <text x={540} y={325} textAnchor="middle" className="zone-nameplate" fill="#FFFFFF">
            STARTUP FEST
          </text>
          <text x={100} y={325} textAnchor="middle" className="zone-nameplate" fill="#111827">
            STUDIOS 2 &amp; 3
          </text>
          <text x={320} y={485} textAnchor="middle" className="zone-nameplate subtle" fill="#D8D4E2">
            ATRIUM RING
          </text>

          {/* Points Of Interest / Sponsor Booths Pins */}
          {config.pois.map((poi) => {
            const isSponsor = poi.category === 'sponsor'
            return (
              <g
                key={poi.id}
                className="poi-marker"
                transform={`translate(${poi.x}, ${poi.y})`}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectPOI(poi)
                }}
              >
                <circle cx={0} cy={0} r={isSponsor ? 16 : 14} fill="#111827" stroke="#FAF3E0" strokeWidth="2.5" />
                <circle cx={0} cy={0} r={isSponsor ? 8 : 6} fill={isSponsor ? '#F5A623' : '#00F0FF'} />
                
                <g transform="translate(0, -26)">
                  <rect
                    x={-42}
                    y={-12}
                    width={84}
                    height={22}
                    rx={11}
                    fill="#1A1428"
                    stroke="#FAF3E0"
                    strokeWidth="1.5"
                    className="poi-pill-bg"
                  />
                  <text x={0} y={3} textAnchor="middle" className="poi-pill-text" fill="#FAF3E0">
                    {poi.name.split(' ')[0]}
                  </text>
                </g>
              </g>
            )
          })}

          {/* Active Navigation Route Layer */}
          {routePathD && (
            <g className="route-navigation-layer">
              <path
                d={routePathD}
                fill="none"
                stroke={config.theme.navLineGlow}
                strokeWidth="18"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#routeGlow)"
              />
              <path
                d={routePathD}
                fill="none"
                stroke="#111827"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={routePathD}
                fill="none"
                stroke={config.theme.navLine}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="neon-flowing-path"
              />
              {activeRoute?.pathNodes.map((n, idx) => {
                const isTarget = idx === activeRoute.pathNodes.length - 1
                return (
                  <circle
                    key={n.id + idx}
                    cx={n.x}
                    cy={n.y}
                    r={isTarget ? 9 : 4}
                    fill={isTarget ? '#FF0055' : '#00F0FF'}
                    stroke="#FAF3E0"
                    strokeWidth="2"
                  />
                )
              })}
            </g>
          )}

          {/* Realtime User Pulsing Beacon (pinned to coordinate, stays stable) */}
          <g className="user-live-beacon" transform={`translate(${currentLocation.x}, ${currentLocation.y})`}>
            <circle cx={0} cy={0} r={32} fill="none" stroke="#00F0FF" strokeWidth="2" className="sonar-ring" />
            <circle cx={0} cy={0} r={16} fill="#00F0FF" stroke="#FAF3E0" strokeWidth="3" />
            <circle cx={0} cy={0} r={6} fill="#111827" />
            <path d="M -8 -16 L 0 -30 L 8 -16 Z" fill="#00F0FF" stroke="#111827" strokeWidth="1.5" />
          </g>
        </svg>
      </div>

      <div className="viewport-controls-stack">
        <button
          className={`vp-ctrl-btn ${is3D ? 'active' : ''}`}
          onClick={() => setIs3D(!is3D)}
          aria-label="Toggle 2D/3D Perspective"
        >
          {is3D ? '3D' : '2D'}
        </button>
        <button
          className="vp-ctrl-btn"
          onClick={() => setScale((s) => Math.min(2.5, s * 1.25))}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          className="vp-ctrl-btn"
          onClick={() => setScale((s) => Math.max(0.7, s * 0.8))}
          aria-label="Zoom out"
        >
          −
        </button>
        <button className="vp-ctrl-btn" onClick={resetCamera} aria-label="Recenter on venue">
          🎯
        </button>
      </div>
    </div>
  )
}
