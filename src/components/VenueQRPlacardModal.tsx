import { useState } from 'react'
import { type WhiteLabelVenueConfig } from '../types/venueConfig'

interface VenueQRPlacardModalProps {
  isOpen: boolean
  config: WhiteLabelVenueConfig
  onClose: () => void
}

export default function VenueQRPlacardModal({
  isOpen,
  config,
  onClose
}: VenueQRPlacardModalProps) {
  const [activeTab, setActiveTab] = useState<'zones' | 'booths'>('zones')

  if (!isOpen) return null

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'

  const items = activeTab === 'zones'
    ? config.zones.map((z) => ({
        id: z.id,
        name: z.name,
        desc: z.description,
        param: `zone=${z.id}`,
        type: 'ZONE'
      }))
    : config.pois
        .filter((p) => p.category === 'sponsor')
        .map((p) => ({
          id: p.id,
          name: p.name,
          desc: p.subtitle || 'Sponsor Stand Placard',
          param: `booth=${p.id.replace('poi-', '').replace('booth-', '')}`,
          type: 'SPONSOR HUB'
        }))

  return (
    <div className="qr-placard-overlay" onClick={onClose}>
      <div className="qr-placard-modal" onClick={(e) => e.stopPropagation()}>
        <header className="placard-header">
          <div>
            <h2>PHYSICAL VENUE QR PLACARDS</h2>
            <p className="placard-sub">
              Printable / Scannable Placards for Onsite Installation at National Theatre
            </p>
          </div>
          <button className="placard-close-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        {/* Tab Controls */}
        <div className="placard-tab-bar">
          <button
            className={`placard-tab ${activeTab === 'zones' ? 'active' : ''}`}
            onClick={() => setActiveTab('zones')}
          >
            🏛️ Key Zone Placards ({config.zones.length})
          </button>
          <button
            className={`placard-tab ${activeTab === 'booths' ? 'active' : ''}`}
            onClick={() => setActiveTab('booths')}
          >
            ⭐ Sponsor Booth Placards (5)
          </button>
        </div>

        {/* Placards Grid */}
        <div className="placard-cards-grid">
          {items.map((item) => {
            const scanUrl = `${baseUrl}/?${item.param}`
            // High-reliability QR code SVG service
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
              scanUrl
            )}&bgcolor=FAF3E0&color=111827&margin=4`

            return (
              <div key={item.id} className="placard-print-card">
                <div className="placard-type-tag">{item.type}</div>
                <h3 className="placard-title">{item.name}</h3>
                <p className="placard-desc">{item.desc}</p>

                <div className="placard-qr-wrap">
                  <img src={qrImageUrl} alt={`QR for ${item.name}`} className="placard-qr-img" />
                </div>

                <div className="placard-deep-url">
                  <code>?{item.param}</code>
                </div>

                <div className="placard-instructions">
                  <span>📷 Scan with Moonshot Wayfinder to Check In (+50 XP)</span>
                </div>
              </div>
            )
          })}
        </div>

        <footer className="placard-footer">
          <button
            className="btn primary print-btn"
            onClick={() => window.print()}
          >
            🖨️ Print Venue Placard Sheet
          </button>
          <button className="btn" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  )
}
