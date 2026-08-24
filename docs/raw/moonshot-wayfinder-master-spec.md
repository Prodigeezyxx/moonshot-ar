# Moonshot Wayfinder — Master Specification (raw, as received)

> This is the authoritative source document, saved verbatim as received from
> the user on 2026-08-24, to protect against paste corruption. Sections that
> arrived truncated (tables that lost their rows) are marked inline. This file
> is the reconciliation source for ARCHITECTURE.md / ROADMAP.md — see the note
> at the bottom.

## 3. Brand System (Observed)

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Moonshot Purple | #3F0F8A | Primary surface, headers, nav bar |
| Cream / Bone | #FAF3E0 | Canvas background, cards, kiosk bezel |
| Action Yellow | #F5A623 | Primary CTA buttons only |
| Mint Green | #9AD5B1 | Secondary accent, success states |
| Deep Teal-Green | #2E9D8F | Zone fills (policy, climate tracks) |
| Ink / Near-black | #111827 | Body text, icons, outlines |
| Lavender Tint | #EDE7F9 | Light zone fills, hover states |
| Signal Orange | #E85D3F | Startup Festival zone, alerts |

### Typography
- Headlines: Archivo Black (bold, italic, tight tracking, ALL CAPS)
- UI / Body: Poppins (SemiBold labels, Regular body)
- Numerals: Bold circular badge pattern (dark circle, cream numeral)

### Shape Language
- Seigaiha (scalloped wave) pattern — signature motif for footers, dividers, kiosk die-cut
- Card radii: 20–28px
- Buttons: 3px solid ink border, high-contrast fill, rounded-pill or 16px radius
- Shadows: Hard-offset only (no blur) — flat/poster aesthetic

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│  PWA (React/Vue) • Kiosk Browser Lockdown • Mobile Safari    │
└──────────────────────────┬──────────────────────────────────┘
                            │ HTTPS / WSS
┌──────────────────────────▼──────────────────────────────────┐
│                      EDGE / CDN                               │
│         Cloudflare / Vercel Edge → Static Assets + Cache      │
└──────────────────────────┬──────────────────────────────────┘
                            │
┌──────────────────────────▼──────────────────────────────────┐
│                     API GATEWAY                               │
│         Auth (JWT) • Rate Limiting • WebSocket Handler         │
└──────────┬───────────────┬───────────────┬───────────────────┘
           │               │               │
┌──────────▼──┐  ┌────────▼────┐  ┌───────▼─────────┐
│  Wayfinder  │  │  Session    │  │  Gamification    │
│  Service    │  │  Service    │  │  Service         │
│             │  │             │  │                  │
│ - Map data  │  │ - Schedule  │  │ - XP engine      │
│ - Routes    │  │ - Tracks    │  │ - Quests         │
│ - Zones     │  │ - Speakers  │  │ - Badges         │
│ - Pins      │  │ - Locations │  │ - Leaderboards   │
└──────┬──────┘  └──────┬──────┘  └────────┬─────────┘
       │                │                  │
       └────────────────┼──────────────────┘
                         │
┌───────────────────────▼─────────────────────────────────────┐
│                      DATA LAYER                               │
│  PostgreSQL (sessions, users) • Redis (live state, LB) • S3   │
└───────────────────────┬─────────────────────────────────────┘
                         │
