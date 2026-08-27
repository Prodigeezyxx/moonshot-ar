import { useState, useEffect, useCallback } from 'react'
import {
  type UserGamificationState,
  type LeaderboardEntry,
  INITIAL_BADGES,
  INITIAL_QUESTS
} from '../types/gamification'

const STORAGE_KEY = 'moonshot_gamification_state_v1'

function generateUserHandle(): string {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `@explorer_${num}`
}

export function useGamification() {
  const [state, setState] = useState<UserGamificationState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse gamification state from storage', e)
      }
    }
    return {
      userId: `usr_${Math.random().toString(36).substring(2, 9)}`,
      handle: generateUserHandle(),
      xp: 0,
      level: 1,
      visitedZones: [],
      visitedBooths: [],
      unlockedBadgeIds: [],
      quests: INITIAL_QUESTS,
      rank: 42
    }
  })

  const [remoteLeaderboard, setRemoteLeaderboard] = useState<LeaderboardEntry[]>([])

  // Fetch live leaderboard from Cloudflare Worker
  const fetchLiveLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/leaderboard')
      if (res.ok) {
        const data = await res.json()
        if (data && Array.isArray(data.leaderboard)) {
          setRemoteLeaderboard(data.leaderboard)
        }
      }
    } catch (e) {
      // Graceful offline fallback
      console.warn('Could not reach /api/leaderboard, using local sync fallback')
    }
  }, [])

  // Sync state to localStorage & Cloudflare Worker on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

    // Background sync to Worker
    fetch('/api/sync-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: state.userId,
        handle: state.handle,
        xp: state.xp,
        level: state.level,
        unlockedBadgeIds: state.unlockedBadgeIds,
        visitedZones: state.visitedZones,
        visitedBooths: state.visitedBooths
      })
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.rank && data.rank !== state.rank) {
          setState((prev) => ({ ...prev, rank: data.rank }))
        }
      })
      .catch(() => {
        // Silent catch for offline PWA behavior
      })
  }, [state.xp, state.level, state.unlockedBadgeIds.length, state.visitedZones.length, state.visitedBooths.length])

  // Periodic poll for leaderboard updates
  useEffect(() => {
    fetchLiveLeaderboard()
    const interval = setInterval(fetchLiveLeaderboard, 15000)
    return () => clearInterval(interval)
  }, [fetchLiveLeaderboard])

  // Record Check-in & Evaluate Quests + Badges
  const recordCheckIn = useCallback(
    (targetId: string, name: string, type: 'zone' | 'booth') => {
      setState((prev) => {
        const isZone = type === 'zone'
        const alreadyVisited = isZone
          ? prev.visitedZones.includes(targetId)
          : prev.visitedBooths.includes(targetId)

        // Base check-in XP: 50 for first time, 10 for re-visit
        const addedXP = alreadyVisited ? 10 : 50

        const newVisitedZones = isZone && !alreadyVisited
          ? [...prev.visitedZones, targetId]
          : prev.visitedZones
        const newVisitedBooths = !isZone && !alreadyVisited
          ? [...prev.visitedBooths, targetId]
          : prev.visitedBooths

        let bonusXP = 0
        const newUnlockedBadges = [...prev.unlockedBadgeIds]

        // Unlock 'first_step' badge on any first checkin
        if (newUnlockedBadges.length === 0) {
          newUnlockedBadges.push('first_step')
          bonusXP += 50
        }

        // Evaluate Quests
        const updatedQuests = prev.quests.map((q) => {
          if (q.completed) return q

          const isTarget = q.targetIds.includes(targetId)
          if (!isTarget || q.visitedIds.includes(targetId)) return q

          const nextVisited = [...q.visitedIds, targetId]
          const isNowCompleted = nextVisited.length >= q.targetCount

          if (isNowCompleted) {
            bonusXP += q.xpReward
            if (q.badgeRewardId && !newUnlockedBadges.includes(q.badgeRewardId)) {
              newUnlockedBadges.push(q.badgeRewardId)
            }
          }

          return {
            ...q,
            visitedIds: nextVisited,
            currentCount: nextVisited.length,
            completed: isNowCompleted
          }
        })

        // Special check for 'deal_maker' badge (visiting startup-festival)
        if (targetId === 'startup-festival' && !newUnlockedBadges.includes('deal_maker')) {
          newUnlockedBadges.push('deal_maker')
          bonusXP += 50
        }

        const totalXP = prev.xp + addedXP + bonusXP
        const nextLevel = Math.floor(totalXP / 100) + 1
        const nextRank = Math.max(1, Math.min(prev.rank, 42 - Math.floor(totalXP / 40)))

        // Dispatch check-in call to Worker backend
        fetch('/api/check-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: prev.userId,
            handle: prev.handle,
            targetId,
            targetName: name,
            targetType: type,
            xpGained: addedXP + bonusXP,
            unlockedBadgeIds: newUnlockedBadges
          })
        }).catch(() => {})

        return {
          ...prev,
          xp: totalXP,
          level: nextLevel,
          visitedZones: newVisitedZones,
          visitedBooths: newVisitedBooths,
          unlockedBadgeIds: newUnlockedBadges,
          quests: updatedQuests,
          rank: nextRank
        }
      })
    },
    []
  )

  // Combined Leaderboard (Remote if available, local blend fallback)
  const getLeaderboard = useCallback((): LeaderboardEntry[] => {
    if (remoteLeaderboard.length > 0) {
      let foundUser = false
      const formatted = remoteLeaderboard.map((u) => {
        const isCurrent = u.userId === state.userId
        if (isCurrent) foundUser = true
        return {
          ...u,
          isCurrentUser: isCurrent
        }
      })

      if (!foundUser) {
        formatted.push({
          userId: state.userId,
          handle: state.handle,
          xp: state.xp,
          badgesCount: state.unlockedBadgeIds.length,
          rank: state.rank,
          isCurrentUser: true
        })
        formatted.sort((a, b) => b.xp - a.xp)
        return formatted.map((entry, idx) => ({ ...entry, rank: idx + 1 }))
      }
      return formatted
    }

    // Default mock fallback
    const mockUsers: LeaderboardEntry[] = [
      { userId: 'usr_top1', handle: '@adeola_dev', xp: 480, badgesCount: 4, rank: 1 },
      { userId: 'usr_top2', handle: '@chinonso_xr', xp: 410, badgesCount: 3, rank: 2 },
      { userId: 'usr_top3', handle: '@tunde_lagos', xp: 350, badgesCount: 3, rank: 3 },
      { userId: 'usr_top4', handle: '@zainab_tech', xp: 290, badgesCount: 2, rank: 4 },
      { userId: 'usr_top5', handle: '@emeka_vc', xp: 220, badgesCount: 2, rank: 5 }
    ]

    const currentEntry: LeaderboardEntry = {
      userId: state.userId,
      handle: state.handle,
      xp: state.xp,
      badgesCount: state.unlockedBadgeIds.length,
      rank: state.rank,
      isCurrentUser: true
    }

    const all = [...mockUsers.filter((u) => u.userId !== state.userId), currentEntry].sort(
      (a, b) => b.xp - a.xp
    )

    return all.map((entry, idx) => ({
      ...entry,
      rank: idx + 1
    }))
  }, [remoteLeaderboard, state])

  return {
    state,
    recordCheckIn,
    getLeaderboard,
    allBadges: INITIAL_BADGES
  }
}
