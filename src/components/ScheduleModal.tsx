import { useState, useMemo } from 'react'
import { MOONSHOT_SESSIONS, type ConferenceSession } from '../data/sessions'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigateToStage: (stageNodeId: string, stageName: string) => void
}

export default function ScheduleModal({
  isOpen,
  onClose,
  onNavigateToStage
}: ScheduleModalProps) {
  const [selectedDay, setSelectedDay] = useState<1 | 2>(1)
  const [selectedTrack, setSelectedTrack] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null)

  const tracks = useMemo(() => [
    'all',
    'Keynote & AI',
    'Fintech & Scale',
    'Founder & Venture',
    'Technical Workshop',
    'Policy & Ecosystem'
  ], [])

  const filteredSessions = useMemo(() => {
    return MOONSHOT_SESSIONS.filter((ses) => {
      if (ses.day !== selectedDay) return false
      if (selectedTrack !== 'all' && ses.track !== selectedTrack) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const titleMatch = ses.title.toLowerCase().includes(q)
        const speakerMatch = ses.speakers.some((s) =>
          s.name.toLowerCase().includes(q) || s.company.toLowerCase().includes(q)
        )
        const descMatch = ses.description.toLowerCase().includes(q)
        return titleMatch || speakerMatch || descMatch
      }
      return true
    })
  }, [selectedDay, selectedTrack, searchQuery])

  if (!isOpen) return null

  return (
    <div className="schedule-modal-overlay" onClick={onClose}>
      <div className="schedule-modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="schedule-header">
          <div className="schedule-header-titles">
            <h2>CONFERENCE AGENDA</h2>
            <p>Session Schedules, Keynotes &amp; Technical Masterclasses</p>
          </div>
          <button className="schedule-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        {/* Day Selector Tabs */}
        <div className="schedule-day-tabs">
          <button
            className={`day-tab-btn ${selectedDay === 1 ? 'active' : ''}`}
            onClick={() => setSelectedDay(1)}
          >
            <span className="day-num">DAY 01</span>
            <span className="day-sub">AI Infrastructure &amp; Fintech</span>
          </button>
          <button
            className={`day-tab-btn ${selectedDay === 2 ? 'active' : ''}`}
            onClick={() => setSelectedDay(2)}
          >
            <span className="day-num">DAY 02</span>
            <span className="day-sub">Scale, Policy &amp; VC Finale</span>
          </button>
        </div>

        {/* Search & Track Filter */}
        <div className="schedule-controls">
          <div className="schedule-search-input-wrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.6">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search speaker, topic, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="schedule-search-input"
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="track-filter-scroll">
            {tracks.map((t) => (
              <button
                key={t}
                className={`track-filter-chip ${selectedTrack === t ? 'active' : ''}`}
                onClick={() => setSelectedTrack(t)}
              >
                {t === 'all' ? 'All Tracks' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Session Cards Feed */}
        <div className="schedule-session-list">
          {filteredSessions.length === 0 ? (
            <div className="schedule-empty-state">
              <p>No sessions match the selected filters.</p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isExpanded = expandedSessionId === session.id

              return (
                <div
                  key={session.id}
                  className={`session-card ${session.isFeatured ? 'featured' : ''}`}
                  onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                >
                  <div className="session-card-header">
                    <div className="session-time-badge">
                      <span className="time-range">{session.startTime} - {session.endTime}</span>
                      <span className="track-tag">{session.track}</span>
                    </div>
                    {session.isFeatured && (
                      <span className="featured-badge">FEATURED</span>
                    )}
                  </div>

                  <h3 className="session-title">{session.title}</h3>

                  {/* Speaker Info */}
                  <div className="session-speakers-row">
                    {session.speakers.map((spk) => (
                      <div key={spk.id} className="speaker-pill">
                        <span className="speaker-bullet">•</span>
                        <div className="speaker-info-col">
                          <span className="speaker-name">{spk.name}</span>
                          <span className="speaker-role-comp">{spk.role}, {spk.company}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Expandable Details */}
                  {isExpanded && (
                    <div className="session-expanded-body">
                      <p className="session-full-desc">{session.description}</p>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="session-card-footer" onClick={(e) => e.stopPropagation()}>
                    <div className="session-location-tag">
                      <span className="loc-label">LOCATION:</span>
                      <span className="loc-name">{session.stageName}</span>
                    </div>

                    <button
                      className="session-nav-cta-btn"
                      onClick={() => {
                        onNavigateToStage(session.stageNodeId, session.stageName)
                        onClose()
                      }}
                    >
                      Route to Stage →
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
