// Venue Navigation Graph for National Theatre Lagos (Moonshot 2026)
// Coordinated in SVG space (Canvas: 640x640, Center: 320,320)

export interface GraphNode {
  id: string
  name: string
  x: number
  y: number
  type: 'entrance' | 'junction' | 'zone' | 'booth' | 'landmark'
  zoneId?: string
  landmarkName?: string
}

export interface GraphEdge {
  from: string
  to: string
  weight: number // distance in meters (~1 SVG unit ≈ 0.25 meters)
  instructions?: string
}

export const NODES: Record<string, GraphNode> = {
  // Entrances / Main Lobby (South)
  'entrance-main': { id: 'entrance-main', name: 'Main Lobby Entrance', x: 320, y: 560, type: 'entrance', zoneId: 'atrium' },
  'lobby-south': { id: 'lobby-south', name: 'South Lobby Junction', x: 320, y: 500, type: 'junction', zoneId: 'atrium', landmarkName: 'Main Entrance' },

  // Outer Atrium Ring Junctions
  'atrium-sw': { id: 'atrium-sw', name: 'South-West Corridor', x: 195, y: 470, type: 'junction', zoneId: 'atrium' },
  'atrium-se': { id: 'atrium-se', name: 'South-East Corridor', x: 445, y: 470, type: 'junction', zoneId: 'atrium' },
  'atrium-west': { id: 'atrium-west', name: 'West Atrium Junction', x: 120, y: 320, type: 'junction', zoneId: 'atrium', landmarkName: 'Studios Wing' },
  'atrium-east': { id: 'atrium-east', name: 'East Atrium Junction', x: 520, y: 320, type: 'junction', zoneId: 'atrium', landmarkName: 'Startup Festival Wing' },
  'atrium-nw': { id: 'atrium-nw', name: 'North-West Corridor', x: 195, y: 170, type: 'junction', zoneId: 'atrium' },
  'atrium-ne': { id: 'atrium-ne', name: 'North-East Corridor', x: 445, y: 170, type: 'junction', zoneId: 'atrium' },
  'atrium-north': { id: 'atrium-north', name: 'North Atrium Junction', x: 320, y: 140, type: 'junction', zoneId: 'atrium', landmarkName: 'Hall XYZ Archway' },

  // Inner Ring / Main Bowl Access
  'bowl-south': { id: 'bowl-south', name: 'Main Bowl South Gate', x: 320, y: 440, type: 'junction', zoneId: 'main-bowl' },
  'bowl-east': { id: 'bowl-east', name: 'Main Bowl East Gate', x: 440, y: 320, type: 'junction', zoneId: 'main-bowl' },
  'bowl-west': { id: 'bowl-west', name: 'Main Bowl West Gate', x: 200, y: 320, type: 'junction', zoneId: 'main-bowl' },
  'bowl-north': { id: 'bowl-north', name: 'Main Bowl North Stage Access', x: 320, y: 200, type: 'junction', zoneId: 'main-bowl' },
  'zone-main-stage': { id: 'zone-main-stage', name: 'Main Bowl (Stage)', x: 320, y: 290, type: 'zone', zoneId: 'main-bowl', landmarkName: 'Central Stage' },

  // Outer Zones
  'zone-hall-xyz': { id: 'zone-hall-xyz', name: 'Hall XYZ Exhibition', x: 320, y: 75, type: 'zone', zoneId: 'hall-xyz', landmarkName: 'Exhibition Hall' },
  'zone-startup-festival': { id: 'zone-startup-festival', name: 'Startup Festival Arena', x: 550, y: 320, type: 'zone', zoneId: 'startup-festival', landmarkName: 'Pitch Stage' },
  'zone-studios': { id: 'zone-studios', name: 'Studios 2 & 3', x: 90, y: 320, type: 'zone', zoneId: 'studios', landmarkName: 'Workshop Rooms' },

  // Sponsor Booths (Atrium Ring)
  'booth-grey': { id: 'booth-grey', name: 'Grey Finance Booth', x: 320, y: 62, type: 'booth', zoneId: 'atrium', landmarkName: 'Grey Stand' },
  'booth-sabi': { id: 'booth-sabi', name: 'Sabi Booth', x: 565, y: 240, type: 'booth', zoneId: 'atrium', landmarkName: 'Sabi Stand' },
  'booth-accrue': { id: 'booth-accrue', name: 'Accrue Booth', x: 472, y: 529, type: 'booth', zoneId: 'atrium', landmarkName: 'Accrue Stand' },
  'booth-breet': { id: 'booth-breet', name: 'Breet Booth', x: 168, y: 529, type: 'booth', zoneId: 'atrium', landmarkName: 'Breet Stand' },
  'booth-sentz': { id: 'booth-sentz', name: 'Sentz Booth', x: 75, y: 240, type: 'booth', zoneId: 'atrium', landmarkName: 'Sentz Stand' }
}

