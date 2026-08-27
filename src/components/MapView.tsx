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
const R_INNER_STAGE = 95
const R_AUDITORIUM = 165
const R_LOBBY_RING = 215
const R_OUTER_TERRACE = 295

// 32 architectural radial aisles matching the actual blueprint
const NUM_RADIALS = 32
const RADIAL_ANGLES = Array.from({ length: NUM_RADIALS }, (_, i) => (i * 360) / NUM_RADIALS)

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function sectorPoints(cx: number, cy: number, rIn: number, rOut: number, a1: number, a2: number, steps = 24) {
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
  const [scale, setScale] = useState<number>(1.0)
  const [is3D, setIs3D] = useState<boolean>(false)

  const isDragging = useRef(false)
  const lastTouch = useRef<{ x: number; y: number } | null>(null)
  const lastTouchDist = useRef<number | null>(null)

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
    if (activeRoute) {
      isDragging.current = false
      return
    }
    isDragging.current = true
    lastTouch.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !lastTouch.current || activeRoute) return
    lastTouch.current = { x: e.clientX, y: e.clientY }
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
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const ratio = dist / lastTouchDist.current
      lastTouchDist.current = dist
      setScale((prev) => Math.min(2.5, Math.max(0.7, prev * ratio)))
    }
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
          transform: `scale(${scale}) ${is3D ? 'rotateX(26deg) rotateZ(-2deg)' : ''}`,
        }}
      >
        <svg
          viewBox="0 0 640 640"
          className="map-svg-surface"
          role="img"
          aria-label={`${config.name} ${config.locationName} Floorplan`}
        >
          <defs>
            <filter id="routeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <filter id="buildingDropShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="16" stdDeviation="14" floodColor="#000000" floodOpacity="0.75" />
            </filter>

            <linearGradient id="mainStageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4A159D" />
              <stop offset="100%" stopColor="#250954" />
            </linearGradient>

            <linearGradient id="neonPathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="50%" stopColor="#7000FF" />
              <stop offset="100%" stopColor="#00F0FF" />
            </linearGradient>

            <radialGradient id="beaconPulseGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0, 240, 255, 0.8)" />
              <stop offset="60%" stopColor="rgba(0, 240, 255, 0.2)" />
              <stop offset="100%" stopColor="rgba(0, 240, 255, 0)" />
            </radialGradient>
          </defs>

          {/* Base Background Plate */}
          <rect width="640" height="640" rx="36" fill="#0D0917" />

          {/* 1. Outermost 32 Stepped Terrace Facade Colonnade */}
          <g filter="url(#buildingDropShadow)">
            <circle
              cx={CX}
              cy={CY}
              r={R_OUTER_TERRACE}
              fill="#120E1C"
              stroke="#2E2344"
              strokeWidth="2"
            />
            {/* 32 Architectural Outer Perimeter Entrance Notches */}
            {RADIAL_ANGLES.map((deg) => {
              const p = polar(CX, CY, R_OUTER_TERRACE, deg)
              return (
                <circle
                  key={`notch-${deg}`}
                  cx={p.x}
                  cy={p.y}
                  r="2.5"
                  fill="#00F0FF"
                  opacity="0.4"
                />
              )
            })}
          </g>

          {/* 2. Outer Radial Tiered Seating Wedges (Matches Architectural Blueprint) */}
          <g opacity="0.85">
            {RADIAL_ANGLES.map((deg, idx) => {
              const nextDeg = (deg + 360 / NUM_RADIALS - 2.5) % 360
              // Skip entrance gaps at 4 cardinal gates (North, South, East, West)
              if ([270, 90, 0, 180].some((card) => Math.abs(deg - card) < 10)) return null

              return (
                <polygon
                  key={`tier-${idx}`}
                  points={sectorPoints(CX, CY, R_LOBBY_RING, R_OUTER_TERRACE - 8, deg + 1.25, nextDeg)}
                  fill="#1E162F"
                  stroke="#33244F"
                  strokeWidth="0.8"
                />
              )
            })}
          </g>

          {/* 3. Annular Full-Circle Public Lobby Ring */}
          <circle
            cx={CX}
            cy={CY}
            r={R_LOBBY_RING}
            fill="#181126"
            stroke="#5D28BA"
            strokeWidth="1.5"
            strokeDasharray="2 4"
            opacity="0.6"
          />

          {/* 4. 4 Cardinal Staircase / Elevator Service Cores (North, South, East, West) */}
          {[
            { x: CX - 14, y: CY - R_LOBBY_RING - 6, w: 28, h: 12, label: 'ST-N' },
            { x: CX - 14, y: CY + R_LOBBY_RING - 6, w: 28, h: 12, label: 'ST-S' },
            { x: CX + R_LOBBY_RING - 6, y: CY - 14, w: 12, h: 28, label: 'ST-E' },
            { x: CX - R_LOBBY_RING - 6, y: CY - 14, w: 12, h: 28, label: 'ST-W' }
          ].map((stair, i) => (
            <rect
              key={`stair-${i}`}
              x={stair.x}
              y={stair.y}
              width={stair.w}
              height={stair.h}
              rx="3"
              fill="#261A3D"
              stroke="#FAF3E0"
              strokeWidth="1"
              opacity="0.75"
            />
          ))}

          {/* 5. Central 5,000-Seat Horseshoe Amphitheatre Auditorium */}
          <circle
            cx={CX}
            cy={CY}
            r={R_AUDITORIUM}
            fill="url(#mainStageGrad)"
            stroke="#5D28BA"
            strokeWidth="2.5"
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectZone('main-bowl')}
          />

          {/* Concentric Tiered Horseshoe Seating Arcs in Main Bowl */}
          {[120, 140, 155].map((r) => (
            <circle
              key={`arc-${r}`}
              cx={CX}
              cy={CY}
              r={r}
              fill="none"
              stroke="#FAF3E0"
              strokeWidth="0.8"
              strokeDasharray="3 6"
              opacity="0.25"
            />
          ))}

          {/* 6. Recessed Proscenium Keynote Stage (South Perimeter Core) */}
          <g>
            <path
              d={`M ${CX - 50} 270 Q ${CX} 250 ${CX + 50} 270 L ${CX + 42} 312 L ${CX - 42} 312 Z`}
              fill="#FAF3E0"
              stroke="#111827"
              strokeWidth="2"
              opacity="0.95"
            />
            {/* Backstage Technical Rigging / Fly Tower block */}
            <rect
              x={CX - 36}
              y="225"
              width="72"
              height="28"
              rx="4"
              fill="#1C142E"
              stroke="#FAF3E0"
              strokeWidth="1.2"
              opacity="0.8"
            />
            <text x={CX} y="242" textAnchor="middle" fill="#9E93B8" fontSize="7.5" fontWeight="600">
              BACKSTAGE / RIGGING
            </text>
            <text x={CX} y="294" textAnchor="middle" className="zone-core-label" fill="#111827">
              MAIN STAGE
            </text>
          </g>

          {/* Outer Key Conference Zones (Hall XYZ, Startup Festival, Studios) */}
          {config.zones.map((z) => {
            if (z.type !== 'sector' || z.a1 === undefined || z.a2 === undefined) return null
            const zTheme = config.theme.zoneColors[z.colorKey] || { bg: '#2E9D8F', text: '#FFFFFF' }
            return (
              <polygon
                key={z.id}
                points={sectorPoints(CX, CY, R_AUDITORIUM, R_OUTER_TERRACE, z.a1, z.a2)}
                fill={zTheme.bg}
                stroke={zTheme.border || '#111827'}
                strokeWidth="1.5"
                style={{ cursor: 'pointer', opacity: 0.88 }}
                onClick={() => onSelectZone(z.id)}
              />
            )
          })}

          {/* 32 Straight Radial Circulation Aisles */}
          {RADIAL_ANGLES.map((deg) => {
            const p = polar(CX, CY, R_OUTER_TERRACE, deg)
            const q = polar(CX, CY, R_AUDITORIUM, deg)
            return (
              <line
                key={`aisle-${deg}`}
                x1={q.x}
                y1={q.y}
                x2={p.x}
                y2={p.y}
                stroke="#FAF3E0"
                strokeWidth="0.9"
                strokeDasharray="2 4"
                opacity="0.2"
              />
            )
          })}

          {/* Architectural Zone Nameplates - cleaned */}
          <text x={320} y={112} textAnchor="middle" fill="#FFFFFF" fontSize="10px" fontWeight="600">
            HALL XYZ
          </text>
          <text x={530} y={322} textAnchor="middle" fill="#FFFFFF" fontSize="10px" fontWeight="600">
            STARTUP
          </text>
          <text x={110} y={322} textAnchor="middle" fill="#FFFFFF" fontSize="10px" fontWeight="600">
            STUDIOS
          </text>
          <text x={320} y={495} textAnchor="middle" fill="#9E93B8" fontSize="8.5px">
            LOBBY
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
                <circle cx={0} cy={0} r={isSponsor ? 13 : 11} fill="#0F0B1A" stroke="#FAF3E0" strokeWidth="1.5" />
                <circle cx={0} cy={0} r={isSponsor ? 6 : 4.5} fill={isSponsor ? '#F5A623' : '#00F0FF'} />
                
                <g transform="translate(0, -18)">
                  <rect
                    x={-30}
                    y={-9}
                    width={60}
                    height={18}
                    rx={9}
                    fill="#141518"
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="0.8"
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
                stroke="rgba(0, 240, 255, 0.35)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#routeGlow)"
              />
              <path
                d={routePathD}
                fill="none"
                stroke="#0B0814"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={routePathD}
                fill="none"
                stroke="url(#neonPathGrad)"
                strokeWidth="3.5"
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
                    r={isTarget ? 7 : 3}
                    fill={isTarget ? '#FF0055' : '#00F0FF'}
                    stroke="#FFFFFF"
                    strokeWidth="1.2"
                  />
                )
              })}
            </g>
          )}

          {/* Realtime User Pulsing Beacon */}
          <g className="user-live-beacon" transform={`translate(${currentLocation.x}, ${currentLocation.y})`}>
            <circle cx={0} cy={0} r={28} fill="url(#beaconPulseGrad)" className="sonar-ring" />
            <circle cx={0} cy={0} r={11} fill="#00F0FF" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx={0} cy={0} r={4} fill="#0B0814" />
            <path d="M -5 -11 L 0 -21 L 5 -11 Z" fill="#00F0FF" stroke="#0B0814" strokeWidth="0.8" />
          </g>
        </svg>
      </div>

      {/* Floating Compact Map Legend */}
      <div className="mini-map-legend">
        <div className="legend-title">VENUE ZONES</div>
        <div className="legend-items-grid">
          <div className="legend-item" onClick={() => onSelectZone('main-bowl')}>
            <span className="legend-color-dot" style={{ background: '#3F0F8A' }} />
            <span>Main Stage</span>
          </div>
          <div className="legend-item" onClick={() => onSelectZone('hall-xyz')}>
            <span className="legend-color-dot" style={{ background: '#2E9D8F' }} />
            <span>Hall XYZ</span>
          </div>
          <div className="legend-item" onClick={() => onSelectZone('startup-festival')}>
            <span className="legend-color-dot" style={{ background: '#E85D3F' }} />
            <span>Pitch Arena</span>
          </div>
          <div className="legend-item" onClick={() => onSelectZone('studios')}>
            <span className="legend-color-dot" style={{ background: '#9AD5B1' }} />
            <span>Studios 2&amp;3</span>
          </div>
        </div>
      </div>

      {/* Viewport controls */}
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
