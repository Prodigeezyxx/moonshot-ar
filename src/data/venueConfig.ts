import { type WhiteLabelVenueConfig } from '../types/venueConfig'
import { NODES, EDGES } from './graph'

export const MOONSHOT_2026_CONFIG: WhiteLabelVenueConfig = {
  id: 'moonshot-2026',
  name: 'MOONSHOT',
  tagline: 'Courage & Conviction',
  locationName: 'National Theatre Lagos',
  poweredBy: 'realmspace',
  theme: {
    primary: '#1D1335',       // Modern sleek dark purple
    primaryText: '#FFFFFF',
    background: '#0F0B1A',    // Dark mode high-contrast map canvas
    surface: '#1A1428',
    surfaceText: '#FAF3E0',
    accent: '#F5A623',        // Action Yellow
    accentText: '#111827',
    navLine: '#00F0FF',       // High-visibility bright neon blue route (like modern GPS in the reference screenshots)
    navLineGlow: 'rgba(0, 240, 255, 0.4)',
    zoneColors: {
      'main-bowl': { bg: '#3F0F8A', text: '#FFFFFF', border: '#7928CA' },
      'hall-xyz': { bg: '#2E9D8F', text: '#FFFFFF', border: '#38D9A9' },
      'startup-festival': { bg: '#E85D3F', text: '#FFFFFF', border: '#FF922B' },
      'studios': { bg: '#9AD5B1', text: '#111827', border: '#69DB7C' },
      'atrium': { bg: '#261C3D', text: '#D8D4E2', border: '#4C3A6E' }
    }
  },
  dimensions: {
    width: 640,
    height: 640,
    defaultCenter: { x: 320, y: 320 }
  },
  zones: [
    {
      id: 'main-bowl',
      name: 'Main Stage Bowl',
      type: 'amphitheatre',
      cx: 320,
      cy: 320,
      rIn: 0,
      rOut: 165,
      description: 'Central auditorium • The AI Conference & Keynotes',
      colorKey: 'main-bowl'
    },
    {
      id: 'hall-xyz',
      name: 'Hall XYZ Exhibition',
      type: 'sector',
      cx: 320,
      cy: 320,
      rIn: 165,
      rOut: 300,
      a1: -130,
      a2: -50,
      description: 'North Wing • Enterprise Showcases & Demos',
      colorKey: 'hall-xyz'
    },
    {
      id: 'startup-festival',
      name: 'Startup Festival Arena',
      type: 'sector',
      cx: 320,
      cy: 320,
      rIn: 165,
      rOut: 300,
      a1: -40,
      a2: 40,
      description: 'East Wing • Founder Pitch Stage & Deal Rooms',
      colorKey: 'startup-festival'
    },
    {
      id: 'studios',
      name: 'Studios 2 & 3',
      type: 'sector',
      cx: 320,
      cy: 320,
      rIn: 165,
      rOut: 300,
      a1: 130,
      a2: 230,
      description: 'West Wing • Technical Workshops & Breakouts',
      colorKey: 'studios'
    }
  ],
  pois: [
    {
      id: 'poi-main-stage',
      name: 'Main Stage (Bowl)',
      category: 'stage',
      zoneId: 'main-bowl',
      nodeId: 'zone-main-stage',
      x: 320,
      y: 290,
      subtitle: 'Hero Stage • Live Sessions',
      description: 'Stage hosting keynote panels and flagship debates.'
    },
    {
      id: 'poi-hall-xyz',
      name: 'Hall XYZ Expo',
      category: 'exhibition',
      zoneId: 'hall-xyz',
      nodeId: 'zone-hall-xyz',
      x: 320,
      y: 75,
      subtitle: 'Enterprise & Scaleups'
    },
    {
      id: 'poi-startup-festival',
      name: 'Startup Pitch Arena',
      category: 'stage',
      zoneId: 'startup-festival',
      nodeId: 'zone-startup-festival',
      x: 550,
      y: 320,
      subtitle: 'Early-stage Pitches & VCs'
    },
    {
      id: 'poi-studios',
      name: 'Studios 2 & 3',
      category: 'workshop',
      zoneId: 'studios',
      nodeId: 'zone-studios',
      x: 90,
      y: 320,
      subtitle: 'Deep-dive Labs'
    },
    {
      id: 'poi-grey',
      name: 'Grey Finance',
      category: 'sponsor',
      zoneId: 'atrium',
      nodeId: 'booth-grey',
      x: 320,
      y: 62,
      boothNumber: 'B01',
      subtitle: 'Headline Sponsor • North Atrium',
      description: 'Cross-border payment infrastructure demo & executive lounge.'
    },
    {
      id: 'poi-sabi',
      name: 'Sabi Stand',
      category: 'sponsor',
      zoneId: 'atrium',
      nodeId: 'booth-sabi',
      x: 565,
      y: 240,
      boothNumber: 'B02',
      subtitle: 'East Atrium Junction'
    },
    {
      id: 'poi-accrue',
      name: 'Accrue Stand',
      category: 'sponsor',
      zoneId: 'atrium',
      nodeId: 'booth-accrue',
      x: 472,
      y: 529,
      boothNumber: 'B03',
      subtitle: 'South-East Corridor'
    },
    {
      id: 'poi-breet',
      name: 'Breet Stand',
      category: 'sponsor',
      zoneId: 'atrium',
      nodeId: 'booth-breet',
      x: 168,
      y: 529,
      boothNumber: 'B04',
      subtitle: 'South-West Corridor'
    },
    {
      id: 'poi-sentz',
      name: 'Sentz Stand',
      category: 'sponsor',
      zoneId: 'atrium',
      nodeId: 'booth-sentz',
      x: 75,
      y: 240,
      boothNumber: 'B05',
      subtitle: 'West Atrium Junction'
    }
  ],
  graph: {
    nodes: NODES,
    edges: EDGES
  },
  defaultStartNodeId: 'lobby-south'
}
