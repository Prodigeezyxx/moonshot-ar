import { useState, useRef, useEffect } from 'react'
import { MOONSHOT_SESSIONS } from '../data/sessions'
import { type WhiteLabelVenueConfig } from '../types/venueConfig'

interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  suggestedAction?: {
    type: 'navigate' | 'checkin' | 'filter'
    targetId: string
    targetName: string
    label: string
  }
}

interface AIConciergeModalProps {
  isOpen: boolean
  config: WhiteLabelVenueConfig
  onClose: () => void
  onNavigate: (nodeId: string, name: string) => void
}

export default function AIConciergeModal({
  isOpen,
  config,
  onClose,
  onNavigate
}: AIConciergeModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: "Moonshot Assistant online. Query stage agendas, speaker timings, sponsor booths (Grey, Sabi, Accrue, Breet, Sentz), or request direct navigation vectors.",
      timestamp: 'Ready'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  if (!isOpen) return null

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputValue).trim()
    if (!text) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInputValue('')
    setIsTyping(true)

    // Intelligent NL response processing
    setTimeout(() => {
      const q = text.toLowerCase()
      let replyText = "Query not recognized. Inquire regarding stages (Main Bowl, Hall XYZ, Studios), sponsor booths (Grey, Sabi, Accrue, Breet, Sentz), or session agendas."
      let action: ChatMessage['suggestedAction'] | undefined = undefined

      if (q.includes('grey')) {
        replyText = "Grey Finance is located at Booth B01 (North Atrium corridor near Hall XYZ). Direct route vector available."
        action = { type: 'navigate', targetId: 'booth-grey', targetName: 'Grey Finance Stand', label: 'Route to Grey' }
      } else if (q.includes('sabi')) {
        replyText = "Sabi is located at Booth B02 (North-East Atrium ring adjacent to Startup Festival Arena)."
        action = { type: 'navigate', targetId: 'booth-sabi', targetName: 'Sabi Stand', label: 'Route to Sabi' }
      } else if (q.includes('accrue')) {
        replyText = "Accrue is located at Booth B03 along the South-East corridor."
        action = { type: 'navigate', targetId: 'booth-accrue', targetName: 'Accrue Stand', label: 'Route to Accrue' }
      } else if (q.includes('breet')) {
        replyText = "Breet is located at Booth B04 along the South-West corridor."
        action = { type: 'navigate', targetId: 'booth-breet', targetName: 'Breet Stand', label: 'Route to Breet' }
      } else if (q.includes('sentz')) {
        replyText = "Sentz is located at Booth B05 on the West corridor entrance to Studios 2 & 3."
        action = { type: 'navigate', targetId: 'booth-sentz', targetName: 'Sentz Stand', label: 'Route to Sentz' }
      } else if (q.includes('main stage') || q.includes('main bowl') || q.includes('keynote')) {
        replyText = "Main Stage Bowl is the central 5,000-seat amphitheatre. Access via south center aisle from South Lobby."
        action = { type: 'navigate', targetId: 'zone-main-stage', targetName: 'Main Stage (Bowl)', label: 'Route to Main Stage' }
      } else if (q.includes('pitch') || q.includes('startup festival') || q.includes('vc')) {
        replyText = "Startup Festival Arena is situated in the East Wing. Seed founder pitch sessions occur here."
        action = { type: 'navigate', targetId: 'zone-startup-festival', targetName: 'Startup Festival Arena', label: 'Route to Pitch Arena' }
      } else if (q.includes('workshop') || q.includes('studio') || q.includes('masterclass')) {
        replyText = "Technical Workshops and the Spatial Computing masterclasses are hosted in Studios 2 & 3 (West Wing)."
        action = { type: 'navigate', targetId: 'zone-studios', targetName: 'Studios 2 & 3', label: 'Route to Studios' }
      } else if (q.includes('expo') || q.includes('hall xyz') || q.includes('enterprise')) {
        replyText = "Hall XYZ Exhibition is located in the North Wing, hosting enterprise demos and product showcases."
        action = { type: 'navigate', targetId: 'zone-hall-xyz', targetName: 'Hall XYZ Exhibition', label: 'Route to Hall XYZ' }
      } else if (q.includes('toilet') || q.includes('restroom') || q.includes('bathroom')) {
        replyText = "Restrooms are positioned along the East and West corridors of the outer Atrium Ring."
        action = { type: 'navigate', targetId: 'atrium-sw', targetName: 'West Atrium Restrooms', label: 'Route to Restroom' }
      } else {
        const matchedSession = MOONSHOT_SESSIONS.find((s) =>
          s.title.toLowerCase().includes(q) ||
          s.speakers.some((spk) => spk.name.toLowerCase().includes(q) || spk.company.toLowerCase().includes(q))
        )
        if (matchedSession) {
          replyText = `Session: "${matchedSession.title}" (${matchedSession.startTime} - ${matchedSession.endTime}) at ${matchedSession.stageName}. Direct route vector available.`
          action = { type: 'navigate', targetId: matchedSession.stageNodeId, targetName: matchedSession.stageName, label: `Route to ${matchedSession.stageName}` }
        }
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: action
      }

      setMessages((prev) => [...prev, assistantMsg])
      setIsTyping(false)
    }, 450)
  }

  return (
    <div className="concierge-modal-overlay" onClick={onClose}>
      <div className="concierge-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="concierge-header">
          <div className="concierge-title-group">
            <div className="concierge-status-indicator" />
            <div>
              <h3>AI CONCIERGE</h3>
              <p>Natural Language Venue &amp; Agenda Assistant</p>
            </div>
          </div>
          <button className="concierge-close-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        {/* Query Suggestion Chips */}
        <div className="concierge-quick-prompts">
          <button className="prompt-chip" onClick={() => handleSend("Where is Grey booth?")}>
            Grey Finance
          </button>
          <button className="prompt-chip" onClick={() => handleSend("Where is Startup Festival?")}>
            Pitch Arena
          </button>
          <button className="prompt-chip" onClick={() => handleSend("Main Stage location")}>
            Main Stage
          </button>
          <button className="prompt-chip" onClick={() => handleSend("Studios workshop schedule")}>
            Studios 2 &amp; 3
          </button>
        </div>

        {/* Messages Feed */}
        <div className="concierge-messages-feed" ref={chatScrollRef}>
          {messages.map((m) => (
            <div key={m.id} className={`chat-message-bubble ${m.sender}`}>
              <div className="chat-bubble-content">
                <p>{m.text}</p>
                {m.suggestedAction && (
                  <button
                    className="chat-action-cta"
                    onClick={() => {
                      onNavigate(m.suggestedAction!.targetId, m.suggestedAction!.targetName)
                      onClose()
                    }}
                  >
                    {m.suggestedAction.label} →
                  </button>
                )}
              </div>
              <span className="chat-timestamp">{m.timestamp}</span>
            </div>
          ))}

          {isTyping && (
            <div className="chat-message-bubble assistant typing">
              <div className="typing-dots">
                <span /><span /><span />
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <footer className="concierge-input-bar">
          <input
            type="text"
            placeholder="Type query or destination..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend()
            }}
            className="concierge-text-input"
          />
          <button
            className="concierge-send-btn"
            onClick={() => handleSend()}
            disabled={!inputValue.trim()}
          >
            Submit
          </button>
        </footer>
      </div>
    </div>
  )
}
