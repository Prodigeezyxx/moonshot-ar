import { useState, useMemo } from 'react'
import { type WhiteLabelVenueConfig, type POIItem } from '../types/venueConfig'

interface CategoryFilterProps {
  config: WhiteLabelVenueConfig
  activeCategory: string
  onSelectCategory: (categoryId: string) => void
  onSelectPOI: (poi: POIItem) => void
}

export default function CategoryFilterBar({
  config,
  activeCategory,
  onSelectCategory,
  onSelectPOI
}: CategoryFilterProps) {
  const [isExpandedListOpen, setIsExpandedListOpen] = useState(false)

  const categories = useMemo(() => [
    { id: 'all', label: 'All POIs' },
    { id: 'stage', label: 'Stages' },
    { id: 'sponsor', label: 'Sponsors' },
    { id: 'workshop', label: 'Workshops' },
    { id: 'exhibition', label: 'Exhibition' }
  ], [])

  const filteredPOIs = useMemo(() => {
    if (activeCategory === 'all') return config.pois
    return config.pois.filter((p) => p.category === activeCategory)
  }, [config.pois, activeCategory])

  return (
    <div className="filter-carousel-wrapper" data-tour="filters">
      <div className="filter-pill-scroll">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              className={`filter-chip ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (isActive && activeCategory !== 'all') {
                  onSelectCategory('all')
                  setIsExpandedListOpen(false)
                } else {
                  onSelectCategory(cat.id)
                  setIsExpandedListOpen(cat.id !== 'all')
                }
              }}
            >
              <span className="chip-label">{cat.label}</span>
              {isActive && cat.id !== 'all' && (
                <span className="chip-count">{filteredPOIs.length}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Quick Dropdown Card when a specific category is active */}
      {isExpandedListOpen && activeCategory !== 'all' && (
        <div className="category-quick-dropdown">
          <div className="dropdown-header">
            <span>{categories.find((c) => c.id === activeCategory)?.label} Directory</span>
            <button
              className="dropdown-close"
              onClick={() => setIsExpandedListOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="dropdown-items-grid">
            {filteredPOIs.map((poi) => (
              <div
                key={poi.id}
                className="dropdown-poi-card"
                onClick={() => {
                  onSelectPOI(poi)
                  setIsExpandedListOpen(false)
                }}
              >
                <div className="poi-quick-name">{poi.name}</div>
                <div className="poi-quick-sub">{poi.subtitle || poi.category}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
