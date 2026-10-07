import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GoogleGenAI } from '@google/genai'

const app = express()

// --------------------------------------------------
// Basic configuration
// --------------------------------------------------

app.use(cors())
app.use(express.json())

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const distPath = path.join(__dirname, '..', 'dist')

// --------------------------------------------------
// Gemini
// --------------------------------------------------

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

// --------------------------------------------------
// Mock order database
// --------------------------------------------------

const orders = {
  'ORD-101': {
    order_id: 'ORD-101',
    customer: 'Priya Sharma',
    status: 'Out for Delivery',
    tracking: 'BD-982103',
    eta: 'Expected by 6 PM today',
  },

  'ORD-102': {
    order_id: 'ORD-102',
    customer: 'Rahul Verma',
    status: 'Delivered',
    tracking: 'Available',
    eta: 'Delivered',
  },

  'ORD-103': {
    order_id: 'ORD-103',
    customer: 'Ananya Patel',
    status: 'Processing',
    tracking: 'Not available',
    eta: 'Processing',
  },
}

function getOrderDetails(orderId) {
  const normalizedId = orderId.toUpperCase().trim()

  return orders[normalizedId] || null
}

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Aura backend is running',
  })
})

// --------------------------------------------------
// Gemini test endpoint
// --------------------------------------------------

app.get('/api/test-gemini', async (req, res) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: `
You are Aria, the AI customer support specialist for Aura Skincare.

Your personality:
- Friendly and professional
- Concise and natural
- Helpful, but never make up information
- Speak like a real customer support representative

Aura Skincare policies:
- Orders can be checked using the order details provided by the system.
- Delivery normally takes up to 7 days.
- Returns are accepted only for unopened and unused products.
- Damaged or defective products must be reported within 48 hours.
- For questions outside Aura Skincare support, politely say that you can only help with Aura Skincare-related queries.

For now, simply respond as Aria.
`,
    })

    res.json({
      success: true,
      reply: response.text,
    })
  } catch (error) {
    console.error('Gemini error:', error)

    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// --------------------------------------------------
// Main chat endpoint
// --------------------------------------------------

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      })
    }

    // Look for an order ID in the CURRENT message only.
    // This allows the customer to switch between ORD-101,
    // ORD-102 and ORD-103 during the same conversation.
    const orderMatch = message.match(
      /\b(?:ORD[-\s]?)?(\d{3})\b/i
    )

    let orderDetails = null

    if (orderMatch) {
      const orderId = `ORD-${orderMatch[1]}`
      orderDetails = getOrderDetails(orderId)
    }

    const safeHistory = Array.isArray(history) ? history : []

    const conversationHistory = safeHistory
      .map((item) => {
        return `${item.role}: ${item.content}`
      })
      .join('\n')

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: `
You are Aria, the AI customer support specialist for Aura Skincare.

Your personality:
- Friendly and professional
- Concise and natural
- Helpful
- Never make up information.

IMPORTANT RULES:

1. You are only an Aura Skincare customer support agent.

2. You must only use the information provided in this prompt.

3. Never invent:
   - order details
   - tracking numbers
   - delivery dates
   - customer names
   - policies
   - refunds
   - product information

4. If an order is found, directly tell the customer:
   - customer name
   - order status
   - tracking number
   - ETA

5. If an order ID is provided but does not exist, politely say that the order could not be found.

6. Never ask for an email address when an order ID has already been provided.

7. You can help only with Aura Skincare-related questions.

8. For unrelated questions, politely explain that you can only help with Aura Skincare-related queries.

9. Delivery normally takes up to 7 days.

10. Returns are accepted only for unopened and unused products.

11. Damaged or defective products must be reported within 48 hours.

12. Keep responses concise because you are speaking to the customer by voice.

Conversation history:
${conversationHistory || 'No previous conversation.'}

Current customer message:
${message}

Order information from Aura's system:
${orderDetails
          ? JSON.stringify(orderDetails)
          : 'No matching order was found.'
        }

Reply naturally as Aria.
`,
    })

    res.json({
      success: true,
      reply: response.text,
      order: orderDetails,
    })
  } catch (error) {
    console.error('Chat error:', error)

    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// --------------------------------------------------
// Serve React production build
// --------------------------------------------------

app.use(express.static(distPath))

// React SPA fallback.
// API routes above have already been handled.
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) {
    return next()
  }

  res.sendFile(path.join(distPath, 'index.html'))
})

// --------------------------------------------------
// Server
// --------------------------------------------------

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Aura backend running on port ${PORT}`)
})