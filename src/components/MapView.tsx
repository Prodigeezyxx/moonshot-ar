import {
  useRef,
  useState,
  type WheelEvent,
  type PointerEvent
} from 'react'
import { ZONES, BOOTHS, zoneById } from '../data/venue'

const CX = 320
const CY = 320
const R_IN = 165 // inner edge of the atrium band (edge of the main bowl)
const R_OUT = 300 // outer edge of the drum

// Three outer zone sectors (degrees, 0 = right / +x axis, y grows downward):
const ZONE_SECTORS = [
  { id: 'hall-xyz', a1: -130, a2: -50 },
  { id: 'startup-festival', a1: -40, a2: 40 },
  { id: 'studios', a1: 130, a2: 230 }
]

const RADIALS = [-90, -18, 54, 126, 198]

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

// Polygon approximation of an annulus sector (robust, no arc sweep-flag fuss).
function sectorPoints(
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  a1: number,
  a2: number,
  steps = 48
) {
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

export interface SelectInfo {
  title: string
  description: string
}

export default function MapView({
  onSelect
}: {
  onSelect: (info: SelectInfo) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const [vb, setVb] = useState({ x: 0, y: 0, w: 640, h: 640 })

  const onWheel = (e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const factor = e.deltaY < 0 ? 0.9 : 1.1
    const mx = ((e.clientX - rect.left) / rect.width) * vb.w
    const my = ((e.clientY - rect.top) / rect.height) * vb.h
    const w = Math.min(4000, Math.max(200, vb.w * factor))
    const realFactor = w / vb.w
    const h = vb.h * realFactor
    setVb({
      x: mx - (mx - vb.x) * realFactor,
      y: my - (my - vb.y) * realFactor,
      w,
      h
    })
  }

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    dragRef.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const dx = e.clientX - dragRef.current.x
    const dy = e.clientY - dragRef.current.y
    dragRef.current = { x: e.clientX, y: e.clientY }
    const sx = vb.w / rect.width
    const sy = vb.h / rect.height
    setVb((v) => ({ ...v, x: v.x - dx * sx, y: v.y - dy * sy }))
  }

  const endDrag = () => {
    dragRef.current = null
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      role="img"
      aria-label="National Theatre Lagos floorplan — five zones, five sponsor booths"
    >
      {/* drum */}
      <circle cx={CX} cy={CY} r={R_OUT} fill="#EDE7F9" stroke="#111827" strokeWidth="3" />

      {/* main bowl (hero zone) */}
      <circle
        cx={CX}
        cy={CY}
        r={R_IN}
        fill={zoneById('main-bowl').color}
        style={{ cursor: 'pointer' }}
        onClick={() =>
          onSelect({
            title: zoneById('main-bowl').name,
            description: zoneById('main-bowl').description
          })
        }
      />

      {/* outer zone sectors */}
      {ZONE_SECTORS.map((s) => (
        <polygon
          key={s.id}
          points={sectorPoints(CX, CY, R_IN, R_OUT, s.a1, s.a2)}
          fill={zoneById(s.id).color}
          style={{ cursor: 'pointer' }}
          onClick={() =>
            onSelect({
              title: zoneById(s.id).name,
              description: zoneById(s.id).description
            })
          }
        />
      ))}

      {/* corridor rings + radial corridors (the "atrium" texture) */}
      <circle
        cx={CX}
        cy={CY}
        r={225}
        fill="none"
        stroke="#111827"
        strokeWidth="1.5"
        strokeDasharray="6 6"
        opacity="0.35"
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
            stroke="#111827"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            opacity="0.35"
          />
        )
      })}

      {/* sponsor booths */}
      {BOOTHS.map((b) => (
        <g
          key={b.id}
          style={{ cursor: 'pointer' }}
          onClick={() =>
            onSelect({
              title: `${b.name} — Sponsor Booth`,
              description: 'Check-in for XP arrives in Phase 4 (QR fallback).'
            })
          }
        >
          <circle cx={b.x} cy={b.y} r={13} fill="#111827" />
          <circle cx={b.x} cy={b.y} r={6} fill="#F5A623" />
          <text
            x={b.x}
            y={b.y - 20}
            textAnchor="middle"
            className="booth-label"
            fill="#111827"
          >
            {b.name}
          </text>
        </g>
      ))}

      {/* you-are-here (placeholder — QR-sourced for now) */}
      <g className="yah">
        <circle cx={320} cy={500} r={16} fill="#F5A623" stroke="#111827" strokeWidth="3" />
        <circle cx={320} cy={500} r={30} fill="none" stroke="#F5A623" strokeWidth="2" />
        <text x={320} y={542} textAnchor="middle" className="booth-label" fill="#111827">
          YOU ARE HERE
        </text>
      </g>

      {/* zone labels */}
      <text x={320} y={324} textAnchor="middle" className="zone-label" fill="#FAF3E0">
        MAIN BOWL
      </text>
      <text x={320} y={88} textAnchor="middle" className="zone-label" fill="#FAF3E0">
        HALL XYZ
      </text>
      <text x={548} y={314} textAnchor="middle" className="zone-label" fill="#FAF3E0">
        STARTUP
      </text>
      <text x={548} y={331} textAnchor="middle" className="zone-label" fill="#FAF3E0">
        FESTIVAL
      </text>
      <text x={92} y={314} textAnchor="middle" className="zone-label" fill="#111827">
        STUDIOS
      </text>
      <text x={92} y={331} textAnchor="middle" className="zone-label" fill="#111827">
        2 &amp; 3
      </text>
      <text x={320} y={470} textAnchor="middle" className="zone-label" fill="#111827" opacity="0.8">
        ATRIUM RING
      </text>
    </svg>
  )
}

export { ZONES }
