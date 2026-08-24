# Moonshot Wayfinder 2026 — System Design & Engineering Specification

Version 3 (PWA-first). This is the single source of truth: the platform
correction, the chosen PWA stack, the positioning/data/routing/backend/frontend
design, the VPS suitability analysis, the scan plan, the QR fallback, and the
cost model. The roadmap lives in `ROADMAP.md`.

---

## 0a. Design principles

Everything below serves three non-negotiables:

1. **One shared data source** — session state (position, check-ins, points,
   XP, badges) lives in one realtime store (Supabase). A move by one user, or
   a check-in at one booth, propagates to every connected screen — leaderboard,
   HUD, passport — instantly. No surface reads a stale local copy.
2. **Gamification drives engagement** — **XP, quests, badges, and leaderboards**
   incentivize exploration. XP accrues from movement/check-ins, quests are
   multi-step objectives across zones/booths (not just single check-ins),
   badges mark milestones, and the leaderboard makes progress visible and
   competitive.
3. **Honesty over polish** — position is either live (VPS) or a timestamped
   last-known fix (QR), never interpolated or faked; AR is clearly labeled as
   a preview until a real venue scan exists (§12).

---

## 0b. Platform correction (read this first)

**8th Wall is winding down.** Niantic sold its gaming division to Scopely for
$3.85B and spun off **Niantic Spatial** as an independent geospatial-AI + XR
company. 8th Wall is being retired over the next year (hosted projects stay
live through **February 2027**). The successor is **Niantic Studio**, which
carries VPS natively.

Implications:
- Fine to build on for an August 2026 event, but it's a **wind-down platform,
  not a long-term bet**.
- The eventual VPS integration targets **Niantic Studio**, not 8th Wall.
- No budget committed to 8th Wall tooling/licences at this stage.

---

## 1. Chosen PWA stack (and why)

The requirement is a **mobile-first, installable PWA** — feels like a native
app with no app-store step, works offline, and holds the camera/AR mode behind
the same shell. This is the stack that best serves that:

| Layer | Choice | Why |
|-------|--------|-----|
| Build tool | **Vite** | Fast dev server, first-class PWA plugin, trivial static deploy to Cloudflare Pages/Vercel |
| UI framework | **React** (+ TypeScript) | The component list (§6) is 7 components sharing one state tree; React context covers it without a heavy framework. TS pays for itself in the A*/graph/transform code where a wrong type = a wrong route |
| PWA | **vite-plugin-pwa** (Workbox) | Generates the Web App Manifest + service worker automatically; offline precache, install prompt, splash + icons |
| Routing (in-app) | **react-router-dom** | Two surfaces (Map mode / AR mode) + `?zone=` / `?booth=` deep-links for the QR fallback |
| Map | **Hand-authored SVG** | Lightweight, crisp on every DPI, matches the "vectorized floorplan" requirement; no heavy canvas lib |
| Pathfinding | **Hand-rolled A\*** (~60 lines) | The graph is tiny (<100 nodes); a dependency here is needless weight |
| State | **React context + Supabase** | Context for UI state; Supabase for the durable bits (check-ins, points, badges, leaderboard) |
| Backend | **Supabase** (free tier) | Anonymous sessions, Postgres, realtime leaderboard sync, storage for badge assets — all free at this scale |
| Hosting | **Cloudflare Pages** (or Vercel) | Free static hosting, global CDN, HTTPS (required for camera + service worker) |
| AR (today) | **getUserMedia + SVG overlay** (scripted mock) | No real VPS scan exists yet, so AR is a clearly-labeled preview; A-Frame/three.js would be dead weight for a mock |
| AR (future) | **Niantic Studio** VPS | Replaces the mock the moment a real venue scan exists |

Two things worth flagging up front (explained, not surprising):
- **vite-plugin-pwa** is what turns a plain web app into an installable PWA —
  it writes the `manifest.webmanifest` (name, icons, standalone display) and a
  service worker that caches the app for offline use. Without it you'd hand-write
  both files and a caching strategy.
- **Supabase** is a hosted Postgres with a realtime API. It replaces a custom
  backend for the leaderboard and badge state. The `anon` key lets visitors use
  the app with no sign-up; an anonymous session is minted per device.

> Note: HTTPS is mandatory in production (service workers and `getUserMedia`
> both refuse insecure origins). Local dev uses Vite's built-in HTTPS flag for
> camera testing.

---

## 2. Positioning layer

**Primary — VPS (Niantic Scaniverse + Niantic Studio).**
- One Scaniverse scan per zone (Main Bowl, Hall XYZ, Startup Festival Floor,
  Studio 2, Studio 3); a few minutes of camera sweep each.
- Cloud-processed into a VPS map; centimetre-accurate localization once scanned.
- Delivered as browser AR — no app download.

