# Moonshot Wayfinder 2026

A mobile-first, installable PWA for indoor wayfinding at the National Theatre
Lagos — Moonshot 2026. Map + AR-preview navigation, VPS positioning (once the
venue is scanned) with a QR check-in fallback, and a gamification layer
(XP, quests, badges, realtime leaderboard) built on a single shared data
source.

Status: **Phase 1 built** — Vite + React + TS PWA scaffold, SVG floorplan
(5 zones + 5 sponsor booths), pan/zoom map, onboarding overlay, brand tokens.
See `ARCHITECTURE.md` and `ROADMAP.md` for the full spec and phased plan.

## Getting started

```bash
npm install        # once
npm run dev        # live preview at http://localhost:5173 (hot reload)
```

- `npm run build` — production build (`dist/`, incl. PWA manifest + service worker)
- `npm run preview` — serve the production build locally
- `npm run typecheck` — TypeScript, no emit

The dev server is exposed on the LAN too (`host: true`), so you can open the
`Network:` URL Vite prints on your phone over the same wifi to test the
installable-PWA flow.

## Docs

- `ARCHITECTURE.md` — System Design & Engineering Specification: platform
  correction (8th Wall → Niantic Studio), design principles, chosen PWA stack
  and rationale, positioning (VPS + QR fallback, full Appendix B), data layer
  (venue graph + VPS Sites schema), routing/backend/frontend design, brand
  system, scope reconciliation, venue geometry, VPS suitability, scan plan,
  QR fallback, cost model.
- `ROADMAP.md` — phased build plan (Phase 0–7) with decision gates,
  "done when" criteria per phase, and a merged backlog.
- `docs/raw/` — the source documents verbatim (master spec + moodboard
  transcript), preserved for reconciliation.

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

## Brand system (see ARCHITECTURE.md §6a)

Confirmed from the master spec — Moonshot Purple `#3F0F8A`, Cream `#FAF3E0`,
Action Yellow `#F5A623`, Mint `#9AD5B1`, Deep Teal `#2E9D8F`, Ink `#111827`,
Lavender `#EDE7F9`, Signal Orange `#E85D3F`. Headlines in Archivo Black, body
in Poppins; seigaiha wave motif, 3px ink borders, hard-offset shadows.
Event: "Moonshot 2026 · Courage & Conviction," by TechCabal x Grey (Headline
Sponsor), "powered by realmspace."

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

Roadmap Phase 0 (planning) and Phase 1 (PWA scaffold + Map mode) are done.
Phase 2 (venue graph + A* routing) is next — see `ROADMAP.md` for the full
phase breakdown and decision gates.

## Repo layout

```
moonshot-ar/
├── index.html            # Vite entry
├── vite.config.ts        # Vite + vite-plugin-pwa
├── tsconfig.json
├── public/icon.svg       # target-O app icon
├── src/
│   ├── main.tsx          # React root
│   ├── App.tsx           # shell: header, map, HUD, sheet, onboarding
│   ├── index.css         # brand tokens (CSS variables) + layout
│   ├── data/venue.ts     # zones + booths (hand-authored venue data)
│   └── components/
│       ├── MapView.tsx         # SVG floorplan, pan/zoom, pins
│       └── OnboardingOverlay.tsx
├── ARCHITECTURE.md       # full system design & engineering spec
├── ROADMAP.md            # phased build plan + backlog
└── docs/raw/             # source docs verbatim (master spec + moodboard)
```
