# Zenith — AI-Powered Habit Tracker

> *Build streaks. Earn XP. Get coached by AI that actually knows your data.*

Zenith is a production-grade habit tracking application that combines gamification, Strava-style analytics, and a RAG-powered AI coach built on Groq. Complete habits daily to build streaks, level up, and receive hyper-personalized coaching derived from your actual habit logs — not generic advice.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Supabase Setup](#supabase-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Gamification System](#gamification-system)
- [RAG Pipeline](#rag-pipeline)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Team](#team)

---

## Features

**Core Habit Loop**
- Create habits with boolean (yes/no) or numeric (e.g., hours of sleep) tracking
- Timer-type habits that capture duration in minutes
- One-tap completion with instant visual feedback
- Optimistic UI updates — the interface responds before the server confirms

**Gamification**
- +10 XP per completed habit log
- Streak milestone bonuses: +50 XP at 7 days, +200 XP at 30 days, +1000 XP at 100 days
- Level system: every 100 XP advances your level
- Level-up overlay with particle animations and fanfare sound
- Streak-extended overlay for milestone moments
- Per-habit streak tracking alongside global user streak

**Analytics Dashboard**
- GitHub-style contribution heatmap showing completion history across 12 weeks
- Daily completion rate chart (30-day view)
- Weekly summary with percentage breakdowns
- All data aggregated server-side into a clean matrix format

**Pomodoro Focus Timer**
- 25-minute focus sessions with 5-minute and 15-minute break modes
- SVG circular progress ring
- Completed sessions logged directly to `habit_logs`
- Session count tracker per day

**RAG AI Coach**
- Habit logs converted to 384-dimensional vectors using `all-MiniLM-L6-v2`
- Vectors stored in Supabase with pgvector for cosine similarity search
- User queries retrieve the most relevant context chunks before hitting the LLM
- Groq `llama-3.1-8b-instant` generates responses in under 500ms
- Three distinct AI modes: conversational coach, quick motivational cue, deep habit analysis
- Responses formatted in Markdown and rendered with `react-markdown`
- Typing indicator while waiting for Groq response
- Rate limit and timeout errors handled gracefully with fallback messages

**Production Quality**
- Sensitive database errors suppressed from API responses
- Pydantic validation on all endpoints with detailed error messages
- Row Level Security policies on all Supabase tables
- CORS configured for local and production origins
- Full mobile responsiveness

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion, Zustand |
| Backend | Python 3.11, FastAPI, Uvicorn |
| Database | Supabase (PostgreSQL + pgvector) |
| AI / LLM | Groq API (`llama-3.1-8b-instant`) |
| Embeddings | SentenceTransformers (`all-MiniLM-L6-v2`) |
| Fonts | DM Sans, DM Mono |
| Deployment | Frontend → Vercel, Backend → Render |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                      │
│  Zustand Store → Axios → FastAPI (port 8000)            │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                    FastAPI Backend                      │
│                                                         │
│  /api/v1/habits   →  routes_habits.py                   │
│  /api/v1/game     →  routes_game.py                     │
│  /api/v1/chat     →  routes_chat.py                     │
│                                                         │
│  services/                                              │
│    gamification.py  →  XP + streak logic                │
│    analytics.py     →  heatmap aggregation              │
│    embedding.py     →  vector generation + upsert       │
│    llm_engine.py    →  Groq RAG pipeline                │
└────────┬──────────────────────────┬─────────────────────┘
         │                          │
┌────────▼────────┐      ┌──────────▼──────────┐
│    Supabase     │      │      Groq API       │
│                 │      │                     │
│  users          │      │  llama-3.1-8b-inst  │
│  habits         │      │  < 500ms responses  │
│  habit_logs     │      └────────────────────-┘
│  macro_goals    │
│  user_embeddings│
│  (pgvector)     │
└─────────────────┘
```

**RAG flow for AI Coach:**
```
User query
    → embed_text() → 384-dim vector
    → match_user_context() RPC → top-3 context chunks from pgvector
    → inject into Groq prompt as context
    → llama-3.1-8b-instant generates response
    → Markdown rendered in Chat.jsx
```

---

## Project Structure

```
zenith-tracker/
├── backend/
│   ├── main.py                        # FastAPI app, routers, middleware
│   ├── requirements.txt
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes_habits.py       # POST /habits, GET /habits, POST /log
│   │   │   ├── routes_chat.py         # POST /chat/message, GET /chat/analyze
│   │   │   ├── routes_game.py         # GET /game/stats, /heatmap, /daily-rate
│   │   │   └── error_handlers.py      # Safe error suppression
│   │   ├── db/
│   │   │   ├── schemas.py             # Pydantic models (HabitCreate, HabitLogCreate)
│   │   │   └── supabase.py            # Supabase client singleton
│   │   └── services/
│   │       ├── gamification.py        # XP calculation, streak detection
│   │       ├── analytics.py           # Heatmap matrix aggregation
│   │       ├── embedding.py           # SentenceTransformer + pgvector upsert
│   │       └── llm_engine.py          # Groq integration, system prompts, RAG
│   └── scripts/
│       └── verify_all.py              # Full backend verification suite
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx                    # Router, layout, backend health check
        ├── index.css                  # Design system, CSS variables, typography
        ├── api/
        │   ├── client.js              # Axios instance
        │   └── habits.js              # Habit API hooks
        ├── components/
        │   ├── dashboard/
        │   │   ├── HabitCard.jsx      # Completion animation, XP flash, accent bar
        │   │   ├── StatsRow.jsx       # 4-stat grid with per-stat accent colors
        │   │   └── AddHabitModal.jsx  # Habit creation form
        │   ├── gamification/
        │   │   ├── XPBar.jsx          # Level + XP progress bar
        │   │   └── AchievementOverlay.jsx  # Level-up / streak popup
        │   ├── layout/
        │   │   ├── Sidebar.jsx        # Desktop nav with XP ring avatar
        │   │   └── MobileNav.jsx      # Bottom tab bar
        │   └── chat/
        │       └── Chat.jsx           # AI Coach chat interface
        ├── hooks/
        │   ├── useSound.js            # Web Audio API synthesized chimes
        │   └── usePomodoro.js         # Timer state machine
        ├── pages/
        │   ├── Dashboard.jsx
        │   ├── Analytics.jsx          # Heatmap + daily rate charts
        │   ├── AICoach.jsx            # Chat interface page
        │   └── Timer.jsx              # Pomodoro page
        └── store/
            └── habitStore.js          # Zustand global state
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key

### Backend Setup

```bash
# Clone the repo
git clone https://github.com/your-org/zenith-tracker.git
cd zenith-tracker/backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Linux / macOS
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY

# Start the development server
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. Visit `http://localhost:8000/docs` for the interactive Swagger UI.

### Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Supabase Setup

Run the following SQL in your Supabase SQL editor in order:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table (linked to Supabase Auth)
CREATE TABLE public.users (
  id                   uuid PRIMARY KEY REFERENCES auth.users(id),
  name                 text NOT NULL,
  xp                   integer DEFAULT 0,
  level                integer DEFAULT 1,
  current_streak       integer DEFAULT 0,
  longest_streak       integer DEFAULT 0,
  total_xp             integer DEFAULT 0,
  unlocked_achievements text[] DEFAULT '{}',
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- Macro goals
CREATE TABLE public.macro_goals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id),
  title       text NOT NULL,
  description text,
  target_date date,
  status      text DEFAULT 'in_progress',
  created_at  timestamptz DEFAULT now()
);

-- Habits
CREATE TABLE public.habits (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.users(id),
  macro_goal_id  uuid REFERENCES public.macro_goals(id),
  title          text NOT NULL,
  description    text,
  metric_type    text NOT NULL CHECK (metric_type = ANY (ARRAY['boolean', 'numeric'])),
  habit_type     text NOT NULL DEFAULT 'standard' CHECK (habit_type = ANY (ARRAY['standard', 'timer'])),
  target_value   numeric,
  unit           text,
  duration_mins  integer CHECK (duration_mins >= 1 AND duration_mins <= 480),
  current_streak integer DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);

-- Habit logs
CREATE TABLE public.habit_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id         uuid NOT NULL REFERENCES public.habits(id),
  log_date         date NOT NULL DEFAULT CURRENT_DATE,
  completed        boolean,
  metric_value     numeric,
  duration_logged  integer,
  notes            text,
  created_at       timestamptz DEFAULT now(),
  UNIQUE (habit_id, log_date)
);