**Fallback — QR check-in nodes.**
- One per zone/booth entrance; covers unscanned areas, poor lighting, and the
  feature-poor corridors (long identical walls break visual matching).
- Doubles as the gamification trigger (points, badges), independent of
  positioning accuracy.

**Explicitly dropped:** BLE beacons, WiFi/magnetic fingerprinting, PDR — VPS +
QR covers the need with zero hardware installed at the venue.

---

## 3. Data layer

- **Venue graph** — nodes (entrances, junctions, booths, zone anchors) +
  weighted edges, hand-authored from the floorplan.
- **VPS sites** — one Scaniverse Site per zone, each with its own coordinate
  space; a manual transform table maps each site origin into the shared
  floorplan coordinate system.
- **User state** — check-ins, XP, quest progress, badges, last-known position.
  All of it lives in **one shared Supabase store** (anonymous session, realtime
  DB, storage for badge assets) — this is the single source of truth every
  surface (map, HUD, leaderboard, passport) reads from, so a check-in on one
  device is reflected everywhere else within the realtime sync window.

---

## 4. Routing

A* over the node graph. Current-node lookup has two sources, never mixed up:
- Live VPS pose → snapped to nearest graph node (continuous, in AR mode).
- Last QR check-in → static until the next scan (fallback, shown with a
  timestamp, never faked as live).

---

## 5. Backend

Static site (Cloudflare Pages/Vercel) + Supabase for realtime state. Niantic
Studio hosts the AR runtime and hands position data back via its JS API.

---

## 6. Frontend

Two surfaces, one shell. Mobile-first PWA, installable via manifest.

**Map mode (default landing)**
- SVG floorplan (vectorized venue map), pan/zoom.
- "You are here" dot, sourced from live VPS or last check-in — never
  interpolated between fixes.
- Destination search/picker (zones + booths).
- Routed path drawn as an animated line, with distance/ETA.
- "Navigate" hands off to AR mode when near a scanned zone boundary.

**AR mode**
- Full-screen camera view (Niantic Studio, later).
- Path drawn as an AR overlay on the floor (arrows/line), not a 2D map.
- Auto-drops to map mode on straight, feature-poor stretches to save battery.

**Persistent HUD**
- XP counter, badge tray, active quest tracker, leaderboard access
  (floating/bottom nav, not blocking the map).
- Passport view: zones/booths visited, quests completed, shareable as an image.

**Gamification model**
- **XP** — earned on movement between zones and on check-ins; the core
  progress currency.
