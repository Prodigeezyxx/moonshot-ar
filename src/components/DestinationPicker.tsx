import { useState } from 'react'
import { ZONES, BOOTHS } from '../data/venue'

export interface Destination {
  id: string
  name: string
  nodeId: string
  type: 'zone' | 'booth'
  color?: string
  subtitle?: string
}

const DESTINATIONS: Destination[] = [
  { id: 'main-bowl', name: 'Main Bowl (Stage)', nodeId: 'zone-main-stage', type: 'zone', color: '#3F0F8A', subtitle: 'Hero Keynote & AI Conf' },
  { id: 'hall-xyz', name: 'Hall XYZ Exhibition', nodeId: 'zone-hall-xyz', type: 'zone', color: '#2E9D8F', subtitle: 'Exhibition & Demo Stalls' },
  { id: 'startup-festival', name: 'Startup Festival Arena', nodeId: 'zone-startup-festival', type: 'zone', color: '#E85D3F', subtitle: 'Pitch Stage & Showcase' },
  { id: 'studios', name: 'Studios 2 & 3', nodeId: 'zone-studios', type: 'zone', color: '#9AD5B1', subtitle: 'Workshops & Breakouts' },
  { id: 'grey', name: 'Grey Finance', nodeId: 'booth-grey', type: 'booth', subtitle: 'Headline Sponsor • North Atrium' },
  { id: 'sabi', name: 'Sabi Stand', nodeId: 'booth-sabi', type: 'booth', subtitle: 'Sponsor Booth • East Atrium' },
  { id: 'accrue', name: 'Accrue Stand', nodeId: 'booth-accrue', type: 'booth', subtitle: 'Sponsor Booth • South-East' },
  { id: 'breet', name: 'Breet Stand', nodeId: 'booth-breet', type: 'booth', subtitle: 'Sponsor Booth • South-West' },
  { id: 'sentz', name: 'Sentz Stand', nodeId: 'booth-sentz', type: 'booth', subtitle: 'Sponsor Booth • West Atrium' }
]

export default function DestinationPicker({
  isOpen,
  onClose,
  onSelect
}: {
  isOpen: boolean
  onClose: () => void
  onSelect: (dest: Destination) => void
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'zone' | 'booth'>('all')

  if (!isOpen) return null

  const filtered = DESTINATIONS.filter((d) => {
    const matchType = filter === 'all' || d.type === filter
    const matchQuery =
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      (d.subtitle && d.subtitle.toLowerCase().includes(query.toLowerCase()))
    return matchType && matchQuery
  })

  return (
    <div className="picker-modal-backdrop" onClick={onClose}>
      <div className="picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="picker-header">
          <h3>CHOOSE DESTINATION</h3>
          <button className="picker-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="picker-search-wrap">
          <input
            type="text"
            className="picker-search-input"
            placeholder="Search zones, stages, or sponsors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="picker-filter-chips">
          <button
            className={`chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Places
          </button>
          <button
            className={`chip ${filter === 'zone' ? 'active' : ''}`}
            onClick={() => setFilter('zone')}
          >
            Zones &amp; Stages
          </button>
          <button
            className={`chip ${filter === 'booth' ? 'active' : ''}`}
            onClick={() => setFilter('booth')}
          >
            Sponsor Booths
          </button>
        </div>

        <div className="picker-list">
          {filtered.length === 0 ? (
            <div className="picker-empty">No locations found matching &quot;{query}&quot;</div>
          ) : (
            filtered.map((d) => (
              <div
                key={d.id}
                className="picker-item"
                onClick={() => {
                  onSelect(d)
                  onClose()
                }}
              >
                <div
                  className="picker-item-icon"
                  style={{ backgroundColor: d.color || '#3F0F8A' }}
                >
                  {d.type === 'zone' ? '📍' : '⭐'}
                </div>
                <div className="picker-item-details">
                  <div className="picker-item-name">{d.name}</div>
                  {d.subtitle && <div className="picker-item-sub">{d.subtitle}</div>}
                </div>
                <div className="picker-item-action">Go →</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