-- User embeddings for RAG
CREATE TABLE public.user_embeddings (
  user_id    uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  context    text NOT NULL,
  embedding  vector(384),
  updated_at timestamptz DEFAULT now()
);

-- pgvector similarity search function
CREATE OR REPLACE FUNCTION match_user_context(
  query_embedding vector(384),
  match_user_id   uuid,
  match_count     int DEFAULT 3
)
RETURNS TABLE (context text, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT context, 1 - (embedding <=> query_embedding) AS similarity
  FROM public.user_embeddings
  WHERE user_id = match_user_id
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Row Level Security
ALTER TABLE public.users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.macro_goals  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"   ON public.users        FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users        FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users manage own habits"   ON public.habits       FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "Users manage own logs"     ON public.habit_logs   FOR ALL    USING (auth.uid() = (SELECT user_id FROM public.habits WHERE id = habit_id));
CREATE POLICY "Users manage own goals"    ON public.macro_goals  FOR ALL    USING (auth.uid() = user_id);
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=your-groq-api-key
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
```

---

## API Reference

### Habits

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/habits/` | Create a new habit |
| `GET` | `/api/v1/habits/?user_id=` | Fetch all habits for a user |
| `POST` | `/api/v1/habits/log` | Log a habit completion |

**POST `/api/v1/habits/`** — request body:
```json
{
  "user_id": "uuid",
  "title": "Morning Run",
  "metric_type": "boolean",
  "habit_type": "standard",
  "description": "Run at least 3km"
}
```

**POST `/api/v1/habits/log`** — request body:
```json
{
  "habit_id": "uuid",
  "log_date": "2026-03-14",
  "completed": true
}
```

Response includes a `gamification` object:
```json
{
  "gamification": {
    "streak_updated": true,
    "current_streak": 7,
    "xp_gained": 60,
    "milestone_bonus": 50,
    "total_xp": 310,
    "level": 4,
    "leveled_up": false,
    "message": "🔥 7-day streak unlocked! +50 bonus XP."
  }
}
```

### Gamification & Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/game/stats/:user_id` | XP, level, streaks |
| `GET` | `/api/v1/game/heatmap/:user_id?weeks=12` | Contribution heatmap matrix |
| `GET` | `/api/v1/game/daily-rate/:user_id?days=30` | Daily completion rates |
| `GET` | `/api/v1/game/leaderboard?limit=10` | Top users by XP |

### AI Coach

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/chat/message` | Send a message to the AI coach |
| `GET` | `/api/v1/chat/analyze/:user_id` | Get 3-insight habit analysis |
| `POST` | `/api/v1/chat/embed` | Refresh user context embedding |

**POST `/api/v1/chat/message`** — request body:
```json
{
  "user_id": "uuid",
  "message": "What should I focus on today?"
}
```

Response:
```json
{
  "data": {
    "reply": "Your **Morning Run** streak is at 6 days...",
    "context_used": "User is Level 4 with 310 XP...",
    "tokens_used": 187
  }
}
```

---

## Gamification System

| Event | XP Awarded |
|---|---|
| Any completed habit log | +10 XP |
| 7-day streak milestone | +50 XP bonus |
| 30-day streak milestone | +200 XP bonus |
| 100-day streak milestone | +1000 XP bonus |
| Level threshold | Every 100 XP = +1 Level |

Streaks are tracked per-habit and globally per-user. The global streak (`current_streak` on the users table) reflects the longest single-day chain across all habits. `longest_streak` is immutable once set — it only increases.

---

## RAG Pipeline

The AI Coach is powered by a Retrieval-Augmented Generation pipeline:

**1. Embedding generation** (`services/embedding.py`)

When a user logs a habit or requests analysis, their full habit context is rebuilt: level, XP, streak counts, per-habit completion rates, and numeric averages. This context string is encoded into a 384-dimensional vector using `all-MiniLM-L6-v2` and upserted into the `user_embeddings` table.

**2. Similarity retrieval**

When the user sends a message to the AI Coach, the query is independently embedded and passed to the `match_user_context` PostgreSQL function. pgvector performs a cosine similarity search and returns the top-3 most relevant context chunks.

**3. Prompt injection**

The retrieved context is prepended to the user's message before sending to Groq. The LLM never sees generic data — it sees this specific user's habits, numbers, and streaks.

**4. Response formatting**

All responses use Markdown formatting. The coach uses `**bold**` for habit names and key numbers, and structures deep analysis responses under `## What's working`, `## What needs attention`, and `## Your move tomorrow` headings.

---

## Running Tests

The project includes a full backend verification suite that tests every layer of the stack:

```bash
cd backend
source venv/bin/activate
python -m scripts.verify_all
```

This runs 32 checks across: Supabase connectivity, schema validation, test user existence, habits and logs queries, gamification logic, analytics aggregation, Groq API, embedding service, LLM engine, and all FastAPI endpoints. Expected output with a running server and complete schema: **32/32 checks passed**.

---

## Deployment

### Backend — Render

1. Connect your GitHub repo to [Render](https://render.com)
2. Create a new **Web Service** pointing to the `backend/` directory
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`

### Frontend — Vercel

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set root directory to `frontend/`
3. Framework preset: Vite
4. Add environment variable: `VITE_API_URL=https://your-render-app.onrender.com`

---

## Team

| Name | Role | Responsibilities |
|---|---|---|
| **Rutwik** | AI / Core Backend | FastAPI setup, Pydantic schemas, gamification logic, RAG pipeline, LLM engine, embedding service, error handling |
| **Sahil** | DB / API | Supabase schema design, REST endpoints, pgvector setup, RLS policies, backend deployment |
| **Divyani** | Frontend | React UI, Zustand state, Framer Motion animations, chat interface, Pomodoro timer, analytics heatmap, Vercel deployment |