- **Quests** — multi-step objectives spanning zones/booths (e.g. "visit all 5
  sponsor booths," "check in to every studio") — richer than a single check-in,
  designed to pull attendees through the whole venue, not just the nearest booth.
- **Badges** — awarded on quest completion or milestone XP thresholds.
- **Leaderboard** — realtime ranking by XP, visible from the HUD at any time.

**Onboarding**
- Single "point your camera to find your spot" moment on first entry to a
  scanned zone. No account, no multi-step tutorial.

**Visual identity** (derived from the existing Moonshot 2026 venue map)
- Cream background, purple/green/orange zone-coded blocks, bold condensed
  display type for headlines, pill-shaped labels for booths/tags.
- Zone colors carry through to badges and the leaderboard — same color means the
  same thing everywhere.

**Component list**
- `MapView` — SVG floorplan, pins, route line, you-are-here.
- `ARLauncher` — camera view, AR route overlay.
- `DestinationPicker` — search/select zone or booth.
- `GamificationHUD` — points, badges, leaderboard modal.
- `PassportCard` — visited zones/booths, share.
- `CheckInModal` — QR scan fallback, camera-based reader.
- `OnboardingOverlay` — first-run camera prompt.

State: React context — no heavier state framework needed at this scale.

## 6a. Brand system (pending — placeholder)

> **Not yet populated with real values.** Multiple paste attempts to capture
> the actual color palette (Token / Hex / Usage table) did not survive
> transfer — only headers arrived, no row data. Rather than fabricate hex
> codes, font names, or logo specs, this section is left as a structural
> placeholder until the real brand doc/image/link comes through. Do not treat
> anything below as final — it names the fields to fill, not values.

| Token | Hex | Usage |
|-------|-----|-------|
| _pending_ | _pending_ | _pending_ |

Fields still needed:
- Color tokens (primary/secondary/accent + per-zone colors — purple/green/orange
  per the venue map, per §6 "Visual identity")
- Typography (display/body typefaces, weights)
- Logo usage rules
- Spacing/radius/elevation tokens if a formal design system exists

Once supplied (image, doc link, or typed values), this section replaces the
placeholder table and the "Visual identity" notes in §6 get cross-referenced
here as the single source for brand tokens.

---

## 7. Venue geometry — five zones on real architecture

The National Theatre Lagos is a circular drum with a D-shaped proscenium
auditorium, concentric corridor rings, and radial wings. The five zones map to
real architectural sections:

| Zone | Architectural anchor | Sponsor anchor |
|------|---------------------|----------------|
| Main Bowl | Central stage + D-shaped seating bowl | — (hero zone) |
| Hall XYZ | Outer wing, exhibition booths | — |
| Startup Festival | Outer wing, pitch stage + demo area | — |
| Studios (2 & 3) | Outer wings, distinct room configs | — |
| Atrium ring | Concentric corridors | Grey · Sabi · Accrue · Breet · Sentz |

The five sponsor booths sit in the atrium ring and double as **visual anchors**
— their branded signage helps VPS disambiguate the repetitive corridor sections.

---

## 8. VPS suitability — honest assessment

| Zone | Suitability | Why |
|------|-------------|-----|
| Main Bowl | ✅ Excellent | Stage, tiered seating, radial structure = rich distinct features; D-shaped proscenium anchors from every angle |
| Hall XYZ | ✅ Good | Different interior fittings; distinct entrance archways |
| Studios 2/3 | ✅ Good | Different room configs = different visual fingerprints |
| Atrium ring | ⚠️ Moderate risk | Repetitive concentric walls/flooring/lighting — rotational symmetry |

Two real challenges:
1. **Rotational symmetry** — the building is a circle; features repeat at ~45°
   intervals. Needs dense scanning (sweep from multiple radii, not just centre).
2. **Feature-poor corridors** — long identical stretches. This is why the **QR
   fallback is not optional**; it's essential for zone-to-zone transitions.

What makes it work: sponsor booths as branded anchors, radial-corridor
junctions where visual complexity spikes, and differing ceiling heights /
lighting per zone.

---

## 9. Scan plan (Scaniverse)

Five zones at ~5 min sweep each ≈ 25 min footage ≈ **45,000 credits**.

| Zone | Sweeps |
|------|--------|
| Main Bowl | 4: centre stage, front row, rear balcony, side aisle |
| Hall XYZ | 3: entrance, centre, far corner |
| Startup Festival | 3: entrance, demo area, pitch stage |
| Studios | 2 each: entrance + centre |
| Atrium ring | 1 continuous ring sweep + each sponsor booth as mini-anchor |

---

## 10. QR fallback strategy (the essential piece)

Where VPS can't lock (corridors), printed QR codes per zone deep-link straight
into that zone — no tracking needed. `index.html?zone=<id>` / `?booth=<id>`:

| QR encodes | Opens |
|-----------|-------|
| `?zone=main-bowl` | Main Bowl |
| `?zone=hall-xyz` | Hall XYZ |
| `?zone=startup-festival` | Startup Festival |
| `?zone=studios` | Studios 2/3 |
| `?zone=atrium` | Atrium ring + sponsor directory |
| `?booth=grey` … | Individual sponsor booths |

---

## 11. Cost model

### Scanning (Scaniverse)
- New users start on **Free** (monthly credit allowance). **Plus $20/mo**,
  **Pro $50/mo** if more is needed.
- 5-min scan → asset generation = **9,000 credits**; **$1 = 1,800 credits** on Free.
- 5 zones ≈ 45,000 credits ≈ **~$25 one-time** (less on Plus ~10% / Pro ~15%).

### VPS localization calls (Niantic Studio)
- Free tier **25,000 calls/month**. Each attendee localization ≈ 1 call — a busy
  two-day event lands at/just over this. Above it: invoiced via Niantic Spatial,
  no public rate — contact sales.

### WebAR hosting / commercial licence
- **No licence needed** for personal/educational, non-commercial artistic
  expression, private demo, or a sample to show prospective clients → **today's
  pitch demo is free to run.**
- Public, branded event = **commercial use**. Reference: recently dropped
  **$3,000 → $700/project/month** — confirm on Niantic's live pricing page
  (mid-transition to Niantic Studio).

### Backend
- Supabase free tier + Cloudflare Pages/Vercel free tier cover a single-event
  leaderboard + static hosting with room to spare.

### Bottom line
| Stage | Cost |
|-------|------|
| Build + demo today | **Free** (all inside free tiers) |
| Scan the real venue | **~$25–50 one-time** |
| Live public branded event | **~$700/mo** commercial licence (the one real cost) |

---

## 12. What's honestly demoable today

No Scaniverse scan of the National Theatre exists yet, so **real VPS positioning
cannot run in a same-day demo.** Today's build is therefore:
- **Map mode fully functional** — floorplan, routing, you-are-here, gamification,
  leaderboard.
- **AR mode as a scripted mock** — camera view + overlay animation, framed
  explicitly as "this is what the VPS-powered version looks like once the venue
  is scanned," not presented as live positioning.

That's an honest demo that still shows the full experience; the AR mock becomes
real the moment someone does the venue scan.
