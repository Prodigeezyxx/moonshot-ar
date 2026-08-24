# Moonshot Wayfinder 2026 — Roadmap

Build order is chosen so that each phase produces a usable, demoable increment —
no phase depends on a future scan. Phases 1–5 are all buildable today; 6–7
unblock only when a real venue scan exists.

---

## Phase 0 — Plan & lock the stack  ✅ (this doc set)
- Deliverables: `ARCHITECTURE.md`, `ROADMAP.md`, `README.md`.
- Done when: stack + roadmap approved.

---

## Phase 1 — PWA scaffold + Map mode (core)
- Vite + React + TypeScript + `vite-plugin-pwa` scaffold.
- Installable: manifest, service worker, icons (192/512), splash.
- SVG floorplan of the National Theatre geometry — concentric rings, D-shaped
  bowl, central stage, radial corridors; 5 zones + 5 sponsor booths placed.
- `MapView`: pan/zoom, zone/booth pins, "you are here" dot (QR-sourced for now).
- `OnboardingOverlay`: first-run "point your camera" prompt.
- **Done when:** `npm run dev` → installable PWA shows the floorplan on a phone.

---

## Phase 2 — Venue graph + routing
- Hand-author the node/edge graph (entrances, junctions, booths, zone anchors)
  from the floorplan, with weights.
- Hand-rolled A* module (~60 lines) + a small test harness.
- `DestinationPicker`: search/select a zone or booth.
- Route line (animated) + distance/ETA on the map.
- Current-node sourced from last QR check-in (static, timestamped).
- **Done when:** pick a destination → correct route line + distance/ETA render.

---

## Phase 3 — Gamification + Supabase state
- Supabase project (the one shared data source): anonymous sessions; tables for
  users, check-ins, XP events, quests, quest_progress, badges; realtime channel
  for the leaderboard; storage bucket for badge assets.
- `GamificationHUD`: XP counter, badge tray, active quest tracker, leaderboard modal.
- `PassportCard`: visited zones/booths, quests completed, shareable-as-image.
- **Done when:** a check-in on one device awards XP/advances a quest and the
  change (XP total, leaderboard rank, quest progress) appears on a second
  device in realtime, with no manual refresh.

---

## Phase 4 — QR check-in fallback
- `CheckInModal`: camera-based QR reader (BarcodeDetector API, jsQR fallback).
- Zone/booth QR deep-links (`?zone=`, `?booth=`).
- Check-in → point/badge → HUD + leaderboard update.
- **Done when:** scanning a printed QR in a corridor checks you in and awards
  points, with the position timestamped (not faked as live).

---

## Phase 5 — AR mode (scripted mock)
- `ARLauncher`: `getUserMedia` camera feed + animated path overlay.
- Clearly labeled "VPS preview — venue not yet scanned."
- Auto-drop-to-map stub on feature-poor stretches.
- **Done when:** phone camera + animated path overlay works over a real room.

---

### Decision gate A — after Phase 5
Moonshot greenlight? This decides whether we pay for a scan + commercial licence
or stop at a free demo.

---

## Phase 6 — VPS integration (Niantic Studio)
- Requires a real Scaniverse scan of the venue (see scan plan, §9 of ARCHITECTURE).
- Niantic Studio project (**not 8th Wall** — wind-down); VPS localization.
- Live pose → snap to nearest graph node; continuous you-are-here.
- **Done when:** real VPS localization drives the map dot and AR overlay.

---

## Phase 7 — Venue scan + go-live
- Scan the venue per the scan plan (~$25–50 one-time).
- Commercial licence if public/branded (~$700/mo — confirm live pricing).
- Print zone/booth QR codes; deploy to Cloudflare Pages/Vercel.
- **Done when:** live at the event.

---

## Decision gates (summary)
- **Gate A** (after Phase 5): greenlight? → scan + licence budget, or free demo.
- **Gate B** (before Phase 6): venue scan completed.
- **Gate C** (before Phase 7): pricing + licence confirmed on Niantic's live page.

## Milestones at a glance
1. Installable PWA + map mode  (Phase 1)
2. Searchable routing          (Phase 2)
3. Realtime leaderboard        (Phase 3)
4. QR check-in fallback        (Phase 4)
5. Honest AR preview           (Phase 5)
6. Real VPS localization       (Phase 6)
7. Live event                  (Phase 7)
