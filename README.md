# Slate — AI Habit Tracker

> *Build streaks. Earn XP. Get coached by AI that actually knows your data.*

Built for a hackathon in ~48 hours. Slate is a habit tracker that combines gamification, analytics, and a RAG-powered AI coach so you stop getting generic advice and start getting coached on *your* actual data.

---

## What it does

You log habits daily. Every completion earns XP, builds streaks, and levels you up. The AI coach isn't just a chatbot — it embeds your habit history into vectors and uses similarity search to pull your actual context before generating a response. So when you ask "what should I focus on today?", it knows you've missed your morning run 3 days in a row and your sleep average is down.

**Core features:**
- Habit tracking with boolean and numeric types
- Streak system with milestone bonuses (7d, 30d, 100d)
- Level-up system (100 XP per level) with animated overlays
- GitHub-style contribution heatmap
- Pomodoro focus timer with ambient sounds and session logging
- Goal grouping — link habits to bigger objectives
- Achievement system with shareable Instagram Story cards
- RAG AI Coach powered by Groq (llama-3.1-8b-instant, <500ms responses)
- Light/dark theme, PWA-ready, fully mobile responsive

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion, Zustand |
| Backend | Python 3.11, FastAPI |
| Database | Supabase (PostgreSQL + pgvector) |
| AI / LLM | Groq API — llama-3.1-8b-instant |
| Embeddings | SentenceTransformers (all-MiniLM-L6-v2, 384-dim) |

---

## How the AI coach works

This was the most interesting part to build. Standard chatbots just take your message and respond. Ours does this:

1. Your habit logs get converted to 384-dimensional embedding vectors
2. Vectors are stored in Supabase using pgvector
3. When you send a message, it gets independently embedded
4. pgvector runs a cosine similarity search and returns your most relevant context chunks
5. That context gets injected into the Groq prompt *before* your message
6. The model responds with specific numbers, habit names, and streak data — not generic advice

```
User query → embed → pgvector similarity search → top-3 context chunks
→ inject into Groq prompt → llama-3.1-8b-instant → response in <500ms
```

---

## Running locally

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # add SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env  # set VITE_API_URL=http://localhost:8000
npm run dev
```

You'll need a Supabase project with pgvector enabled and the schema from `backend/scripts/` applied. Full setup in the wiki.

---

## Team

| Name | What I built |
|---|---|
| **Rutwik** | FastAPI backend, gamification engine, RAG pipeline, LLM integration, embeddings |
| **Sahil** | Supabase schema, pgvector setup, REST endpoints, RLS policies |
| **Divyani** | React frontend, Zustand state, animations, AI chat UI, analytics, timer |

---

## Deployment

- Frontend → Vercel
- Backend → Render
- DB → Supabase (managed Postgres + pgvector)

Live at: `https://zenith-eta-ruddy.vercel.app`