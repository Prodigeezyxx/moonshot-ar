import { useState } from 'react'
import MapView, { type SelectInfo } from './components/MapView'
import OnboardingOverlay from './components/OnboardingOverlay'
import DestinationPicker, { type Destination } from './components/DestinationPicker'
import DirectionsCard from './components/DirectionsCard'
import { findRoute, type RouteResult } from './utils/pathfinding'
import { NODES } from './data/graph'

export default function App() {
  const [selected, setSelected] = useState<SelectInfo | null>(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null)
  const [targetName, setTargetName] = useState<string>('')

  // Current user location state (default to Main Entrance / South Lobby)
  const [currentLocationNodeId, setCurrentLocationNodeId] = useState<string>('lobby-south')
  
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
      setSelected(null)
    } else {
      alert(`No direct path found to ${name}.`)
    }
  }

  const handleDestinationSelect = (dest: Destination) => {
    startNavigationTo(dest.nodeId, dest.name)
  }

  const clearRoute = () => {
    setActiveRoute(null)
    setTargetName('')
  }

  const currentNode = NODES[currentLocationNodeId] || { x: 320, y: 500, name: 'South Lobby' }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          MOONSHOT
          <small>Wayfinder 2026 · National Theatre Lagos</small>
        </div>
        <button
          className="search-trigger-btn"
          onClick={() => setIsPickerOpen(true)}
          aria-label="Search destination"
        >
          🔍 Find Place
        </button>
      </header>

      <main className="map-wrap">
        <MapView
          onSelect={setSelected}
          activeRoute={activeRoute}
          currentLocation={{ x: currentNode.x, y: currentNode.y, name: currentNode.name }}
        />

        {/* Selected Zone/Booth Bottom Sheet */}
        {selected && !activeRoute && (
          <div className="sheet">
            <div className="sheet-header-row">
              <h2>{selected.title}</h2>
              <button
                className="sheet-close-btn"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p>{selected.description}</p>
            <div className="row">
              <button
                className="btn primary"
                onClick={() => startNavigationTo(selected.nodeId, selected.title)}
              >
                GET DIRECTIONS
              </button>
              <button
                className="btn"
                onClick={() => {
                  // Simulate QR check-in: update "You are here"
                  setCurrentLocationNodeId(selected.nodeId)
                  alert(`Checked in to ${selected.title}! Position updated. (+25 XP)`)
                  setSelected(null)
                }}
              >
                CHECK IN
              </button>
            </div>
          </div>
        )}

        {/* Turn-by-Turn Directions Card Overlay */}
        {activeRoute && (
          <DirectionsCard
            route={activeRoute}
            destinationName={targetName}
            onClear={clearRoute}
          />
        )}
      </main>

      <nav className="hud">
        <div className="hud-pill">
          XP <span className="num">25</span>
        </div>
        <div className="hud-pill">
          Badges <span className="num">1</span>
        </div>
        <div className="hud-spacer" />
        <div
          className="hud-pill accent"
          onClick={() => alert('Leaderboard & Quests arrive in Phase 3!')}
        >
          🏆 LEADERBOARD
        </div>
      </nav>

      <DestinationPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleDestinationSelect}
      />

      {!onboarded && <OnboardingOverlay onClose={dismissOnboarding} />}
    </div>
  )
}