┌───────────────────────▼─────────────────────────────────────┐
│                  EXTERNAL INTEGRATIONS                         │
│     Whova API • TechCabal CMS • SMS Gateway • QR Gen           │
└─────────────────────────────────────────────────────────────┘
```

## 5. Data Model

### 5.1 Zones (Venue Map)
```json
{
  "id": "main",
  "name": "Main Bowl",
  "subtitle": "Emerging Tech: The AI Conference",
  "type": "stage",
  "color": "#3F0F8A",
  "textColor": "#FAF3E0",
  "description": "The central stage hosting keynotes...",
  "coordinates": { "x": 200, "y": 110 },
  "svgPath": "M140 60 L260 60...",
  "capacity": 1200,
  "currentSessionId": "sess_001",
  "amenities": ["wheelchair", "av", "streaming"],
  "sponsors": ["grey_finance"]
}
```

### 5.2 Sessions
```json
{
  "id": "sess_001",
  "title": "The State of African AI",
  "track": "AI & Emerging Tech",
  "day": 1,
  "startTime": "10:30",
  "endTime": "11:15",
  "zoneId": "main",
  "speakers": [
    { "name": "Sara Menker", "company": "Gro Intelligence", "photo": "..." }
  ],
  "description": "...",
  "status": "live"
}
```

### 5.3 Sponsor Booths
```json
{
  "id": "grey",
  "name": "Grey Finance",
  "tier": "headline",
  "boothNumber": "B01",
  "zoneId": "atrium",
  "coordinates": { "x": 166, "y": 228 },
  "logo": "https://cdn.../grey.svg",
  "offer": "Cross-border payments demo + swag",
  "checkInXP": 50
}
```

### 5.4 User / Attendee
```json
{
  "id": "usr_abc123",
  "name": "Attendee One",
  "handle": "@moonshotexplorer",
  "email": "...",
  "ticketType": "general|vip|press",
  "xp": 120,
  "visitedZones": ["main", "fuel"],
  "visitedBooths": ["grey"],
  "attendedTracks": ["AI & Emerging Tech"],
  "badges": ["first_step", "explorer"],
  "questProgress": {
    "explorer": { "current": 2, "target": 5 },
    "networker": { "current": 1, "target": 3 }
  },
  "leaderboardRank": 47,
  "createdAt": "2026-10-28T08:00:00Z"
}
```

### 5.5 Quests
```json
{
  "id": "explorer",
  "name": "Moonshot Explorer",
  "description": "Visit 5 different zones",
  "type": "zone_visit",
  "target": 5,
  "xpReward": 200,
  "badgeReward": "explorer",
  "isActive": true,
  "startTime": "2026-10-28T08:00:00Z",
  "endTime": "2026-10-29T20:00:00Z"
}
```

### 5.6 Kiosk Configuration
```json
{
  "id": "kiosk_01",
  "location": "main_lobby",
  "fixedPosition": { "x": 200, "y": 460 },
  "display": { "width": 1080, "height": 1920, "orientation": "portrait" },
  "idleTimeoutMs": 45000,
  "lastActivity": "2026-10-28T10:24:00Z"
}
```

## 6. API Specification

### 6.1 Wayfinder API
| Endpoint | Method | Description |
|----------|--------|--------------|
| /api/v1/zones | GET | List all zones with coordinates |
| /api/v1/zones/:id | GET | Zone detail + current session |
| /api/v1/route?from=:zone&to=:zone | GET | Get landmark-based step directions |
| /api/v1/checkin | POST | Check in to zone/booth (+XP) |
| /api/v1/kiosks/:id | GET | Kiosk config (fixed position, etc.) |

### 6.2 Session API
| Endpoint | Method | Description |
|----------|--------|--------------|
| /api/v1/sessions?day=1&track= | GET | Filtered session list |
| /api/v1/sessions/:id | GET | Session detail |
| /api/v1/tracks | GET | All 9 content tracks |
| /api/v1/sessions/live | GET | Currently running sessions |

### 6.3 Gamification API
| Endpoint | Method | Description |
|----------|--------|--------------|
| /api/v1/quests | GET | Active quests for user |
| /api/v1/quests/:id/progress | POST | Update quest progress |
| /api/v1/leaderboard | GET | Top 50 + user's rank |
| /api/v1/badges | GET | All badges + unlock status |
| /api/v1/users/:id/profile | GET | User XP, badges, stats |

### 6.4 WebSocket Events
| Event | Direction | Payload |
|-------|-----------|---------|
| session.update | Server → Client | Session moved to new hall |
| leaderboard.update | Server → Client | New top scores |
| quest.completed | Server → Client | User completed quest |
| checkin.broadcast | Server → Client | Anonymous check-in stream |

## 7. Screen Specifications

### 7.1 Attract / Home (Kiosk Idle + Mobile Landing)
- Full-bleed Moonshot Purple background
- Seigaiha wave footer pattern
- Wordmark top-center with target-O icon
- "FIND YOUR WAY" headline (Archivo Black, italic, ALL CAPS)
- One-line explainer (Poppins Regular)
- Giant Action-Yellow CTA: "TAP TO START" with 3px ink border
- Three shortcut chips: Sessions / Sponsors / Amenities
- Kiosk: Returns after 45s idle timeout

### 7.2 Map Overview
- Cream canvas background with seigaiha pattern
- SVG top-down schematic of venue zones
- Color-coded fills: Purple (Main), Mint (FUEL), Orange (Startup), Lavender (Creative), Teal (Policy)
- Pulsing "YOU ARE HERE" pin (yellow, bouncing animation)
- Search bar top: "Search a session, sponsor or place"
- Zoom controls (+/-)
- Bottom sheet on zone tap: name, zone badge, description, current session, GET DIRECTIONS, CHECK IN

### 7.3 Directions
- Animated dashed route line (Action Yellow, flowing animation)
- Numbered steps using landmarks, never compass:
  - "Walk 20m past the Grey Finance booth"
  - "Take the first left at the Raenest stand"
  - "Second right after Flutterwave"
- Persistent session card at bottom
- "SEND TO MY PHONE" (QR handoff / SMS link)

### 7.4 Browse Tabs
- Sessions: Day toggle (Oct 28 / Oct 29), track filter chips, card list with time/track/speaker/location
- Sponsors: Logo grid → tap jumps to pin on map
- Amenities: Restrooms, cafeteria, charging, first aid
- Help: FAQ, staff contact, emergency

### 7.5 Gamification / Quests
- Active quest cards with progress bars
- Leaderboard (top 50 + "You" highlighted)
- Badge grid (unlocked vs locked)
- XP counter with level indicator

### 7.6 Mobile Handoff
- QR code on every kiosk screen
- Opens identical PWA with "you are here" pre-set to kiosk location
- Deep-linking: `https://wayfinder.moonshot.techcabal.com/?kiosk=kiosk_01`

