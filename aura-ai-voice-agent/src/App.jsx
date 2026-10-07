import { useRef, useState } from 'react'
import './App.css'

const orders = [
  {
    id: 'ORD-101',
    customer: 'Priya Sharma',
    status: 'Out for Delivery',
    tracking: 'BD-982103',
    eta: 'Expected by 6 PM today',
  },
  {
    id: 'ORD-102',
    customer: 'Rahul Verma',
    status: 'Delivered',
    tracking: 'Available',
    eta: 'Delivered',
  },
  {
    id: 'ORD-103',
    customer: 'Ananya Patel',
    status: 'Processing',
    tracking: 'Not available',
    eta: 'Processing',
  },
]

function App() {
  const [callActive, setCallActive] = useState(false)
  const [status, setStatus] = useState('Ready')
  const micStreamRef = useRef(null)

  const [transcript, setTranscript] = useState('')
  const [ariaReply, setAriaReply] = useState('')
  const [callSummary, setCallSummary] = useState(null)

  const [conversation, setConversation] = useState([])
  const conversationRef = useRef([])

  const recognitionRef = useRef(null)

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      micStreamRef.current = stream

      setCallActive(true)
      setStatus('Listening')
      setCallSummary(null)

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition

      if (!SpeechRecognition) {
        setStatus('Speech recognition not supported')
        return
      }

      const recognition = new SpeechRecognition()

      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-IN'

      recognition.onresult = async (event) => {
        let text = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript
        }

        setTranscript(text)

        if (event.results[event.results.length - 1].isFinal) {
          try {
            setStatus('Thinking')

            const history = conversationRef.current

            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: text,
                history,
              }),
            })

            const data = await response.json()

            if (data.success) {
              setAriaReply(data.reply)

              const updatedConversation = [
                ...conversationRef.current,
                {
                  role: 'customer',
                  content: text,
                },
                {
                  role: 'aria',
                  content: data.reply,
                },
              ]

              conversationRef.current = updatedConversation
              setConversation(updatedConversation)

              setStatus('Speaking')

              const speech = new SpeechSynthesisUtterance(data.reply)

              speech.lang = 'en-IN'
              speech.rate = 0.95
              speech.pitch = 1

              speech.onend = () => {
                setStatus('Listening')
              }

              window.speechSynthesis.cancel()
              window.speechSynthesis.speak(speech)
            } else {
              setAriaReply('Sorry, I could not process that request.')
              setStatus('Listening')
            }
          } catch (error) {
            console.error('Backend error:', error)

            setAriaReply('Sorry, I could not connect to Aria.')
            setStatus('Listening')
          }
        }
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (error) {
      console.error('Microphone permission error:', error)
      setStatus('Microphone blocked')
    }
  }

  const endCall = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop())
      micStreamRef.current = null
    }

    const lastCustomerMessage = [...conversationRef.current]
      .reverse()
      .find((message) => message.role === 'customer')

    const customerText = lastCustomerMessage?.content || ''

    const orderMatch = customerText.match(/\b(?:ORD[-\s]?)?(\d{3})\b/i)

    const orderId = orderMatch ? `ORD-${orderMatch[1]}` : null

    const fullConversation = conversationRef.current
      .map((message) => `${message.role}: ${message.content}`)
      .join(' | ')

    setCallSummary({
      customer_intent: orderId ? 'Order support' : 'Customer support',
      order_id: orderId || 'Not provided',
      resolution_status: 'Resolved',
      call_summary:
        fullConversation ||
        'Customer contacted Aura Skincare customer support.',
    })

    setCallActive(false)
    setStatus('Ready')
  }

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">AURA SKINCARE</p>
          <h1>AI Customer Support</h1>
        </div>

        <div className="agent-badge">
          <span className="status-dot" />
          <span>Aria</span>
        </div>
      </header>

      <section className="dashboard">
        <div className="main-column">
          <section className="card call-card">
            <div className="card-heading">
              <div>
                <p className="section-label">VOICE SUPPORT</p>

                <h2>Talk to Aria</h2>

                <p className="muted">
                  Your AI customer support specialist from Aura Skincare.
                </p>
              </div>

              <span className={`state-pill ${callActive ? 'active' : ''}`}>
                {status}
              </span>
            </div>

            <div className="voice-orb">
              <div className="orb-ring">
                <div className="orb">
                  <span className="mic-icon">🎙</span>
                </div>
              </div>

              <p className="orb-title">
                {callActive ? 'Aria is listening...' : 'Ready to help'}
              </p>

              <p className="orb-subtitle">
                {callActive
                  ? 'Speak naturally. Aria will respond by voice.'
                  : 'Start a call to begin your conversation.'}
              </p>
            </div>

            <div className="call-actions">
              <button
                className="primary-button"
                type="button"
                onClick={startCall}
                disabled={callActive}
              >
                Start Call
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={endCall}
                disabled={!callActive}
              >
                End Call
              </button>
            </div>
          </section>

          <section className="card transcript-card">
            <div className="card-heading">
              <div>
                <p className="section-label">CONVERSATION</p>
                <h2>Transcript</h2>
              </div>

              <span className="small-label">Live</span>
            </div>

            <div className="empty-state">
              <div className="empty-icon">💬</div>

              {conversation.length > 0 ? (
                <div className="conversation">
                  {conversation.map((message, index) => (
                    <div
                      className="conversation-message"
                      key={`${message.role}-${index}`}
                    >
                      <h3>
                        {message.role === 'customer' ? 'Customer' : 'Aria'}
                      </h3>

                      <p>{message.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <h3>No conversation yet</h3>

                  <p>
                    Start a call and speak naturally. Your words will appear
                    here.
                  </p>
                </>
              )}
            </div>
          </section>
        </div>

        <aside className="side-column">
          <section className="card helper-card">
            <div className="card-heading">
              <div>
                <p className="section-label">DEMO TOOL</p>
                <h2>Test Orders</h2>
              </div>
            </div>

            <p className="muted">
              Use these sample orders while testing the agent.
            </p>

            <div className="orders">
              {orders.map((order) => (
                <article className="order" key={order.id}>
                  <div className="order-top">
                    <strong>{order.id}</strong>

                    <span className="order-status">{order.status}</span>
                  </div>

                  <p>{order.customer}</p>

                  <div className="order-details">
                    <span>{order.tracking}</span>
                    <span>{order.eta}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="card summary-card">
            <div className="card-heading">
              <div>
                <p className="section-label">AFTER CALL</p>
                <h2>Call Summary</h2>
              </div>
            </div>

            <div className="summary-placeholder">
              {callSummary ? (
                <div className="json-preview">
                  <span>{'{'}</span>

                  <span>
                    &nbsp;&nbsp;"customer_intent": "
                    {callSummary.customer_intent}",
                  </span>

                  <span>
                    &nbsp;&nbsp;"order_id": "{callSummary.order_id}",
                  </span>

                  <span>
                    &nbsp;&nbsp;"resolution_status": "
                    {callSummary.resolution_status}",
                  </span>

                  <span>
                    &nbsp;&nbsp;"call_summary": "{callSummary.call_summary}"
                  </span>

                  <span>{'}'}</span>
                </div>
              ) : (
                <p>Structured summary will appear here after the call.</p>
              )}
            </div>
          </section>
        </aside>
      </section>
    </main>
  )
}

export default App