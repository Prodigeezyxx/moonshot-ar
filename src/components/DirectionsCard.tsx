import { useState, useEffect, useCallback } from 'react'
import { type RouteResult } from '../utils/pathfinding'

interface DirectionsCardProps {
  route: RouteResult
  destinationName: string
  currentStepIndex?: number
  onStepAdvance?: (nextIndex: number) => void
  onClear: () => void
  onLaunchAR: () => void
  onCompleteArrival?: () => void
}

export default function DirectionsCard({
  route,
  destinationName,
  currentStepIndex = 0,
  onStepAdvance,
  onClear,
  onLaunchAR,
  onCompleteArrival
}: DirectionsCardProps) {
  const [activeStepIdx, setActiveStepIdx] = useState(currentStepIndex)
  const [isSimulating, setIsSimulating] = useState(false)

  useEffect(() => {
    setActiveStepIdx(currentStepIndex)
  }, [currentStepIndex])

  const totalSteps = route.steps.length
  const currentStep = totalSteps > 0 && activeStepIdx < totalSteps ? route.steps[activeStepIdx] : null
  const isLastStep = activeStepIdx >= totalSteps - 1

  const remainingDistance = route.steps
    .slice(activeStepIdx)
    .reduce((acc, s) => acc + s.distanceMeters, 0)

  const remainingMinutes = Math.max(1, Math.round(remainingDistance / 75))

  const handleNextStep = useCallback(() => {
    if (activeStepIdx < totalSteps - 1) {
      const nextIdx = activeStepIdx + 1
      setActiveStepIdx(nextIdx)
      onStepAdvance?.(nextIdx)
    } else {
      setIsSimulating(false)
      onCompleteArrival?.()
    }
  }, [activeStepIdx, totalSteps, onStepAdvance, onCompleteArrival])

  const handlePrevStep = useCallback(() => {
    if (activeStepIdx > 0) {
      const prevIdx = activeStepIdx - 1
      setActiveStepIdx(prevIdx)
      onStepAdvance?.(prevIdx)
    }
  }, [activeStepIdx, onStepAdvance])

  useEffect(() => {
    if (!isSimulating) return
    const timer = setInterval(() => {
      handleNextStep()
    }, 2800)
    return () => clearInterval(timer)
  }, [isSimulating, handleNextStep])

  return (
    <div className="active-nav-dock">
      <div className="nav-step-strip">
        <div className="nav-direction-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {isLastStep ? (
              <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </div>

        <div className="nav-step-text">
          <div className="nav-step-headline">
            {currentStep ? currentStep.instruction : `Arrived at ${destinationName}`}
          </div>
          <div className="nav-step-sub">
            {currentStep
              ? `Leg ${activeStepIdx + 1} / ${totalSteps} · ${currentStep.distanceMeters} m`
              : 'Destination reached'}
          </div>
        </div>

        <div className="nav-step-steppers">
          <button
            className="step-btn prev"
            onClick={handlePrevStep}
            disabled={activeStepIdx === 0}
            title="Previous step"
          >
            ‹
          </button>
          <button
            className="step-btn next"
            onClick={handleNextStep}
            title={isLastStep ? 'Confirm arrival' : 'Next step'}
          >
            {isLastStep ? '✓' : '›'}
          </button>
        </div>
      </div>

      <div className="nav-metrics-row">
        <div className="nav-dest-info">
          <div className="nav-dest-name">{destinationName}</div>
          <div className="nav-badges">
            <span className="badge eta">{remainingMinutes} min</span>
            <span className="badge distance">{remainingDistance} m</span>
            <button
              className={`badge-sim-walk ${isSimulating ? 'active' : ''}`}
              onClick={() => setIsSimulating(!isSimulating)}
            >
              {isSimulating ? 'Pause replay' : 'Replay walk'}
            </button>
          </div>
        </div>

        <button className="nav-cancel-btn" onClick={onClear} aria-label="Exit navigation">
          End
        </button>
      </div>

      <div className="nav-action-bar">
        <button className="btn-ar-walk" onClick={onLaunchAR}>
          Open AR overlay
        </button>
      </div>
    </div>
  )
}
