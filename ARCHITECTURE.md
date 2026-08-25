# Moonshot Wayfinder 2026 — System Design & Engineering Specification

Version 4 (merged). This is the single source of truth. It reconciles three
sources — the master spec (incl. the brand system), the fully-dictated
Appendix B (VPS positioning + data layer v2), and the moodboard transcript —
into the PWA-first architecture. The platform correction, chosen stack,
positioning/data/routing/backend/frontend design, VPS suitability, scan plan,
QR fallback, cost model, and the merge decisions all live here. The roadmap
lives in `ROADMAP.md`.

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
- Wherever the source docs below say "8th Wall," read "Niantic Studio" — the
  v2 positioning text predates the correction.

---

## 1. Chosen PWA stack (and why)

The requirement is a **mobile-first, installable PWA** — feels like a native
app with no app-store step, works offline, and holds the camera/AR mode behind
the same shell.

| Layer | Choice | Why |
|-------|--------|-----|
| Build tool | **Vite** | Fast dev server, first-class PWA plugin, trivial static deploy to Cloudflare Pages/Vercel |
| UI framework | **React** (+ TypeScript) | The component list (§6) is ~7 components sharing one state tree; React context covers it without a heavy framework. TS pays for itself in the A*/graph/transform code where a wrong type = a wrong route |
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

## 2. Positioning layer (Appendix B.1, merged)

**Primary — VPS via Niantic Scaniverse + Niantic Studio.**

| Aspect | Detail |
|--------|--------|
| Scan coverage | One Scaniverse scan per zone: Main Bowl, Hall XYZ, Startup Festival Floor, Studio 2, Studio 3 |
| Scan effort | A few minutes of camera sweep per zone |
| Processing | Cloud-processed into a VPS map; centimetre-accurate localization once scanned |
| Delivery | Browser-based AR (Niantic Studio, formerly 8th Wall) — no app download required |
| Hardware | Zero hardware installed at the venue |

**Why VPS over beacons/GPS:**
- No BLE beacon procurement or installation cycle.
- No WiFi/magnetic fingerprinting calibration.
- No PDR (pedestrian dead reckoning) drift accumulation.
- Works in the browser — attendees scan a QR, grant camera permission, and AR
  activates instantly.

**Fallback — QR check-in nodes.**

| Aspect | Detail |
|--------|--------|
| Placement | One per zone/booth entrance |
| Purpose | Covers unscanned areas, poor lighting, feature-poor corridors (long identical walls break visual matching) |
| Dual role | Doubles as the gamification trigger (points, badges), independent of positioning accuracy |
| UX | Attendee scans QR → app records check-in → updates "You Are Here" to that node |

**Explicitly dropped (v1 → v2):**
- ❌ BLE beacons
- ❌ WiFi/magnetic fingerprinting
- ❌ PDR (pedestrian dead reckoning)

Coverage rationale: **VPS + QR fallback covers the same positioning need with
zero hardware installed at the venue.**

> This resolves the earlier beacon contradiction: the moodboard's "Beacon
> Coverage" dashboard (page 10) is confirmed outdated/aspirational v1 concept
> art. The written v2 decision — no beacons — is the real one.

---

## 3. Data layer (Appendix B.2, merged)

- **Venue graph** — unchanged from v1: nodes (entrances, junctions, booths,
  zone anchors) + weighted edges, hand-authored from the floorplan.
- **VPS sites** — one Scaniverse Site per zone, each defining its own
  coordinate space; a manual transform table maps each site's origin back into
  the shared floorplan coordinate system.

| Field | Description |
|-------|-------------|
| `site_id` | One per zone scan |
| `scaniverse_site_url` | Link to cloud-processed VPS map |
| `coordinate_space` | Local origin defined by the scan |
| `floorplan_transform` | Manual transform table mapping the site's origin back into the shared floorplan coordinate system |
| `status` | `pending_scan → processing → live → degraded` |

```json
{
  "vps_sites": [
    {
      "site_id": "vps_main_bowl",
      "zone_id": "main",
      "scaniverse_site_url": "https://scaniverse.com/site/...",
      "local_origin": { "lat": 0, "lng": 0, "alt": 0 },
      "floorplan_transform": {
        "scale": 1.0,
        "rotation_deg": 0,
        "offset": { "x": 200, "y": 110 }
      },
      "status": "live",
      "last_calibrated": "2026-10-20T00:00:00Z"
    }
  ]
}
```

- **User state** — check-ins, XP, quest progress, badges, last-known position.
  All of it lives in **one shared Supabase store** (anonymous session, realtime
  DB, storage for badge assets) — the single source of truth every surface
  (map, HUD, leaderboard, passport) reads from, so a check-in on one device is
  reflected everywhere else within the realtime sync window.

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

