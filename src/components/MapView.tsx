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
  // Stable 2D/Isometric camera transform state
  // scale = 1.0 (fit 640x640 cleanly in viewport), panX = 0, panY = 0
  const [scale, setScale] = useState<number>(0.92)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [is3D, setIs3D] = useState<boolean>(true) // default to modern isometric 3D tilt

  const isDragging = useRef(false)
  const lastTouch = useRef<{ x: number; y: number } | null>(null)
  const lastTouchDist = useRef<number | null>(null)

  // Follow user or route destination smoothly when route changes
  useEffect(() => {
    if (activeRoute && activeRoute.pathNodes.length > 0) {
      const dest = activeRoute.pathNodes[activeRoute.pathNodes.length - 1]
      // center around midpoint between start & dest
      const midX = (currentLocation.x + dest.x) / 2
      const midY = (currentLocation.y + dest.y) / 2
      setPan({ x: (CX - midX) * 0.4, y: (CY - midY) * 0.4 })
    }
  }, [activeRoute, currentLocation.x, currentLocation.y])

  // Mouse pan/zoom handlers
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92
    setScale((prev) => Math.min(2.8, Math.max(0.5, prev * zoomFactor)))
  }

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    isDragging.current = true
    lastTouch.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !lastTouch.current) return
    const dx = e.clientX - lastTouch.current.x
    const dy = e.clientY - lastTouch.current.y
    lastTouch.current = { x: e.clientX, y: e.clientY }
    setPan((p) => ({
      x: Math.max(-280, Math.min(280, p.x + dx)),
      y: Math.max(-280, Math.min(280, p.y + dy))
    }))
  }

  const handlePointerUp = () => {
    isDragging.current = false
    lastTouch.current = null
  }

  // Touch Pinch-to-Zoom & Dual-finger drag
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      lastTouchDist.current = dist
    }
  }

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && lastTouch.current) {
      const dx = e.touches[0].clientX - lastTouch.current.x
      const dy = e.touches[0].clientY - lastTouch.current.y
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      setPan((p) => ({
        x: Math.max(-280, Math.min(280, p.x + dx)),
        y: Math.max(-280, Math.min(280, p.y + dy))
      }))
    } else if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const ratio = dist / lastTouchDist.current
      lastTouchDist.current = dist
      setScale((prev) => Math.min(2.8, Math.max(0.5, prev * ratio)))
    }
  }

  const handleTouchEnd = () => {
    lastTouch.current = null
    lastTouchDist.current = null
  }

  const resetCamera = () => {
    setScale(0.92)
    setPan({ x: 0, y: 0 })
  }

  // Active Route SVG Path
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
      {/* 3D Perspective Transformation Plane (The World Anchor) */}
      <div
        className="map-world-plane"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${scale})`
        }}
      >
        <svg
          viewBox="0 0 640 640"
          className="map-svg-surface"
          role="img"
          aria-label={`${config.name} ${config.locationName} Floorplan`}
        >
          <defs>
            {/* Ambient Glow Filters for Neon Navigation Lines */}
            <filter id="routeGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Subtle Drop shadow for architectural building slabs */}
            <filter id="buildingDropShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="16" stdDeviation="14" floodColor="#000000" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Base Grid / Floor Slab */}
          <rect width="640" height="640" rx="36" fill="#130D20" />

          {/* Building Architectural Base Outer Drum */}
          <g filter="url(#buildingDropShadow)">
            <circle
              cx={CX}
              cy={CY}
              r={R_OUT}
              fill={config.theme.zoneColors['atrium']?.bg || '#261C3D'}
              stroke="#3F0F8A"
              strokeWidth="4"
            />
          </g>

          {/* Central Amphitheatre / Main Bowl */}
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

          {/* Corridor Radial Aisles (Subtle dashed architectural guidelines) */}
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
                {/* Visual Anchor Disc */}
                <circle cx={0} cy={0} r={isSponsor ? 16 : 14} fill="#111827" stroke="#FAF3E0" strokeWidth="2.5" />
                <circle cx={0} cy={0} r={isSponsor ? 8 : 6} fill={isSponsor ? '#F5A623' : '#00F0FF'} />
                
                {/* 3D Floating Pill Label */}
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

          {/* Active Navigation Route Layer (GPS Glowing Route Line) */}
          {routePathD && (
            <g className="route-navigation-layer">
              {/* Outer Cyan Glow Underlay */}
              <path
                d={routePathD}
                fill="none"
                stroke={config.theme.navLineGlow}
                strokeWidth="18"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#routeGlow)"
              />
              {/* Dark Outline Base */}
              <path
                d={routePathD}
                fill="none"
                stroke="#111827"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Animated Neon Cyan Core Navigation Line */}
              <path
                d={routePathD}
                fill="none"
                stroke={config.theme.navLine}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="neon-flowing-path"
              />
              {/* Waypoint Nodes */}
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

          {/* Realtime User Pulsing "You Are Here" Marker */}
          <g className="user-live-beacon" transform={`translate(${currentLocation.x}, ${currentLocation.y})`}>
            {/* Sonar Beacon Rings */}
            <circle cx={0} cy={0} r={32} fill="none" stroke="#00F0FF" strokeWidth="2" className="sonar-ring" />
            <circle cx={0} cy={0} r={16} fill="#00F0FF" stroke="#FAF3E0" strokeWidth="3" />
            <circle cx={0} cy={0} r={6} fill="#111827" />
            {/* User Directional Heading Cone */}
            <path d="M -8 -16 L 0 -30 L 8 -16 Z" fill="#00F0FF" stroke="#111827" strokeWidth="1.5" />
          </g>
        </svg>
      </div>

      {/* Floating Viewport Quick Controls (Zoom, 2D/3D Toggle, Recenter) */}
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
          onClick={() => setScale((s) => Math.min(2.8, s * 1.25))}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          className="vp-ctrl-btn"
          onClick={() => setScale((s) => Math.max(0.5, s * 0.8))}
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