## 8. Technical Decisions

### 8.1 Why PWA over Native App?
- Zero friction — scan QR, instant load
- No App Store review delays
- Single codebase for kiosk + mobile
- Works offline (service worker caches map + schedule)

### 8.2 Why No Indoor GPS / Beacons?
- National Theatre has no existing beacon infrastructure
- UWB/Bluetooth deployment for 2-day event = out of scope
- Fixed kiosk positioning + user-selected entrance = "good enough" accuracy
- Landmarks are more useful than coordinates in a crowded venue

### 8.3 Why Landmark-Based Routing?
- Compass directions fail indoors (magnetic interference from steel/concrete)
- Attendees remember visual cues: "past the Grey booth" > "head north 50m"
- Sponsor logos inline = brand visibility + wayfinding aid

### 8.4 Data Synchronization Strategy
- Write-through cache: All writes go to PostgreSQL, invalidate Redis
- Pub/Sub: Session changes pushed via WebSocket to all connected clients
- Optimistic UI: Check-ins show immediate XP gain, sync in background
- Conflict resolution: Last-write-wins for check-ins (idempotent)

## 9. Kiosk Hardware Spec
| Spec | Value |
|------|-------|
| Display | 32" portrait touchscreen, 1080×1920 |
| Browser | Chrome Kiosk Mode / Firefox Fullscreen |
| Input | Touch only (no keyboard) |
| Min tap target | 72px |
| Idle timeout | 45 seconds → return to attract screen |
| Network | Ethernet + 4G failover |
| Cabinet | Seigaiha die-cut silhouette, Moonshot Purple, cream bezel |
| Placement | Main lobby, Startup Festival entrance, FUEL hall entrance |

