// White-Label Configuration Types for Modular Indoor Navigation Engine

export interface ThemeConfig {
  primary: string        // Main header & accent color
  primaryText: string
  background: string     // Canvas/body background
  surface: string        // Cards and modals
  surfaceText: string
  accent: string         // CTA buttons & highlight (e.g. Action Yellow)
  accentText: string
  navLine: string        // Route path glow/color
  navLineGlow: string
  zoneColors: Record<string, { bg: string; text: string; border?: string }>
}

export interface POIItem {
  id: string
  name: string
  category: 'stage' | 'sponsor' | 'amenity' | 'workshop' | 'exhibition' | 'food'
  zoneId: string
  nodeId: string
  x: number
  y: number
  subtitle?: string
  description?: string
  logoUrl?: string
  boothNumber?: string
  tags?: string[]
}

export interface ZoneSector {
  id: string
  name: string
  type: 'amphitheatre' | 'sector' | 'room' | 'corridor'
  // Center, radius or polygon coordinates
  cx?: number
  cy?: number
  rIn?: number
  rOut?: number
  a1?: number
  a2?: number
  points?: string
  description: string
  colorKey: string
}

export interface VenueGraphConfig {
  nodes: Record<string, {
    id: string
    name: string
    x: number
    y: number
    type: 'entrance' | 'junction' | 'zone' | 'booth' | 'landmark'
    zoneId?: string
    landmarkName?: string
  }>
  edges: Array<{
    from: string
    to: string
    weight: number
    instructions?: string
  }>
}

export interface WhiteLabelVenueConfig {
  id: string
  name: string
  tagline: string
  locationName: string
  poweredBy?: string
  theme: ThemeConfig
  dimensions: { width: number; height: number; defaultCenter: { x: number; y: number } }
  zones: ZoneSector[]
  pois: POIItem[]
  graph: VenueGraphConfig
  defaultStartNodeId: string
}
