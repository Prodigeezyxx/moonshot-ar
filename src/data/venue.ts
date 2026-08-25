// Moonshot Wayfinder 2026 — venue data (hand-authored from the architecture
// doc §7: National Theatre Lagos = circular drum, D-shaped bowl, radial wings,
// concentric atrium corridors, 5 sponsor booths).

export interface Zone {
  id: string
  name: string
  color: string
  textColor: string
  description: string
}

export interface Booth {
  id: string
  name: string
  x: number
  y: number
}

export const ZONES: Zone[] = [
  {
    id: 'main-bowl',
    name: 'Main Bowl',
    color: '#3F0F8A',
    textColor: '#FAF3E0',
    description: 'Central stage + D-shaped seating bowl — the hero zone.'
  },
  {
    id: 'hall-xyz',
    name: 'Hall XYZ',
    color: '#2E9D8F',
    textColor: '#FAF3E0',
    description: 'Outer wing, exhibition booths.'
  },
  {
    id: 'startup-festival',
    name: 'Startup Festival',
    color: '#E85D3F',
    textColor: '#FAF3E0',
    description: 'Outer wing, pitch stage + demo area.'
  },
  {
    id: 'studios',
    name: 'Studios 2 & 3',
    color: '#9AD5B1',
    textColor: '#111827',
    description: 'Outer wings, distinct room configs.'
  },
  {
    id: 'atrium',
    name: 'Atrium Ring',
    color: '#EDE7F9',
    textColor: '#111827',
    description: 'Concentric corridors + sponsor booths.'
  }
]

// Five sponsor booths placed on the atrium ring (r ≈ 258 around the centre).
export const BOOTHS: Booth[] = [
  { id: 'grey', name: 'Grey', x: 320, y: 62 },
  { id: 'sabi', name: 'Sabi', x: 565, y: 240 },
  { id: 'accrue', name: 'Accrue', x: 472, y: 529 },
  { id: 'breet', name: 'Breet', x: 168, y: 529 },
  { id: 'sentz', name: 'Sentz', x: 75, y: 240 }
]

export const zoneById = (id: string): Zone =>
  ZONES.find((z) => z.id === id) ?? ZONES[0]