## 10. Implementation Roadmap (as received)

### Phase 1: Demo Day (Today)
- [x] Interactive SVG floorplan with clickable zones
- [x] Landmark-based routing with animated paths
- [x] Quest system with XP, badges, leaderboard
- [x] Session browser by day/track
- [x] Mobile-responsive PWA shell
- [ ] Connect to live CMS endpoint
- [ ] QR handoff flow

### Phase 2: Pre-Event (2 weeks before)
- [ ] Whova API integration for session sync
- [ ] Sponsor booth data import
- [ ] Kiosk browser lockdown + idle timeout
- [ ] Accessibility audit (WCAG AA)
- [ ] Load testing (5,700 concurrent users)
- [ ] Offline service worker

### Phase 3: Live Event
- [ ] Real-time session updates
- [ ] Live leaderboard
- [ ] Push notifications for session reminders
- [ ] Analytics dashboard (heatmaps, popular routes)
- [ ] On-site support team

### Phase 4: Post-Event
- [ ] Analytics report for sponsors
- [ ] Attendee engagement summary
- [ ] Badge/quest archive
- [ ] Reusable framework for Moonshot 2027

> NOTE: Phase 1 checkboxes above are marked [x] "done" as received in the raw
> doc, but nothing has actually been built in this repo yet — see the
> reconciliation note at the bottom of this file. Do not treat those checks as
> true for THIS codebase until verified.

## 11. Security & Privacy
- No location tracking: Position is fixed per kiosk or user-selected; no GPS coords stored
- Anonymous by default: Leaderboard uses handles, not real names (opt-in for full name)
- GDPR-compliant: Check-in data retained 30 days post-event, then purged
- JWT auth: Short-lived tokens (1 hour), refresh on activity
- Rate limiting: 100 req/min per IP, 10 check-ins/min per user

## 12. Performance Budget
| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s on 3G |
| Time to Interactive | < 3s on 3G |
| SVG map render | < 100ms |
| Route calculation | < 50ms (client-side) |
| Check-in roundtrip | < 300ms |
| WebSocket latency | < 100ms |
| App shell size | < 200KB gzipped |

## 13. File Structure (Recommended, as received)
```
moonshot-wayfinder/
├── public/
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js                    # Service worker
│   └── assets/
│       ├── seigaiha.svg
│       ├── zones/
│       │   ├── main-bowl.svg
│       │   └── ...
│       └── sponsors/
│           └── grey-finance.svg
├── src/
│   ├── components/
│   │   ├── Map/
│   │   │   ├── VenueMap.jsx
│   │   │   ├── ZoneLayer.jsx
│   │   │   ├── RouteLayer.jsx
│   │   │   └── YouAreHere.jsx
│   │   ├── Directions/
│   │   │   ├── StepList.jsx
│   │   │   └── RoutePreview.jsx
│   │   ├── Quests/
│   │   │   ├── QuestCard.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   └── BadgeGrid.jsx
│   │   ├── Sessions/
│   │   │   ├── SessionCard.jsx
│   │   │   ├── TrackFilter.jsx
│   │   │   └── DayToggle.jsx
│   │   └── UI/
│   │       ├── BottomNav.jsx
│   │       ├── BottomSheet.jsx
│   │       ├── Header.jsx
│   │       └── Toast.jsx
│   ├── hooks/
│   │   ├── useKiosk.js
│   │   ├── useWayfinding.js
│   │   ├── useQuests.js
│   │   └── useWebSocket.js
│   ├── services/
│   │   ├── api.js
│   │   ├── websocket.js
│   │   └── storage.js
│   ├── data/
│   │   ├── zones.json
│   │   ├── routes.json
│   │   └── quests.json
│   ├── styles/
│   │   ├── tokens.css
│   │   └── components.css
│   └── App.jsx
├── api/
│   ├── routes/
│   │   ├── zones.js
│   │   ├── sessions.js
│   │   ├── quests.js
│   │   └── users.js
│   ├── models/
│   ├── websocket/
│   └── index.js
└── package.json
```

