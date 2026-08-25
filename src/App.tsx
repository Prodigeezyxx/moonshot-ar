import { useState, useEffect } from 'react'
import MapView from './components/MapView'
import OnboardingOverlay from './components/OnboardingOverlay'
import DestinationPicker from './components/DestinationPicker'
import DirectionsCard from './components/DirectionsCard'
import ARLauncherModal from './components/ARLauncherModal'
import GamificationModal from './components/GamificationModal'
import QRScannerModal from './components/QRScannerModal'
import { findRoute, type RouteResult } from './utils/pathfinding'
import { MOONSHOT_2026_CONFIG } from './data/venueConfig'
import { type POIItem, type WhiteLabelVenueConfig } from './types/venueConfig'
import { useGamification } from './hooks/useGamification'

export default function App() {
  const [venueConfig] = useState<WhiteLabelVenueConfig>(MOONSHOT_2026_CONFIG)

  // Gamification Hook
  const { state: gameState, recordCheckIn, getLeaderboard, allBadges } = useGamification()

  const [selectedPOI, setSelectedPOI] = useState<POIItem | null>(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isGamificationOpen, setIsGamificationOpen] = useState(false)
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false)
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null)
  const [targetName, setTargetName] = useState<string>('')
  const [isAROpen, setIsAROpen] = useState(false)

  // Current position
  const [currentLocationNodeId, setCurrentLocationNodeId] = useState<string>(
    venueConfig.defaultStartNodeId
  )

  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem('moonshot-onboarded') === '1'
  )

  // Deep linking detection (?zone=, ?booth=, ?dest=)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const zoneParam = params.get('zone')
    const boothParam = params.get('booth')

    if (zoneParam) {
      const match = venueConfig.pois.find((p) => p.zoneId === zoneParam)
      if (match) {
        startNavigationTo(match.nodeId, match.name)
      }
    } else if (boothParam) {
      const match = venueConfig.pois.find(
        (p) => p.id.includes(boothParam) || p.nodeId.includes(boothParam)
      )
      if (match) {
        startNavigationTo(match.nodeId, match.name)
      }
    }
  }, [venueConfig])

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

  const handleCheckIn = (nodeId: string, name: string, type: 'zone' | 'booth') => {
    setCurrentLocationNodeId(nodeId)
    recordCheckIn(nodeId, name, type)
    setSelectedPOI(null)
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

        <div className="top-nav-actions">
          <button
            className="qr-scan-pill-btn"
            onClick={() => setIsQRScannerOpen(true)}
            aria-label="Scan QR Checkin"
          >
            📷 Check In
          </button>
          <button
            className="search-pill-btn"
            onClick={() => setIsPickerOpen(true)}
            aria-label="Search destination"
          >
            🔍 Search
          </button>
        </div>
      </header>

      {/* Main Map Stage */}
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
                onClick={() =>
                  handleCheckIn(
                    selectedPOI.nodeId,
                    selectedPOI.name,
                    selectedPOI.category === 'sponsor' ? 'booth' : 'zone'
                  )
                }
              >
                CHECK IN (+50 XP)
              </button>
            </div>
          </div>
        )}

        {/* Realtime Active Directions Dock */}
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
        <div className="hud-stat-pill" onClick={() => setIsGamificationOpen(true)}>
          XP <span className="num">{gameState.xp}</span>
        </div>
        <div className="hud-stat-pill" onClick={() => setIsGamificationOpen(true)}>
          Badges <span className="num">{gameState.unlockedBadgeIds.length}</span>
        </div>
        <div
          className="hud-leaderboard-btn"
          onClick={() => setIsGamificationOpen(true)}
        >
          🏆 #{gameState.rank} LEADERBOARD
        </div>
      </nav>

      {/* Modals & Dialogs */}
      <DestinationPicker
        isOpen={isPickerOpen}
        config={venueConfig}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handlePOISelect}
      />

      <GamificationModal
        isOpen={isGamificationOpen}
        onClose={() => setIsGamificationOpen(false)}
        state={gameState}
        leaderboard={getLeaderboard()}
        allBadges={allBadges}
      />

      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={(nodeId, name) => handleCheckIn(nodeId, name, 'zone')}
      />

      {isAROpen && (
        <ARLauncherModal
          targetName={targetName}
          onClose={() => setIsAROpen(false)}
        />
      )}

      {!onboarded && <OnboardingOverlay onClose={dismissOnboarding} />}
    </div>
  )
}
