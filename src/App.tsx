import { useState } from 'react'
import MapView, { type SelectInfo } from './components/MapView'
import OnboardingOverlay from './components/OnboardingOverlay'

export default function App() {
  const [selected, setSelected] = useState<SelectInfo | null>(null)
  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem('moonshot-onboarded') === '1'
  )

  const dismissOnboarding = () => {
    localStorage.setItem('moonshot-onboarded', '1')
    setOnboarded(true)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          MOONSHOT
          <small>Wayfinder 2026 · National Theatre Lagos</small>
        </div>
        <span className="tag">PWA</span>
      </header>

      <main className="map-wrap">
        <MapView onSelect={setSelected} />
        {selected && (
          <div className="sheet">
            <h2>{selected.title}</h2>
            <p>{selected.description}</p>
            <p className="hint">
              Routing (Phase 2) and check-in (Phase 4) are next — this is the
              map shell.
            </p>
            <div className="row">
              <button className="btn primary" onClick={() => setSelected(null)}>
                GET DIRECTIONS
              </button>
              <button className="btn" onClick={() => setSelected(null)}>
                CHECK IN
              </button>
            </div>
          </div>
        )}
      </main>

      <nav className="hud">
        <div className="hud-pill">
          XP <span className="num">0</span>
        </div>
        <div className="hud-pill">
          Badges <span className="num">0</span>
        </div>
        <div className="hud-spacer" />
        <div className="hud-pill accent">LEADERBOARD</div>
      </nav>

      {!onboarded && <OnboardingOverlay onClose={dismissOnboarding} />}
    </div>
  )
}