// Distance helper
function dist(n1: GraphNode, n2: GraphNode): number {
  const dx = n1.x - n2.x
  const dy = n1.y - n2.y
  // Scale factor: 1 SVG pixel ≈ 0.25 meters
  return Math.round(Math.sqrt(dx * dx + dy * dy) * 0.25)
}

function link(from: string, to: string, instructions?: string): GraphEdge[] {
  const n1 = NODES[from]
  const n2 = NODES[to]
  if (!n1 || !n2) throw new Error(`Invalid edge: ${from} <-> ${to}`)
  const weight = Math.max(2, dist(n1, n2))
  return [
    { from, to, weight, instructions },
    { from: to, to: from, weight, instructions }
  ]
}

export const EDGES: GraphEdge[] = [
  // Entrance to South Lobby
  ...link('entrance-main', 'lobby-south', 'Enter through the main arches into the South Lobby'),

  // South Lobby to Outer Atrium Ring
  ...link('lobby-south', 'atrium-sw', 'Head west along the outer corridor'),
  ...link('lobby-south', 'atrium-se', 'Head east along the outer corridor'),
  ...link('lobby-south', 'bowl-south', 'Proceed straight toward the Main Bowl southern entrance'),

  // Ring: South-West to West
  ...link('atrium-sw', 'booth-breet', 'Pass by the Breet booth'),
  ...link('booth-breet', 'atrium-west', 'Continue up the west corridor towards the Studios'),
  ...link('atrium-sw', 'bowl-south', 'Turn towards the inner seating circle'),

  // Ring: West to North-West & Studios
  ...link('atrium-west', 'booth-sentz', 'Pass the Sentz booth'),
  ...link('booth-sentz', 'atrium-nw', 'Continue along the north-west corridor'),
  ...link('atrium-west', 'zone-studios', 'Enter the Studios 2 & 3 wing'),
  ...link('atrium-west', 'bowl-west', 'Turn into the Main Bowl west entrance'),

  // Ring: North-West to North & Hall XYZ
  ...link('atrium-nw', 'atrium-north', 'Head toward the North Grand Arch'),
  ...link('atrium-north', 'booth-grey', 'Pass the Grey Finance headline pavilion'),
  ...link('atrium-north', 'zone-hall-xyz', 'Enter the Hall XYZ Exhibition gates'),
  ...link('atrium-north', 'bowl-north', 'Access backstage / north stage entrance'),

  // Ring: North to North-East
  ...link('atrium-north', 'atrium-ne', 'Follow the north-east atrium corridor'),
  ...link('atrium-ne', 'booth-sabi', 'Pass the Sabi booth'),
  ...link('booth-sabi', 'atrium-east', 'Approach the Startup Festival wing'),

  // Ring: East to South-East & Startup Festival
  ...link('atrium-east', 'zone-startup-festival', 'Enter the Startup Festival Pitch Arena'),
  ...link('atrium-east', 'bowl-east', 'Turn into the Main Bowl east entrance'),
  ...link('atrium-east', 'atrium-se', 'Head down the south-east corridor'),
  ...link('atrium-se', 'booth-accrue', 'Pass the Accrue booth'),
  ...link('booth-accrue', 'lobby-south', 'Arrive back at the South Lobby'),

  // Inner Bowl Connections
  ...link('bowl-south', 'zone-main-stage', 'Walk down the center aisle towards the Main Stage'),
  ...link('bowl-east', 'zone-main-stage', 'Walk down the east tiered aisle to the stage'),
  ...link('bowl-west', 'zone-main-stage', 'Walk down the west tiered aisle to the stage'),
  ...link('bowl-north', 'zone-main-stage', 'Step onto the Main Stage from backstage')
]
