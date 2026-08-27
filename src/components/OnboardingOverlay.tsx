import { useState } from 'react'

interface OnboardingOverlayProps {
  onClose: () => void
}

export default function OnboardingOverlay({ onClose }: OnboardingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      badge: 'NAVIGATION ENGINE',
      title: 'Precision Indoor Spatial Routing',
      description:
        'A* pathfinding mapped to National Theatre Lagos floorplan. Turn-by-turn vectors, corridor distance estimates, and walk simulation.',
      spec: 'Sub-meter graph accuracy • 22 venue anchors'
    },
    {
      badge: 'AUGMENTED REALITY',
      title: 'Spatial AR & Device Telemetry',
      description:
        'Hardware camera view synchronized with compass heading and geometric bearing calculation. Follow holographic directional indicators.',
      spec: 'Niantic Studio VPS compatible • Gyroscope tracking'
    },
    {
      badge: 'VENUE TELEMETRY',
      title: 'Gamified Check-Ins & Leaderboard',
      description:
        'Verify physical checkpoint arrivals at stages and sponsor hubs (Grey, Sabi, Accrue, Breet, Sentz) with edge-synced XP progression.',
      spec: 'Offline-first SQLite/D1 edge architecture'
    },
    {
      badge: 'AI ASSISTANT & AGENDA',
      title: 'Real-Time Conference Concierge',
      description:
        'Query speaker schedules, track topics, and physical booths. Direct one-tap routing from session metadata to venue coordinates.',
      spec: 'Full 2-day dual-track agenda integration'
    }
  ]

  const step = steps[currentStep]
  const isLast = currentStep === steps.length - 1

  const handleNext = () => {
    if (isLast) {
      onClose()
    } else {
      setCurrentStep((s) => s + 1)
    }
  }

  return (
    <div className="onboarding-overlay-backdrop" onClick={onClose}>
      <div className="onboarding-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Top Bar Identity */}
        <div className="onboarding-header-row">
          <div className="onboarding-brand-group">
            <span className="onboarding-brand-title">
              MOONSHOT <span className="brand-badge-pill">WAYFINDER</span>
            </span>
            <span className="onboarding-venue-sub">National Theatre Lagos • Oct 2026</span>
          </div>
          <button className="onboarding-skip-btn" onClick={onClose}>
            Skip
          </button>
        </div>

        {/* Hero Card Presentation */}
        <div className="onboarding-hero-stage">
          <div className="onboarding-step-badge">{step.badge}</div>
          <h2 className="onboarding-step-title">{step.title}</h2>
          <p className="onboarding-step-desc">{step.description}</p>
          <div className="onboarding-spec-box">
            <span className="spec-label">SYSTEM CAPABILITY:</span>
            <span className="spec-val">{step.spec}</span>
          </div>
        </div>

        {/* Stepper Controls */}
        <div className="onboarding-footer-controls">
          <div className="onboarding-dots-tray">
            {steps.map((_, idx) => (
              <button
                key={idx}
                className={`onboarding-dot ${idx === currentStep ? 'active' : ''}`}
                onClick={() => setCurrentStep(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="onboarding-btn-row">
            {currentStep > 0 && (
              <button
                className="btn-onboarding-secondary"
                onClick={() => setCurrentStep((s) => s - 1)}
              >
                Back
              </button>
            )}
            <button className="btn-onboarding-primary" onClick={handleNext}>
              {isLast ? 'Launch Wayfinder' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
