import { useState, useEffect, useCallback } from 'react'
import MapView from './components/MapView'
import ThreeDMapView from './components/ThreeDMapView'
import OnboardingOverlay from './components/OnboardingOverlay'
import DestinationPicker from './components/DestinationPicker'
import DirectionsCard from './components/DirectionsCard'
import ARLauncherModal from './components/ARLauncherModal'
import GamificationModal from './components/GamificationModal'
import QRScannerModal from './components/QRScannerModal'
import CategoryFilterBar from './components/CategoryFilterBar'
import VenueQRPlacardModal from './components/VenueQRPlacardModal'
import ScheduleModal from './components/ScheduleModal'
import AIConciergeModal from './components/AIConciergeModal'
import { findRoute, type RouteResult } from './utils/pathfinding'
import { MOONSHOT_2026_CONFIG } from './data/venueConfig'
import { type POIItem, type WhiteLabelVenueConfig } from './types/venueConfig'
import { useGamification } from './hooks/useGamification'

export default function App() {
  const [venueConfig] = useState<WhiteLabelVenueConfig>(MOONSHOT_2026_CONFIG)

  // Gamification Hook
  const { state: gameState, recordCheckIn, getLeaderboard, allBadges } = useGamification()

  // Map Engine Toggle: '3d-webgl' (Three.js) or '2d-svg' (SVG floorplan)
  const [mapEngine, setMapEngine] = useState<'3d-webgl' | '2d-svg'>('3d-webgl')

  const [selectedPOI, setSelectedPOI] = useState<POIItem | null>(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isGamificationOpen, setIsGamificationOpen] = useState(false)
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false)
  const [isPlacardModalOpen, setIsPlacardModalOpen] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [isConciergeOpen, setIsConciergeOpen] = useState(false)
  const [isAROpen, setIsAROpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [targetName, setTargetName] = useState<string>('')
  const [arrivalNotification, setArrivalNotification] = useState<string | null>(null)

  // Current position
  const [currentLocationNodeId, setCurrentLocationNodeId] = useState<string>(
    venueConfig.defaultStartNodeId
  )

  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem('moonshot-onboarded') === '1'
  )

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K for Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsPickerOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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

  const startNavigationTo = useCallback((nodeId: string, name: string) => {
    const route = findRoute(currentLocationNodeId, nodeId)
    if (route) {
      setActiveRoute(route)
      setCurrentStepIndex(0)
      setTargetName(name)
      setSelectedPOI(null)
    } else {
      alert(`No direct path found to ${name}.`)
    }
  }, [currentLocationNodeId])

  const handlePOISelect = useCallback((poi: POIItem) => {
    startNavigationTo(poi.nodeId, poi.name)
  }, [startNavigationTo])

  const handleZoneSelect = useCallback((zoneId: string) => {
    const zonePOI = venueConfig.pois.find((p) => p.zoneId === zoneId)
    if (zonePOI) {
      setSelectedPOI(zonePOI)
    }
  }, [venueConfig.pois])

  const handleCheckIn = (nodeId: string, name: string, type: 'zone' | 'booth') => {
    setCurrentLocationNodeId(nodeId)
    recordCheckIn(nodeId, name, type)
    setSelectedPOI(null)
    setArrivalNotification(`Check-in confirmed at ${name}. +50 XP recorded.`)
    setTimeout(() => setArrivalNotification(null), 3500)
  }

  const handleStepAdvance = (nextIndex: number) => {
    setCurrentStepIndex(nextIndex)
    if (activeRoute && nextIndex < activeRoute.pathNodes.length) {
      const currentNode = activeRoute.pathNodes[nextIndex]
      if (currentNode) {
        setCurrentLocationNodeId(currentNode.id)
      }
    }
  }

  const handleArrival = () => {
    if (targetName) {
      const isBooth = targetName.toLowerCase().includes('booth') || targetName.toLowerCase().includes('stand')
      handleCheckIn(currentLocationNodeId, targetName, isBooth ? 'booth' : 'zone')
      setArrivalNotification(`Destination reached: ${targetName}`)
      setTimeout(() => setArrivalNotification(null), 3500)
    }
    clearRoute()
    setIsAROpen(false)
  }

  const clearRoute = () => {
    setActiveRoute(null)
    setTargetName('')
    setCurrentStepIndex(0)
  }

  const currentNode = venueConfig.graph.nodes[currentLocationNodeId] || {
    x: 320,
    y: 500,
    name: 'South Lobby'
  }

  const targetNode = activeRoute && activeRoute.pathNodes.length > 0
    ? activeRoute.pathNodes[activeRoute.pathNodes.length - 1]
    : { x: 320, y: 290 }

  return (
    <div className="app-root-shell">
      {/* ── Top Bar ────────────────────────────────────────────── */}
      <header className="top-nav-bar">
        <div className="nav-row-primary">
          <div className="nav-brand-section">
            <div className="brand-logo-mark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v18M3 12h18" strokeDasharray="2 3" opacity="0.6" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </div>
            <div className="brand-text-col">
              <div className="brand-title-row">
                <span className="brand-primary">{venueConfig.name}</span>
                <span className="brand-version-tag">2026</span>
              </div>
              <span className="brand-venue-sub">{venueConfig.locationName}</span>
            </div>
          </div>

          <div className="nav-search-section">
            <button
              className="global-search-bar"
              onClick={() => setIsPickerOpen(true)}
              aria-label="Search destination"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <span className="search-placeholder-text">Search stages, booths, speakers...</span>
              <kbd className="search-shortcut-badge">⌘K</kbd>
            </button>
          </div>
        </div>

        <div className="nav-actions-section">
          <div className="segmented-engine-control">
            <button
              className={`segment-btn ${mapEngine === '2d-svg' ? 'active' : ''}`}
              onClick={() => setMapEngine('2d-svg')}
            >
              2D
            </button>
            <button
              className={`segment-btn ${mapEngine === '3d-webgl' ? 'active' : ''}`}
              onClick={() => setMapEngine('3d-webgl')}
            >
              3D
            </button>
          </div>

          <button
            className="nav-icon-action-btn"
            onClick={() => setIsConciergeOpen(true)}
            title="Ask AI Assistant"
            aria-label="Ask AI Assistant"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
            </svg>
            <span className="btn-label-desktop">Ask AI</span>
          </button>

          <button
            className="nav-icon-action-btn"
            onClick={() => setIsScheduleOpen(true)}
            title="Conference Schedule"
            aria-label="Conference Schedule"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span className="btn-label-desktop">Agenda</span>
          </button>

          <button
            className="nav-icon-action-btn"
            onClick={() => setIsQRScannerOpen(true)}
            title="Scan Venue QR Check-in"
            aria-label="Scan Venue QR Check-in"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
              <rect x="7" y="7" width="10" height="10" rx="1" />
            </svg>
            <span className="btn-label-desktop">Check In</span>
          </button>
        </div>
      </header>

      {/* Main Map Stage */}
      <main className="map-wrap">
        <CategoryFilterBar
          config={venueConfig}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          onSelectPOI={handlePOISelect}
        />

        {arrivalNotification && (
          <div className="arrival-toast-banner">
            <span className="toast-dot" />
            <span>{arrivalNotification}</span>
          </div>
        )}

        {mapEngine === '3d-webgl' ? (
          <ThreeDMapView
            config={venueConfig}
            onSelectPOI={setSelectedPOI}
            onSelectZone={handleZoneSelect}
            activeRoute={activeRoute}
            currentLocation={{ x: currentNode.x, y: currentNode.y, name: currentNode.name }}
          />
        ) : (
          <MapView
            config={venueConfig}
            onSelectPOI={setSelectedPOI}
            onSelectZone={handleZoneSelect}
            activeRoute={activeRoute}
            currentLocation={{ x: currentNode.x, y: currentNode.y, name: currentNode.name }}
          />
        )}
      </main>

      {/* Selected POI Details Bottom Sheet */}
      {selectedPOI && !activeRoute && (
        <div className="sheet">
          <div className="sheet-header-row">
            <div>
              <span className="sheet-category-tag">{selectedPOI.category.toUpperCase()}</span>
              <h2>{selectedPOI.name}</h2>
            </div>
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
              Navigate Route
            </button>
            <button
              className="btn secondary"
              onClick={() =>
                handleCheckIn(
                  selectedPOI.nodeId,
                  selectedPOI.name,
                  selectedPOI.category === 'sponsor' ? 'booth' : 'zone'
                )
              }
            >
              Record Check-In (+50 XP)
            </button>
          </div>
        </div>
      )}

      {/* Realtime Active Directions Dock */}
      {activeRoute && (
        <DirectionsCard
          route={activeRoute}
          destinationName={targetName}
          currentStepIndex={currentStepIndex}
          onStepAdvance={handleStepAdvance}
          onClear={clearRoute}
          onLaunchAR={() => setIsAROpen(true)}
          onCompleteArrival={handleArrival}
        />
      )}

      {/* AR Laser Rangefinder Modal */}
      {isAROpen && (
        <ARLauncherModal
          targetName={targetName}
          targetCoords={{ x: targetNode.x, y: targetNode.y }}
          currentCoords={{ x: currentNode.x, y: currentNode.y }}
          onClose={() => setIsAROpen(false)}
        />
      )}

      {/* Conference Schedule Modal */}
      {isScheduleOpen && (
        <ScheduleModal
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          onNavigateToStage={(nodeId, name) => startNavigationTo(nodeId, name)}
        />
      )}

      {/* AI Concierge Modal */}
      {isConciergeOpen && (
        <AIConciergeModal
          isOpen={isConciergeOpen}
          config={venueConfig}
          onClose={() => setIsConciergeOpen(false)}
          onNavigate={startNavigationTo}
        />
      )}

      {/* QR Scanner Modal */}
      {isQRScannerOpen && (
        <QRScannerModal
          isOpen={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          onScanSuccess={(nodeId, name) => handleCheckIn(nodeId, name, 'zone')}
        />
      )}

      {/* Gamification Modal */}
      {isGamificationOpen && (
        <GamificationModal
          isOpen={isGamificationOpen}
          onClose={() => setIsGamificationOpen(false)}
          state={gameState}
          leaderboard={getLeaderboard()}
          allBadges={allBadges}
        />
      )}

      {/* QR Placard Generator */}
      {isPlacardModalOpen && (
        <VenueQRPlacardModal
          isOpen={isPlacardModalOpen}
          config={venueConfig}
          onClose={() => setIsPlacardModalOpen(false)}
        />
      )}

      {/* Destination Picker Sheet */}
      <DestinationPicker
        isOpen={isPickerOpen}
        config={venueConfig}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handlePOISelect}
      />

      {!onboarded && <OnboardingOverlay onClose={dismissOnboarding} />}
    </div>
  )
}