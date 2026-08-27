import { useState } from 'react'
import {
  type UserGamificationState,
  type LeaderboardEntry,
  type Badge
} from '../types/gamification'

export default function GamificationModal({
  isOpen,
  onClose,
  state,
  leaderboard,
  allBadges
}: {
  isOpen: boolean
  onClose: () => void
  state: UserGamificationState
  leaderboard: LeaderboardEntry[]
  allBadges: Badge[]
}) {
  const [tab, setTab] = useState<'leaderboard' | 'quests' | 'passport'>('leaderboard')

  if (!isOpen) return null

  return (
    <div className="gamification-modal-backdrop" onClick={onClose}>
      <div className="gamification-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header Summary */}
        <div className="game-sheet-header">
          <div className="game-user-profile-summary">
            <div className="game-avatar-badge">ID</div>
            <div className="game-user-info">
              <div className="game-handle">{state.handle}</div>
              <div className="game-stats-row">
                <span className="stat-pill">Level {state.level}</span>
                <span className="stat-pill xp">{state.xp} XP</span>
                <span className="stat-pill rank">Rank #{state.rank}</span>
              </div>
            </div>
          </div>
          <button className="game-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="game-tab-bar">
          <button
            className={`game-tab-btn ${tab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setTab('leaderboard')}
          >
            Leaderboard
          </button>
          <button
            className={`game-tab-btn ${tab === 'quests' ? 'active' : ''}`}
            onClick={() => setTab('quests')}
          >
            Quests ({state.quests.filter((q) => !q.completed).length})
          </button>
          <button
            className={`game-tab-btn ${tab === 'passport' ? 'active' : ''}`}
            onClick={() => setTab('passport')}
          >
            Passport ({state.unlockedBadgeIds.length})
          </button>
        </div>

        {/* Tab 1: Leaderboard */}
        {tab === 'leaderboard' && (
          <div className="leaderboard-list">
            <div className="leaderboard-intro">
              Verified Event Standings • Live Cloudflare Edge Synchronized
            </div>
            {leaderboard.map((item) => (
              <div
                key={item.userId}
                className={`leaderboard-row ${item.isCurrentUser ? 'current-user-highlight' : ''}`}
              >
                <div className="rank-num-badge">
                  #{item.rank}
                </div>
                <div className="lead-user-info">
                  <div className="lead-handle">
                    {item.handle} {item.isCurrentUser && <span className="you-tag">(YOU)</span>}
                  </div>
                  <div className="lead-badges">{item.badgesCount} Badges Verified</div>
                </div>
                <div className="lead-xp">{item.xp} XP</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Active Quests */}
        {tab === 'quests' && (
          <div className="quests-container">
            {state.quests.map((q) => (
              <div key={q.id} className={`quest-card ${q.completed ? 'completed' : ''}`}>
                <div className="quest-header">
                  <span className="quest-badge-tag">{q.completed ? 'COMPLETED' : 'IN PROGRESS'}</span>
                  <span className="quest-reward-xp">+{q.xpReward} XP</span>
                </div>
                <div className="quest-name">{q.name}</div>
                <div className="quest-desc">{q.description}</div>
                <div className="quest-progress-track">
                  <div
                    className="quest-progress-fill"
                    style={{ width: `${Math.min(100, (q.currentCount / q.targetCount) * 100)}%` }}
                  />
                </div>
                <div className="quest-progress-label">
                  Verification: {q.currentCount} / {q.targetCount} targets reached
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Digital Passport */}
        {tab === 'passport' && (
          <div className="passport-container">
            <div className="passport-card-hero">
              <div className="pass-title">ATTENDEE CREDENTIAL PASSPORT</div>
              <div className="pass-sub">Digital Physical Verification Record</div>
              <div className="pass-stats-grid">
                <div className="pass-stat-box">
                  <div className="stat-num">{state.visitedZones.length} / 5</div>
                  <div className="stat-lbl">Zones Verified</div>
                </div>
                <div className="pass-stat-box">
                  <div className="stat-num">{state.visitedBooths.length} / 5</div>
                  <div className="stat-lbl">Booths Visited</div>
                </div>
                <div className="pass-stat-box">
                  <div className="stat-num">{state.unlockedBadgeIds.length} / 4</div>
                  <div className="stat-lbl">Badges Issued</div>
                </div>
              </div>
            </div>

            <div className="badges-section-title">ACHIEVEMENT BADGES</div>
            <div className="badges-grid">
              {allBadges.map((b) => {
                const isUnlocked = state.unlockedBadgeIds.includes(b.id)
                return (
                  <div key={b.id} className={`badge-item ${isUnlocked ? 'unlocked' : 'locked'}`}>
                    <div className="badge-status-icon">{isUnlocked ? '✓' : '—'}</div>
                    <div className="badge-content-col">
                      <div className="badge-name">{b.name}</div>
                      <div className="badge-desc">{b.description}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
