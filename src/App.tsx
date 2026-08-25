import { useState } from 'react'
import MapView from './components/MapView'
import OnboardingOverlay from './components/OnboardingOverlay'
import DestinationPicker from './components/DestinationPicker'
import DirectionsCard from './components/DirectionsCard'
import ARLauncherModal from './components/ARLauncherModal'
import { findRoute, type RouteResult } from './utils/pathfinding'
import { MOONSHOT_2026_CONFIG } from './data/venueConfig'
import { type POIItem, type WhiteLabelVenueConfig } from './types/venueConfig'

export default function App() {
  // Configurable White-Label Venue Engine State
  const [venueConfig] = useState<WhiteLabelVenueConfig>(MOONSHOT_2026_CONFIG)

  const [selectedPOI, setSelectedPOI] = useState<POIItem | null>(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null)
  const [targetName, setTargetName] = useState<string>('')
  const [isAROpen, setIsAROpen] = useState(false)

  // Current position (default to South Lobby junction)
  const [currentLocationNodeId, setCurrentLocationNodeId] = useState<string>(
    venueConfig.defaultStartNodeId
  )

  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem('moonshot-onboarded') === '1'
  )

  const dismissOnboarding = () => {
    localStorage.setItem('moonshot-onboarded', '1')
    setOnboarded(true)
  }

  const startNavigationTo = (nodeId: string, name: string) => {
    const route = findRoute(currentLocationNodeId, nodeId)
    if (route) {
      setActiveRoute(route)
      setTargetName(name)
      setSelectedPOI(null)
    } else {
      alert(`No direct path found to ${name}.`)
    }
  }

  const handlePOISelect = (poi: POIItem) => {
    startNavigationTo(poi.nodeId, poi.name)
  }

  const handleZoneSelect = (zoneId: string) => {
    const zonePOI = venueConfig.pois.find((p) => p.zoneId === zoneId)
    if (zonePOI) {
      setSelectedPOI(zonePOI)
    }
  }

  const clearRoute = () => {
    setActiveRoute(null)
    setTargetName('')
  }

  const currentNode = venueConfig.graph.nodes[currentLocationNodeId] || {
    x: 320,
    y: 500,
    name: 'South Lobby'
  }

  return (
    <div className="app-root-shell">
      {/* Sleek Modern Top Bar */}
      <header className="top-nav-bar">
        <div className="brand-identity">
          <div className="brand-title">
            {venueConfig.name} <span className="brand-badge">WAYFINDER</span>
          </div>
          <span className="brand-sub">{venueConfig.locationName}</span>
        </div>
        <button
          className="search-pill-btn"
          onClick={() => setIsPickerOpen(true)}
          aria-label="Search destination"
        >
          🔍 Search Place
        </button>
      </header>

      {/* Main Map Stage (With 3D Isometric Viewport) */}
      <main className="map-wrap">
        <MapView
          config={venueConfig}
          onSelectPOI={setSelectedPOI}
          onSelectZone={handleZoneSelect}
          activeRoute={activeRoute}
          currentLocation={{ x: currentNode.x, y: currentNode.y, name: currentNode.name }}
        />

        {/* Selected POI Details Bottom Sheet */}
        {selectedPOI && !activeRoute && (
          <div className="sheet">
            <div className="sheet-header-row">
              <h2>{selectedPOI.name}</h2>
              <button
                className="sheet-close-btn"
                onClick={() => setSelectedPOI(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p>{selectedPOI.description || selectedPOI.subtitle}</p>
            <div className="row">
              <button
                className="btn primary"
                onClick={() => startNavigationTo(selectedPOI.nodeId, selectedPOI.name)}
              >
                START ROUTE
              </button>
              <button
                className="btn"
                onClick={() => {
                  setCurrentLocationNodeId(selectedPOI.nodeId)
                  alert(`Checked in to ${selectedPOI.name}! Position updated. (+25 XP)`)
                  setSelectedPOI(null)
                }}
              >
                CHECK IN (QR)
              </button>
            </div>
          </div>
        )}

        {/* Realtime Active Directions Dock (GPS Step-by-Step) */}
        {activeRoute && (
          <DirectionsCard
            route={activeRoute}
            destinationName={targetName}
            onClear={clearRoute}
            onLaunchAR={() => setIsAROpen(true)}
          />
        )}
      </main>

      {/* Floating Modern HUD Dock */}
      <nav className="bottom-hud-dock">
        <div className="hud-stat-pill">
          XP <span className="num">25</span>
        </div>
        <div className="hud-stat-pill">
          Badges <span className="num">1</span>
        </div>
        <div
          className="hud-leaderboard-btn"
          onClick={() => alert('Leaderboard & Quests arrive in Phase 3!')}
        >
          🏆 LEADERBOARD
        </div>
      </nav>

      {/* Destination Picker Modal */}
      <DestinationPicker
        isOpen={isPickerOpen}
        config={venueConfig}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handlePOISelect}
      />

      {/* AR Navigation Viewport Preview */}
      {isAROpen && (
        <ARLauncherModal
          targetName={targetName}
          onClose={() => setIsAROpen(false)}
        />
      )}

      {/* First-run Onboarding */}
      {!onboarded && <OnboardingOverlay onClose={dismissOnboarding} />}
    </div>
  )
}
