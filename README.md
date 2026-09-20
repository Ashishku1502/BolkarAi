# Bolkar AI — MVP: Ask Anything About Any Business

A working slice of the Bolkar AI pitch deck: a text/voice Q&A engine that
answers questions about businesses, products, and professionals, grounded
only in verified listings stored in MongoDB (simple retrieval-augmented
generation using Claude).

```
you ask → Mongo text search finds matching listing(s) → Claude answers
          using ONLY that context → answer + source chips returned
```

## Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), Anthropic SDK (Claude)
- **Frontend:** React (Vite), plain CSS, browser SpeechRecognition API for voice input

## Prerequisites

- Node.js 18+
- MongoDB running locally, **or** a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- An [Anthropic API key](https://console.anthropic.com/settings/keys)

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGODB_URI and ANTHROPIC_API_KEY
npm run seed    # loads 5 sample listings (Hero Splendor, Creta, Hyryder, a lawyer, an insurance plan)
npm run dev     # starts on http://localhost:5000
```

Check it's alive: `curl http://localhost:5000/api/health` → `{"status":"ok"}`

## 2. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env   # defaults are fine for local dev
npm run dev             # starts on http://localhost:5173
```

Open http://localhost:5173, try one of the suggestion chips (e.g. "Compare
Creta vs Hyryder") or click the mic icon and ask out loud (Chrome/Edge only).

## How the RAG loop works right now

1. `POST /api/ask { question }` hits the backend.
2. `Business.find({ $text: { $search: question } })` runs a MongoDB text
   search across name/category/tags/description — this is the retrieval
   step, deliberately simple for the MVP.
3. The top matches are formatted into a context block and sent to Claude
   with a system prompt that forbids answering outside that context.
4. The answer + the source listings (with a "verified" flag) come back
   together, so the UI can show what the answer is grounded in.

## Adding your own listings

```bash
curl -X POST http://localhost:5000/api/business \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Business Name",
    "category": "Restaurant",
    "description": "...",
    "facts": { "Cuisine": "North Indian", "Avg Cost": "₹800 for two" },
    "verified": true
  }'
```

## What's deliberately NOT built yet (per the pitch deck roadmap)

These are the next MVPs to layer on, roughly in build order:

1. **Business dashboard** — claim/edit a listing, ownership verification,
   "last updated" timestamp shown to users.
2. **Vector search (Pinecone / Atlas Vector Search)** — swap the Mongo
   `$text` search in `src/routes/ask.js` for embeddings once the catalog
   is too big for keyword matching to find the right listing reliably.
3. **Auth** — business owners vs. consumers, admin verification queue.
4. **AI comparison mode** — structured side-by-side tables, not just
   prose, when a question names two+ businesses.
5. **Multilingual support** — pass a `lang` param through to the prompt.
6. **Analytics dashboard** — log every `/api/ask` call (question,
   matched business, timestamp) to a collection, then chart it.
7. **Enterprise API / API licensing** — API-key auth + rate limiting on
   these same routes.

## Project structure

```
bolkar-ai-mvp/
├── backend/
│   ├── server.js              Express app entry point
│   ├── src/
│   │   ├── config/db.js       MongoDB connection
│   │   ├── models/Business.js Listing schema
│   │   ├── routes/ask.js      Core Q&A endpoint (retrieval + Claude call)
│   │   ├── routes/business.js Search / add / fetch listings
│   │   ├── services/aiService.js  Claude prompt + call
│   │   └── seed/seedData.js   Sample data loader
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx             Page layout, calls the API
    │   ├── components/AskBox.jsx      Text input + voice + suggestions
    │   ├── components/VoiceButton.jsx Browser speech-to-text
    │   └── components/AnswerCard.jsx  Answer + source chips
    └── .env.example
```
