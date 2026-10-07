# Aura Skincare — AI Voice Customer Support Agent

Aura Skincare is a browser-based AI customer support voice agent built as an internship assessment project.

The agent, **Aria**, acts as a friendly and professional customer support specialist. Users can speak naturally through their browser microphone, and Aria responds by voice.

## Live Demo

- **Live App:** https://ai-voice-agent-cxpa.onrender.com
- **GitHub:** https://github.com/Namrata9908/AI-Voice-Agent

---

## Features

- Browser-based voice conversation
- Microphone input using the browser
- Speech-to-text using the browser Speech Recognition API
- AI-generated customer support responses using Google Gemini
- Text-to-speech responses using the browser Speech Synthesis API
- Order lookup using mock Aura Skincare order data
- Delivery status and tracking information
- Return and damaged-product policy support
- Out-of-scope query handling
- Live conversation transcript
- Structured post-call summary
- Sample order testing helper

---

## Example Orders

| Order ID | Customer | Status | Tracking | ETA |
|---|---|---|---|---|
| ORD-101 | Priya Sharma | Out for Delivery | BD-982103 | Expected by 6 PM today |
| ORD-102 | Rahul Verma | Delivered | Available | Delivered |
| ORD-103 | Ananya Patel | Processing | Not available | Processing |

---

## Aura Skincare Policies

The agent follows these provided business rules:

- Delivery normally takes up to 7 days.
- Returns are accepted only for unopened and unused products.
- Damaged or defective products must be reported within 48 hours.
- Questions unrelated to Aura Skincare are politely declined.

The agent is instructed not to invent order details, tracking numbers, delivery dates, customer information, policies, refunds, or product information.

---

## Architecture

```text
Browser
   |
   | Microphone
   v
Speech Recognition API
   |
   | Customer message
   v
Express Backend
   |
   | Order lookup
   | Aura policies
   | Conversation history
   v
Google Gemini
   |
   | Aria response
   v
Browser
   |
   | Speech Synthesis
   v
Customer
```

### Main Components

**Frontend**
- React
- Vite
- JavaScript
- CSS
- Browser Speech Recognition API
- Browser Speech Synthesis API

**Backend**
- Node.js
- Express
- Google Gemini API
- Mock order lookup

**Deployment**
- Render

---

## Why This Stack?

I chose React and Vite for the frontend because they provide a lightweight setup for building an interactive browser application quickly.

The browser's native Speech Recognition API and Speech Synthesis API were used for the voice layer. This keeps the voice interaction simple and avoids requiring a separate paid voice service.

Node.js and Express provide a small backend layer for securely handling the Gemini API key and business logic such as order lookup.

Google Gemini is used for natural-language response generation while the backend provides the relevant Aura Skincare information and order data to reduce hallucination.

Render was selected for deployment because it provides a simple free deployment option for the Node.js application.

---

## How Order Lookup Works

When a customer mentions an order ID, the backend checks the mock order database.

For example:

```text
Customer:
"What is the status of order ORD-101?"

Backend:
Looks up ORD-101

System:
Priya Sharma
Out for Delivery
Tracking: BD-982103
Expected by 6 PM today

Aria:
"Hi Priya Sharma! Your order is currently out for delivery
with tracking number BD-982103, and it's expected by 6 PM today."
```

If an order does not exist, Aria informs the customer that the order could not be found rather than inventing information.

---

## Out-of-Scope Handling

Aria is restricted to Aura Skincare customer support.

For example, if a customer asks:

> "Can you book me a flight from Mumbai to Delhi?"

Aria responds that she can only help with Aura Skincare-related queries.

This prevents the agent from pretending to provide services outside its intended role.

---

## Hardest Part

The hardest part was connecting the browser voice interaction with the backend AI response while keeping the conversation natural.

The solution was to separate the flow into clear stages:

1. Browser requests microphone access.
2. Speech Recognition converts the customer's speech into text.
3. The frontend sends the text and conversation history to the backend.
4. The backend performs order lookup when required.
5. Gemini generates the response using the provided Aura Skincare rules and order information.
6. The response is returned to the browser.
7. Browser Speech Synthesis speaks the response.
8. The interface returns to the listening state.

This separation made the application easier to debug and kept business logic on the backend.

---

## Testing

The deployed application was tested with:

### Order Status

Customer asks for `ORD-101`.

Expected behavior:
- Identify the order.
- Provide customer name.
- Provide order status.
- Provide tracking number.
- Provide ETA.

### Return Request

Customer asks about returning an unopened and unused product.

Expected behavior:
- Explain the return policy.
- Ask for the order ID when order details are required.

### Damaged Product

Customer reports receiving a damaged product.

Expected behavior:
- Explain that damaged/defective products must be reported within 48 hours.
- Ask for the order ID.

### Out-of-Scope Request

Customer asks Aria to book a flight.

Expected behavior:
- Politely refuse because flight booking is unrelated to Aura Skincare support.

---

## First Improvement With One More Week

With one additional week, I would improve the voice experience first.

The current implementation uses browser-native speech recognition and speech synthesis. I would replace or enhance this with a dedicated real-time voice pipeline that provides:

- More natural conversational turn-taking
- Better interruption handling
- Lower latency
- More consistent voice quality
- Better handling of background noise
- More reliable speech recognition across browsers

I would also add stronger structured conversation analytics and automated evaluation of support conversations.

---

## Scaling to 1,000 Conversations Per Day

To scale the system to approximately 1,000 conversations per day, I would separate the application into independently scalable components:

```text
Browser
   |
Load Balancer
   |
API / Voice Gateway
   |
+----------------------+
|                      |
Order Service      AI Service
|                      |
Database           Gemini API
|
Order Data
```

The next steps would include:

- Moving mock orders to a persistent database.
- Adding authentication and rate limiting.
- Using asynchronous logging for conversation records.
- Adding monitoring and error tracking.
- Caching frequently requested order information.
- Adding request retries and timeout handling.
- Separating frontend, API, and AI workloads when traffic increases.
- Tracking AI latency, error rate, and conversation completion rate.

The application could then scale horizontally by running multiple backend instances behind a load balancer.

---

## Project Structure

```text
aura-ai-voice-agent/
│
├── server/
│   └── index.js
│
├── src/
│   ├── App.jsx
│   ├── App.css
│   └── index.css
│
├── public/
├── package.json
├── vite.config.js
└── README.md
```

---

## Running Locally

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Build the frontend:

```bash
npm run build
```

Start the application:

```bash
npm start
```

The application will be available at:

```text
http://localhost:5000
```

---

## Environment Variables

The application requires:

```env
GEMINI_API_KEY=your_gemini_api_key
```

The API key should never be committed to GitHub.

---

## Conclusion

Aura Skincare's AI Voice Customer Support Agent demonstrates a complete browser-to-AI support workflow:

**Voice input → Speech recognition → Backend business logic → Gemini → Voice response → Structured call summary**

The project focuses on practical customer-support behavior, controlled business information, out-of-scope handling, and a simple deployable architecture.
