// Types for Gamification, Quests, Badges, and State Sync

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: 'exploration' | 'sponsor' | 'milestone'
  unlockedAt?: string
}

export interface Quest {
  id: string
  name: string
  description: string
  category: 'zone_visit' | 'sponsor_visit' | 'speed_run'
  targetCount: number
  currentCount: number
  xpReward: number
  badgeRewardId?: string
  completed: boolean
  targetIds: string[] // List of zone or booth IDs required
  visitedIds: string[]
}

export interface UserGamificationState {
  userId: string
  handle: string
  xp: number
  level: number
  visitedZones: string[]
  visitedBooths: string[]
  unlockedBadgeIds: string[]
  quests: Quest[]
  rank: number
}

export interface LeaderboardEntry {
  userId: string
  handle: string
  xp: number
  badgesCount: number
  rank: number
  isCurrentUser?: boolean
}

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Check in to your first zone at National Theatre Lagos.',
    icon: '🚀',
    category: 'exploration'
  },
  {
    id: 'sponsor_scout',
    name: 'Sponsor Scout',
    description: 'Visit at least 3 headline sponsor booths in the Atrium.',
    icon: '⭐',
    category: 'sponsor'
  },
  {
    id: 'master_explorer',
    name: 'Master Explorer',
    description: 'Check in to all 5 event zones.',
    icon: '👑',
    category: 'milestone'
  },
  {
    id: 'deal_maker',
    name: 'Deal Maker',
    description: 'Visit Startup Festival & Pitch Arena.',
    icon: '💼',
    category: 'exploration'
  }
]

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'quest_explore_all',
    name: 'Moonshot Grand Tour',
    description: 'Check in to 4 major zones across the venue.',
    category: 'zone_visit',
    targetCount: 4,
    currentCount: 0,
    xpReward: 200,
    badgeRewardId: 'master_explorer',
    completed: false,
    targetIds: ['main-bowl', 'hall-xyz', 'startup-festival', 'studios'],
    visitedIds: []
  },
  {
    id: 'quest_sponsor_loop',
    name: 'Atrium Sponsor Hunt',
    description: 'Scan QR codes at 3 sponsor booths (Grey, Sabi, Accrue, Breet, Sentz).',
    category: 'sponsor_visit',
    targetCount: 3,
    currentCount: 0,
    xpReward: 150,
    badgeRewardId: 'sponsor_scout',
    completed: false,
    targetIds: ['booth-grey', 'booth-sabi', 'booth-accrue', 'booth-breet', 'booth-sentz'],
    visitedIds: []
  }
]