## 14. Risk Register
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Venue WiFi overload | Medium | High | Offline-first PWA, cache all critical data |
| Kiosk hardware failure | Low | Medium | 3 kiosks = redundancy, mobile fallback |
| Session schedule changes | High | Medium | Real-time sync via WebSocket |
| Indoor map confusion | Medium | Medium | Staff ambassadors + landmark-based directions |
| Gamification abuse | Low | Low | Rate limiting, server-side validation |

## 15. Appendix: Brand Assets Checklist
- [ ] Moonshot wordmark with target-O (SVG, pixel-accurate)
- [ ] "by techcabal" lockup (never drop on kiosk/full-screen)
- [ ] Seigaiha pattern (SVG, scalable)
- [ ] 9 track icons (flat vector, consistent stroke weight)
- [ ] Sponsor logos (all booths, SVG preferred)
- [ ] National Theatre floorplan (CAD → SVG conversion)
- [ ] Kiosk cabinet render (for fabrication reference)

End of Document (as received, main body)

---

## Appendix B: VPS + Niantic Scaniverse Architecture (v2 Update)

Date: 2026-08-20
Status: Architecture v2 — replaces beacon/GPS positioning with visual positioning

### B.1 Positioning Layer (Revised)

**Primary: VPS via Niantic Scaniverse + 8th Wall WebAR**

| Aspect | Detail |
|--------|--------|

> ⚠️ TRUNCATED IN TRANSIT — the table under B.1 arrived as header-only
> ("Table AspectDetail") with the row data cut off, same corruption pattern as
> the earlier color-palette pastes. The rest of Appendix B (B.2 onward, if it
> exists) did not arrive either. This mirrors content already captured
> elsewhere in this project (see ARCHITECTURE.md §§0b, 2, 8, 9, 10, 11 and the
> ROADMAP.md phase list), which was sourced from three earlier, intact pastes
> covering: the 8th Wall → Niantic Studio correction and costs, VPS zone
> suitability for the National Theatre geometry, and the original v2
> architecture text (positioning/data/routing/backend/frontend). Treat those
> sections as the reliable record of Appendix B's content until/unless the
> user resends the missing table intact.

---

## Reconciliation note (added by agent, not part of the original doc)

This master spec is significantly larger in scope than `ARCHITECTURE.md` /
`ROADMAP.md` as currently written in this repo, and it conflicts with them on
a few concrete points. Flagging rather than silently overwriting:

1. **Backend**: this doc specifies a custom API Gateway + PostgreSQL + Redis +
   WebSocket + S3 stack with a Wayfinder/Session/Gamification service split.
   The existing `ARCHITECTURE.md` §1 specifies **Supabase** as the one shared
   data source. These are different architectures, not a small delta.
2. **Scope**: this doc adds an entire session/speaker/track browsing system
   (9 tracks, day toggle, live sessions), kiosk hardware (3x 32" touchscreens,
   kiosk lockdown, idle timeout), Whova API + TechCabal CMS integrations, JWT
   auth, and a full REST + WebSocket API surface. None of that scope exists in
   the current `ARCHITECTURE.md`/`ROADMAP.md`.
3. **Branding**: "by techcabal" lockup and TechCabal as CMS/co-brand were not
   previously known — worth confirming this is really a TechCabal-branded
   event product, not just "Moonshot."
4. **Real vs. placeholder data**: real sponsor names beyond the original five
   appear here (Raenest, Flutterwave) in a directions example — worth
   confirming whether the sponsor roster itself has grown, or these are just
   illustrative placeholder examples in the doc.
5. Real color tokens, typography, and shape language are now available —
   these directly replace the `ARCHITECTURE.md` §6a placeholder.
