export interface Speaker {
  id: string
  name: string
  role: string
  company: string
  avatarUrl?: string
}

export interface ConferenceSession {
  id: string
  title: string
  description: string
  day: 1 | 2
  startTime: string // "09:30"
  endTime: string   // "10:30"
  track: 'Keynote & AI' | 'Fintech & Scale' | 'Founder & Venture' | 'Technical Workshop' | 'Policy & Ecosystem'
  stageNodeId: string
  stageName: string
  speakers: Speaker[]
  isFeatured?: boolean
}

export const MOONSHOT_SESSIONS: ConferenceSession[] = [
  {
    id: 'ses-101',
    title: 'Opening Keynote: Courage, Conviction & Africa’s AI Frontier',
    description: 'Setting the vision for sovereign African AI infrastructure, frontier models, and cross-border innovation.',
    day: 1,
    startTime: '09:00',
    endTime: '10:00',
    track: 'Keynote & AI',
    stageNodeId: 'zone-main-stage',
    stageName: 'Main Stage (Bowl)',
    speakers: [
      { id: 'spk-1', name: 'Dr. Bosun Tijani', role: 'Minister of Communications & Digital Economy', company: 'Federal Republic of Nigeria' },
      { id: 'spk-2', name: 'Tomiwa Aladekomo', role: 'CEO', company: 'Big Cabal Media / TechCabal' }
    ],
    isFeatured: true
  },
  {
    id: 'ses-102',
    title: 'Cross-Border Capital: The Next 5 Years of African FX & Payments',
    description: 'Dissecting treasury ops, stablecoins, multi-currency accounts, and global merchant settlement.',
    day: 1,
    startTime: '10:15',
    endTime: '11:15',
    track: 'Fintech & Scale',
    stageNodeId: 'zone-hall-xyz',
    stageName: 'Hall XYZ Exhibition',
    speakers: [
      { id: 'spk-3', name: 'Idorenyin Obong', role: 'CEO & Co-founder', company: 'Grey Finance' },
      { id: 'spk-4', name: 'Anu Adedoyin Adasolum', role: 'CEO', company: 'Sabi' }
    ]
  },
  {
    id: 'ses-103',
    title: 'Moonshot Pitch Battlefield: Top 10 Seed Founders Live',
    description: '10 vetted early-stage founders pitch live to a panel of Tier-1 pan-African VC partners for syndication prizes.',
    day: 1,
    startTime: '11:30',
    endTime: '13:00',
    track: 'Founder & Venture',
    stageNodeId: 'zone-startup-festival',
    stageName: 'Startup Festival Arena',
    speakers: [
      { id: 'spk-5', name: 'Maya Horgan Famodu', role: 'Founder & Partner', company: 'Ingressive Capital' },
      { id: 'spk-6', name: 'Kola Aina', role: 'Founding Partner', company: 'Ventures Platform' }
    ],
    isFeatured: true
  },
  {
    id: 'ses-104',
    title: 'Spatial Computing & WebXR Wayfinding Masterclass',
    description: 'Deep dive into indoor spatial graphs, visual positioning systems (VPS), and production PWA optimization.',
    day: 1,
    startTime: '14:00',
    endTime: '15:30',
    track: 'Technical Workshop',
    stageNodeId: 'zone-studios',
    stageName: 'Studios 2 & 3',
    speakers: [
      { id: 'spk-7', name: 'Iyobosa Rehoboth', role: 'CEO & Spatial Architect', company: 'Floats XR / RealmSpace' }
    ]
  },
  {
    id: 'ses-105',
    title: 'Decentralized Rails: Crypto, Commodities & Physical Asset Backing',
    description: 'Exploring how on-chain liquidity unlocks physical commodity distribution and B2B trade.',
    day: 1,
    startTime: '15:45',
    endTime: '17:00',
    track: 'Fintech & Scale',
    stageNodeId: 'zone-hall-xyz',
    stageName: 'Hall XYZ Exhibition',
    speakers: [
      { id: 'spk-8', name: 'Chisom Oparaocha', role: 'Head of Product', company: 'Accrue' },
      { id: 'spk-9', name: 'Babatunde Akindele', role: 'VP Growth', company: 'Breet' }
    ]
  },
  {
    id: 'ses-201',
    title: 'Day 2 Keynote: Building Global Tech Giants from Lagos & Nairobi',
    description: 'Unpacking playbook resilience, unit economics, regulatory navigation, and international expansion.',
    day: 2,
    startTime: '09:30',
    endTime: '10:45',
    track: 'Keynote & AI',
    stageNodeId: 'zone-main-stage',
    stageName: 'Main Stage (Bowl)',
    speakers: [
      { id: 'spk-10', name: 'Shola Akinlade', role: 'Co-founder & CEO', company: 'Paystack' },
      { id: 'spk-11', name: 'Iyinoluwa Aboyeji', role: 'Founding Partner', company: 'Future Africa' }
    ],
    isFeatured: true
  },
  {
    id: 'ses-202',
    title: 'AI Engineering Workshop: Fine-tuning Local Language LLMs',
    description: 'Hands-on technical lab exploring Yoruba, Hausa, Igbo, and Swahili dataset curation and inference serving.',
    day: 2,
    startTime: '11:00',
    endTime: '12:30',
    track: 'Technical Workshop',
    stageNodeId: 'zone-studios',
    stageName: 'Studios 2 & 3',
    speakers: [
      { id: 'spk-12', name: 'Dr. Sakinat Folorunso', role: 'Lead AI Researcher', company: 'Lagos AI Lab' }
    ]
  },
  {
    id: 'ses-203',
    title: 'The Sovereign AI Debate: Compute, Policy & Data Centers in Africa',
    description: 'How African governments and cloud providers are building national compute grids and sovereign data laws.',
    day: 2,
    startTime: '14:00',
    endTime: '15:15',
    track: 'Policy & Ecosystem',
    stageNodeId: 'zone-main-stage',
    stageName: 'Main Stage (Bowl)',
    speakers: [
      { id: 'spk-13', name: 'Oswald Osaretin Guobadia', role: 'Senior Policy Advisor', company: 'Digitena' },
      { id: 'spk-14', name: 'Kashifu Inuwa Abdullahi', role: 'Director General', company: 'NITDA' }
    ]
  },
  {
    id: 'ses-204',
    title: 'VC Syndicate Summit & Deal-Making Finale',
    description: 'Closing networking session, investor term sheet announcements, and official Moonshot Awards ceremony.',
    day: 2,
    startTime: '15:30',
    endTime: '17:00',
    track: 'Founder & Venture',
    stageNodeId: 'zone-startup-festival',
    stageName: 'Startup Festival Arena',
    speakers: [
      { id: 'spk-15', name: 'Eloho Omame', role: 'Partner', company: 'TLcom Capital' }
    ],
    isFeatured: true
  }
]
