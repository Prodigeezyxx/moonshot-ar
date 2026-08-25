import { useState } from 'react'
import { type WhiteLabelVenueConfig, type POIItem } from '../types/venueConfig'

export default function DestinationPicker({
  isOpen,
  config,
  onClose,
  onSelect
}: {
  isOpen: boolean
  config: WhiteLabelVenueConfig
  onClose: () => void
  onSelect: (poi: POIItem) => void
}) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  if (!isOpen) return null

  const categories = [
    { id: 'all', label: 'All Places' },
    { id: 'stage', label: 'Stages & Arenas' },
    { id: 'sponsor', label: 'Sponsor Booths' },
    { id: 'workshop', label: 'Workshops' },
    { id: 'exhibition', label: 'Exhibitions' }
  ]

  const filtered = config.pois.filter((poi) => {
    const matchesCat = activeCategory === 'all' || poi.category === activeCategory
    const matchesQuery =
      poi.name.toLowerCase().includes(query.toLowerCase()) ||
      (poi.subtitle && poi.subtitle.toLowerCase().includes(query.toLowerCase())) ||
      (poi.description && poi.description.toLowerCase().includes(query.toLowerCase()))
    return matchesCat && matchesQuery
  })

  return (
    <div className="picker-modal-backdrop" onClick={onClose}>
      <div className="picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="picker-header">
          <div className="picker-title-block">
            <h3>EXPLORE VENUE</h3>
            <span className="picker-venue-tag">{config.name} • {config.locationName}</span>
          </div>
          <button className="picker-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="picker-search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="picker-input"
            placeholder="Search stages, booths, keynotes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery('')}>
              ✕
            </button>
          )}
        </div>

        <div className="picker-categories-scroll">
          {categories.map((c) => (
            <button
              key={c.id}
              className={`cat-chip ${activeCategory === c.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="picker-results-list">
          {filtered.length === 0 ? (
            <div className="picker-empty-state">No locations found for &quot;{query}&quot;</div>
          ) : (
            filtered.map((poi) => (
              <div
                key={poi.id}
                className="poi-list-item"
                onClick={() => {
                  onSelect(poi)
                  onClose()
                }}
              >
                <div className={`poi-category-badge cat-${poi.category}`}>
                  {poi.category === 'sponsor' ? '⭐' : poi.category === 'stage' ? '🎙️' : '📍'}
                </div>
                <div className="poi-item-body">
                  <div className="poi-title-row">
                    <span className="poi-name">{poi.name}</span>
                    {poi.boothNumber && <span className="poi-booth-tag">{poi.boothNumber}</span>}
                  </div>
                  {poi.subtitle && <div className="poi-sub">{poi.subtitle}</div>}
                </div>
                <div className="poi-route-btn">
                  Navigate →
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