**Backend decision (merge, see §6b for the conflict it resolves):** the master
spec's §4 architecture shows a custom API Gateway + PostgreSQL + Redis +
WebSocket + S3 with a Wayfinder/Session/Gamification service split. This is
**not** a contradiction with Supabase — Supabase *is* managed Postgres with a
Realtime pub/sub layer over logical replication, which is functionally the
Postgres + Redis (live state) + WebSocket combo the master spec describes.
Decision: **Supabase for Phase 1–3** (zero ops, free tier). The custom
Postgres + Redis + gateway stack is the explicit fallback answer *if* load
testing at the master spec's 5,700-concurrent-user target shows Supabase's
free/pro tier can't keep up.

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

**Component list**
- `MapView` — SVG floorplan, pins, route line, you-are-here.
- `ARLauncher` — camera view, AR route overlay.
- `DestinationPicker` — search/select zone or booth.
- `GamificationHUD` — points, badges, leaderboard modal.
- `PassportCard` — visited zones/booths, share.
- `CheckInModal` — QR scan fallback, camera-based reader.
- `OnboardingOverlay` — first-run camera prompt.

State: React context — no heavier state framework needed at this scale.

---

## 6a. Brand system (from master spec §3 — now confirmed, not a placeholder)

Sourced from the authoritative master spec's observed brand system. These
replace the earlier "pending" placeholder.

### Color palette

| Token | Hex | Usage |
|-------|-----|-------|
| Moonshot Purple | `#3F0F8A` | Primary surface, headers, nav bar |
| Cream / Bone | `#FAF3E0` | Canvas background, cards, kiosk bezel |
| Action Yellow | `#F5A623` | Primary CTA buttons only |
| Mint Green | `#9AD5B1` | Secondary accent, success states |
| Deep Teal-Green | `#2E9D8F` | Zone fills (policy, climate tracks) |
| Ink / Near-black | `#111827` | Body text, icons, outlines |
| Lavender Tint | `#EDE7F9` | Light zone fills, hover states |
| Signal Orange | `#E85D3F` | Startup Festival zone, alerts |

### Typography
- Headlines: **Archivo Black** (bold, italic, tight tracking, ALL CAPS).
- UI / Body: **Poppins** (SemiBold labels, Regular body).
- Numerals: bold circular badge pattern (dark circle, cream numeral).

### Shape language
- **Seigaiha** (scalloped wave) pattern — signature motif for footers,
  dividers, kiosk die-cut.
- Card radii: **20–28px**.
- Buttons: **3px solid ink border**, high-contrast fill, rounded-pill or 16px
  radius.
- Shadows: **hard-offset only** (no blur) — flat/poster aesthetic.

Zone colors on the map carry through to badges and the leaderboard, so the
color coding means the same thing everywhere in the app. Branding confirmed by
the moodboard: "Moonshot 2026 · Courage & Conviction," by TechCabal x Grey
(Grey = Headline Sponsor), "powered by realmspace" (Floats XR as the named
technology partner).

---

## 6b. Scope reconciliation (merge decisions)

Three flagged conflicts, resolved transparently here:

1. **Backend (Supabase vs Postgres+Redis+WebSocket)** — not a real
   contradiction (see §5). Supabase = managed Postgres + Realtime; kept for
   Phase 1–3, with the custom stack as the load-test fallback.

2. **Beacons (moodboard "Beacon Coverage" dashboard vs master spec §8.2 "no
   beacons")** — resolved by Appendix B.1's "Explicitly dropped: BLE beacons."
   Beacons were deliberately dropped in v2; the moodboard render is outdated
   v1 concept art.

3. **New scope from the moodboard** (not in the master spec) — folded in as
   **backlog / Phase 2+**, not Phase 1:
   - **AI Totem** conversational concierge ("Ask Moonshot") — natural-language
     Q&A, route/schedule.
   - **Smart Entry** badge check-in arches (personalized welcome).
   - **Digital Twin** — live venue ops dashboard.
   - **Expanded zone list** — AI Development, Climate Solutions, Creative
     Economy, Enterprise, Govt & Policy (alongside Fintech, Startup Festival);
     plus **FUEL** as a distinct deal-room/investor-meeting zone.
   - Physical gamified activations — arcade "Pitch Game" and "Table Soccer —
     Courage & Conviction Cup" (live scoreboard).

Additional master-spec scope (also backlog / Phase 2+, not Phase 1): the
session/speaker/track browsing system (9 tracks, day toggle, live sessions),
kiosk hardware (3× 32" portrait touchscreens, lockdown, idle timeout), Whova
API + TechCabal CMS integrations, JWT auth, and the full REST + WebSocket API
surface. Phase 1 stays deliberately narrow (map + routing + quests + PWA shell).

Note on sponsor roster: the master spec's directions example mentions
"Raenest" and "Flutterwave" — treat as illustrative placeholder examples, not
a confirmed roster expansion. The confirmed atrium anchors remain the five
named booths (Grey, Sabi, Accrue, Breet, Sentz).

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
