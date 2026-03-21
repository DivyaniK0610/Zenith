# Slate — AI Habit Tracker

> *Build streaks. Earn XP. Get coached by AI that actually knows your data.*

Built for Code Canvas hackathon at Medicaps University. Slate is a habit tracker that combines gamification, analytics, and a RAG-powered AI coach — so instead of generic productivity advice, you get coached on your actual data.

---

## What it does

You log habits daily. Every completion earns XP, builds streaks, and levels you up. The AI coach isn't just a chatbot — it embeds your habit history into vectors and uses cosine similarity search to pull your actual context before generating a response.

So when you ask "what should I focus on today?", it knows you've missed your morning run 3 days in a row and your sleep average is down. It responds with your habit names and streak numbers — not generic advice.

**Core features**

- Habit tracking — boolean (yes/no) and numeric (measure a quantity) types
- Streak system with milestone bonuses at 7, 30, and 100 days
- XP + level-up system (100 XP per level) with animated overlays
- GitHub-style contribution heatmap with per-habit breakdown
- Pomodoro focus timer with ambient sounds and automatic habit logging
- Goal grouping — link habits to bigger objectives like "Get fit"
- Achievement system with shareable 1080×1080 PNG cards (Instagram-ready)
- RAG AI Coach powered by Groq — llama-3.1-8b-instant, responses under 500ms
- Light and dark theme, PWA-ready, fully mobile responsive

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

Standard chatbots take your message and respond with whatever their training data says. Ours does this instead:

```
User query
  → embed with all-MiniLM-L6-v2 (384-dim vector)
  → pgvector cosine similarity search against stored habit context
  → top-3 relevant context chunks retrieved
  → injected into Groq system prompt before the user message
  → llama-3.1-8b-instant generates response with your actual data
  → reply in <500ms
```

Step by step:

1. When you log habits, a natural-language summary of your activity gets embedded into a 384-dimensional vector and stored in Supabase via pgvector
2. When you send a message to the coach, that message gets independently embedded
3. pgvector runs a cosine similarity search — `1 - (embedding <=> query_embedding)` — and returns the most relevant chunks of your habit history
4. Those chunks are injected into the prompt before your message so the model has real context
5. The model is instructed to always reference specific habit names, streak numbers, and XP — never give generic advice

This means the coach response quality improves as you use the app more, because your embedding context grows richer.

---

## Gamification engine

XP and streak logic lives entirely in `backend/app/services/gamification.py`.

- Base XP per completed habit: **10**
- Milestone bonuses: **+50 XP** at 7 days, **+200 XP** at 30 days, **+1000 XP** at 100 days
- Level threshold: **100 XP per level**
- Streaks are calculated by walking backwards through `habit_logs` to find consecutive days — no stored counter that can get out of sync

---

## Running locally

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# fill in: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env
# set: VITE_API_URL=http://localhost:8000
npm run dev
```

You need a Supabase project with pgvector enabled and the schema from `backend/scripts/` applied.

---

## Project structure

```
slate/
├── backend/
│   ├── main.py                  # FastAPI app, routers, CORS
│   ├── app/
│   │   ├── api/                 # Route handlers (habits, chat, game, goals, timer, achievements)
│   │   ├── db/                  # Supabase client, Pydantic schemas
│   │   └── services/            # Business logic (gamification, embedding, llm_engine, analytics)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/               # Dashboard, Analytics, AICoach, Timer, Goals, Achievements
    │   ├── components/          # HabitCard, XPBar, AchievementOverlay, AddHabitModal, ...
    │   ├── store/               # Zustand store (habitStore)
    │   ├── api/                 # Axios client + habits API
    │   └── hooks/               # useSound, useHabits
    └── public/                  # PWA manifest, service worker, icons
```

---

## Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | Supabase (managed Postgres + pgvector) |

Live: **https://zenith-eta-ruddy.vercel.app**

---

## Team

| Name | Responsibility |
|---|---|
| **Rutwik** | FastAPI backend, gamification engine, RAG pipeline, LLM integration, embeddings |
| **Sahil** | Supabase schema design, pgvector setup, REST endpoints, RLS policies |
| **Divyani** | React frontend, Zustand state management, animations, AI chat UI, analytics, timer |

---