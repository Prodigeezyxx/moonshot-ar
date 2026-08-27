/// <reference types="@cloudflare/workers-types" />

export interface Env {
  ASSETS: Fetcher
  DB: D1Database
}

interface SyncPayload {
  userId: string
  handle: string
  xp: number
  level: number
  unlockedBadgeIds: string[]
  visitedZones: string[]
  visitedBooths: string[]
}

interface CheckInPayload {
  userId: string
  handle: string
  targetId: string
  targetName: string
  targetType: 'zone' | 'booth'
  xpGained: number
  unlockedBadgeIds?: string[]
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}

// In-memory fallback if D1 is not bound (e.g. standard local preview)
const memLeaderboard = new Map<string, { id: string; handle: string; xp: number; level: number; badgesCount: number }>()

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }

    // API Routes
    if (url.pathname.startsWith('/api/')) {
      try {
        // GET /api/leaderboard
        if (url.pathname === '/api/leaderboard' && request.method === 'GET') {
          if (env.DB) {
            const results = await env.DB.prepare(`
              SELECT u.id, u.handle, u.xp, u.level,
                     (SELECT COUNT(*) FROM user_badges b WHERE b.user_id = u.id) as badgesCount
              FROM users u
              ORDER BY u.xp DESC
              LIMIT 50
            `).all()

            const leaderboard = (results.results || []).map((row: any, idx: number) => ({
              rank: idx + 1,
              userId: row.id,
              handle: row.handle,
              xp: Number(row.xp),
              level: Number(row.level),
              badgesCount: Number(row.badgesCount || 0)
            }))

            return jsonResponse({ leaderboard })
          } else {
            // Memory fallback
            const sorted = Array.from(memLeaderboard.values())
              .sort((a, b) => b.xp - a.xp)
              .slice(0, 50)
              .map((u, idx) => ({ ...u, rank: idx + 1, userId: u.id }))
            return jsonResponse({ leaderboard: sorted })
          }
        }

        // POST /api/sync-user
        if (url.pathname === '/api/sync-user' && request.method === 'POST') {
          const body = (await request.json()) as SyncPayload
          if (!body.userId || !body.handle) {
            return jsonResponse({ error: 'Missing userId or handle' }, 400)
          }

          if (env.DB) {
            await env.DB.prepare(`
              INSERT INTO users (id, handle, xp, level, updated_at)
              VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)
              ON CONFLICT(id) DO UPDATE SET
                handle = excluded.handle,
                xp = MAX(users.xp, excluded.xp),
                level = MAX(users.level, excluded.level),
                updated_at = CURRENT_TIMESTAMP
            `).bind(body.userId, body.handle, body.xp || 0, body.level || 1).run()

            // Upsert badges
            if (body.unlockedBadgeIds && body.unlockedBadgeIds.length > 0) {
              for (const badgeId of body.unlockedBadgeIds) {
                await env.DB.prepare(`
                  INSERT OR IGNORE INTO user_badges (user_id, badge_id)
                  VALUES (?1, ?2)
                `).bind(body.userId, badgeId).run()
              }
            }

            // Calculate user rank
            const rankRes = await env.DB.prepare(`
              SELECT COUNT(*) as rankHigher FROM users WHERE xp > (SELECT xp FROM users WHERE id = ?1)
            `).bind(body.userId).first<{ rankHigher: number }>()

            const rank = (rankRes?.rankHigher || 0) + 1
            return jsonResponse({ success: true, rank })
          } else {
            memLeaderboard.set(body.userId, {
              id: body.userId,
              handle: body.handle,
              xp: body.xp,
              level: body.level,
              badgesCount: body.unlockedBadgeIds?.length || 0
            })
            return jsonResponse({ success: true, rank: 1 })
          }
        }

        // POST /api/check-in
        if (url.pathname === '/api/check-in' && request.method === 'POST') {
          const body = (await request.json()) as CheckInPayload
          if (!body.userId || !body.targetId) {
            return jsonResponse({ error: 'Missing userId or targetId' }, 400)
          }

          if (env.DB) {
            // Upsert user
            await env.DB.prepare(`
              INSERT INTO users (id, handle, xp, level, updated_at)
              VALUES (?1, ?2, ?3, 1, CURRENT_TIMESTAMP)
              ON CONFLICT(id) DO UPDATE SET
                xp = users.xp + ?3,
                updated_at = CURRENT_TIMESTAMP
            `).bind(body.userId, body.handle || 'Explorer', body.xpGained || 50).run()

            // Record check-in
            const checkInId = `${body.userId}_${body.targetId}_${Date.now()}`
            await env.DB.prepare(`
              INSERT OR IGNORE INTO check_ins (id, user_id, target_id, target_name, target_type)
              VALUES (?1, ?2, ?3, ?4, ?5)
            `).bind(checkInId, body.userId, body.targetId, body.targetName || '', body.targetType || 'zone').run()

            // Upsert badges if provided
            if (body.unlockedBadgeIds && body.unlockedBadgeIds.length > 0) {
              for (const bId of body.unlockedBadgeIds) {
                await env.DB.prepare(`
                  INSERT OR IGNORE INTO user_badges (user_id, badge_id)
                  VALUES (?1, ?2)
                `).bind(body.userId, bId).run()
              }
            }

            return jsonResponse({ success: true })
          } else {
            const existing = memLeaderboard.get(body.userId) || {
              id: body.userId,
              handle: body.handle || 'Explorer',
              xp: 0,
              level: 1,
              badgesCount: 0
            }
            existing.xp += (body.xpGained || 50)
            memLeaderboard.set(body.userId, existing)
            return jsonResponse({ success: true })
          }
        }

        return jsonResponse({ error: 'Not Found' }, 404)
      } catch (err: any) {
        return jsonResponse({ error: err.message || 'Server error' }, 500)
      }
    }

    // Default: Serve frontend static assets from dist
    return env.ASSETS.fetch(request)
  }
}
