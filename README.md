# Moonshot Wayfinder 2026

A mobile-first, installable PWA for indoor wayfinding at the National Theatre
Lagos — Moonshot 2026. Map + AR-preview navigation, VPS positioning (once the
venue is scanned) with a QR check-in fallback, and a gamification layer
(XP, quests, badges, realtime leaderboard) built on a single shared data
source.

Status: **planning complete, not yet built.** See `ARCHITECTURE.md` and
`ROADMAP.md` for the full spec and phased build plan. This README will grow a
"Getting started" section once Phase 1 scaffolding exists.

## Docs

- `ARCHITECTURE.md` — System Design & Engineering Specification: platform
  correction (8th Wall → Niantic Studio), design principles, chosen PWA stack
  and rationale, positioning/data/routing/backend/frontend design, venue
  geometry, VPS suitability, scan plan, QR fallback, cost model.
- `ROADMAP.md` — phased build plan (Phase 0–7) with decision gates and
  "done when" criteria for each phase.

## Design principles (see ARCHITECTURE.md §0a)

1. **One shared data source** — all session state (position, check-ins, XP,
   quests, badges) lives in one realtime Supabase store; every screen updates
   instantly, everywhere.
2. **Gamification drives engagement** — XP, quests, badges, and a realtime
   leaderboard incentivize exploring the whole venue, not just the nearest booth.
3. **Honesty over polish** — position is either live (VPS) or a timestamped
   last-known fix (QR), never faked; AR is clearly labeled a preview until a
   real venue scan exists.

## Chosen stack (see ARCHITECTURE.md §1)

Vite + React + TypeScript, `vite-plugin-pwa` (installable PWA/service worker),
react-router-dom, hand-authored SVG floorplan, hand-rolled A* routing,
Supabase (realtime state/backend), Cloudflare Pages/Vercel (hosting).
AR today is a scripted camera-preview mock; Niantic Studio VPS lands once a
real Scaniverse scan of the venue exists.

## Platform note

8th Wall is winding down (Niantic → Niantic Spatial spin-off after the
Scopely sale); hosted 8th Wall projects stay live through Feb 2027. This
project targets **Niantic Studio** for any real VPS work, not 8th Wall.

## Cost snapshot (see ARCHITECTURE.md §11)

| Stage | Cost |
|-------|------|
| Build + demo today | Free (all inside free tiers) |
| Scan the real venue | ~$25–50 one-time |
| Live public branded event | ~$700/mo commercial licence |

## Status / next step

Roadmap Phase 0 (planning) is done. Phase 1 (PWA scaffold + Map mode) starts
on approval — see `ROADMAP.md` for the full phase breakdown and decision gates.

## Repo layout

```
moonshot-ar/
├── ARCHITECTURE.md   # full system design & engineering spec
├── ROADMAP.md        # phased build plan
└── README.md         # this file
```
