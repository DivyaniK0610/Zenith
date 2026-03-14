import asyncio
import sys
import traceback
from datetime import date
from app.db.supabase import supabase

TEST_USER_ID = "741601ad-1b7c-477e-8be0-c76363f6ebda"

PASS = "\033[92m  PASS\033[0m"
FAIL = "\033[91m  FAIL\033[0m"
HEAD = "\033[94m{}\033[0m"

results = []

def check(name: str, passed: bool, detail: str = ""):
    symbol = PASS if passed else FAIL
    print(f"{symbol}  {name}" + (f" — {detail}" if detail else ""))
    results.append((name, passed))


# ── 1. Supabase connectivity ─────────────────────────────────────────────────

def test_supabase_connection():
    print(HEAD.format("\n[1] Supabase connection"))
    try:
        r = supabase.table('users').select('id').limit(1).execute()
        check("Supabase client connects", True)
        return True
    except Exception as e:
        check("Supabase client connects", False, str(e))
        return False


# ── 2. Schema columns ────────────────────────────────────────────────────────

def test_schema():
    print(HEAD.format("\n[2] Schema validation"))

    checks = [
        ("users has current_streak",      "users",      "current_streak"),
        ("users has longest_streak",       "users",      "longest_streak"),
        ("users has xp",                   "users",      "xp"),
        ("users has level",                "users",      "level"),
        ("habits has current_streak",      "habits",     "current_streak"),
        ("habits has habit_type",          "habits",     "habit_type"),
        ("habits has duration_mins",       "habits",     "duration_mins"),
        ("habit_logs has duration_logged", "habit_logs", "duration_logged"),
    ]

    for label, table, column in checks:
        try:
            r = supabase.table(table).select(column).limit(1).execute()
            check(label, True)
        except Exception as e:
            check(label, False, str(e))

    try:
        r = supabase.table('user_embeddings').select('user_id').limit(1).execute()
        check("user_embeddings table exists", True)
    except Exception as e:
        check("user_embeddings table exists", False, "Run SQL migrations first")


# ── 3. User exists in DB ─────────────────────────────────────────────────────

def test_user_exists():
    print(HEAD.format("\n[3] Test user"))
    try:
        r = supabase.table('users').select('id, xp, level, current_streak, longest_streak').eq('id', TEST_USER_ID).single().execute()
        if r.data:
            u = r.data
            check("Test user exists", True, f"Level {u['level']} | XP {u['xp']} | Streak {u['current_streak']}")
        else:
            check("Test user exists", False, f"No user with id {TEST_USER_ID}")
    except Exception as e:
        check("Test user exists", False, str(e))


# ── 4. Habits and logs ───────────────────────────────────────────────────────

def test_habits_and_logs():
    print(HEAD.format("\n[4] Habits and logs"))
    try:
        r = supabase.table('habits').select('id, title, metric_type, current_streak').eq('user_id', TEST_USER_ID).execute()
        habits = r.data or []
        check("Fetch habits for test user", True, f"{len(habits)} habits found")

        if habits:
            hid = habits[0]['id']
            logs = supabase.table('habit_logs').select('*').eq('habit_id', hid).limit(5).execute()
            check("Fetch logs for first habit", True, f"{len(logs.data or [])} logs found")
        else:
            check("Fetch logs for first habit", False, "No habits to check logs for")
    except Exception as e:
        check("Habits and logs query", False, str(e))


# ── 5. Gamification logic ────────────────────────────────────────────────────

async def test_gamification():
    print(HEAD.format("\n[5] Gamification service"))
    try:
        from app.services.gamification import _fetch_user, _fetch_streak, _calculate_level
        user = await _fetch_user(TEST_USER_ID)
        check("_fetch_user returns data", bool(user), str(user))

        level = _calculate_level(0)
        check("_calculate_level(0) == 1", level == 1, f"got {level}")

        level = _calculate_level(100)
        check("_calculate_level(100) == 2", level == 2, f"got {level}")

        level = _calculate_level(250)
        check("_calculate_level(250) == 3", level == 3, f"got {level}")
    except Exception as e:
        check("Gamification service", False, traceback.format_exc())


# ── 6. Analytics aggregation ─────────────────────────────────────────────────

async def test_analytics():
    print(HEAD.format("\n[6] Analytics service"))
    try:
        from app.services.analytics import get_heatmap_matrix, get_daily_completion_rate

        heatmap = await get_heatmap_matrix(TEST_USER_ID, weeks=4)
        check("get_heatmap_matrix returns dict",   isinstance(heatmap, dict))
        check("heatmap has 'matrix' key",          'matrix' in heatmap)
        check("heatmap has 'weekly_summary' key",  'weekly_summary' in heatmap)
        check("heatmap has 'date_range' key",      'date_range' in heatmap)

        daily = await get_daily_completion_rate(TEST_USER_ID, days=7)
        check("get_daily_completion_rate returns list", isinstance(daily, list))
        check("daily rate has 7 entries",               len(daily) == 7, f"got {len(daily)}")

        if daily:
            first = daily[0]
            check("daily entry has 'date' key",            'date'            in first)
            check("daily entry has 'completion_rate' key", 'completion_rate' in first)
    except Exception as e:
        check("Analytics service", False, traceback.format_exc())


# ── 7. Groq API ───────────────────────────────────────────────────────────────

async def test_groq():
    print(HEAD.format("\n[7] Groq API"))
    try:
        import os
        from groq import AsyncGroq
        from dotenv import load_dotenv
        load_dotenv()

        key = os.getenv("GROQ_API_KEY")
        check("GROQ_API_KEY is set", bool(key), "missing from .env" if not key else "found")

        if key:
            client = AsyncGroq(api_key=key)
            resp = await client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": "Say OK"}],
                max_tokens=5,
            )
            reply = resp.choices[0].message.content.strip()
            check("Groq API call succeeds", bool(reply), f"reply: '{reply}'")
    except Exception as e:
        err = str(e).lower()
        if "rate limit" in err or "429" in err:
            check("Groq API call", False, "Rate limited — wait 60s and retry")
        elif "authentication" in err or "401" in err:
            check("Groq API call", False, "Invalid API key")
        else:
            check("Groq API call", False, str(e))


# ── 8. Embedding service ──────────────────────────────────────────────────────

async def test_embeddings():
    print(HEAD.format("\n[8] Embedding service (sentence-transformers)"))
    try:
        from app.services.embedding import embed_text, upsert_user_context_embedding

        vec = embed_text("test habit log for running")
        check("embed_text returns list",      isinstance(vec, list))
        check("embedding has 384 dimensions", len(vec) == 384, f"got {len(vec)}")
        check("embedding values are floats",  all(isinstance(v, float) for v in vec[:5]))

        result = await upsert_user_context_embedding(TEST_USER_ID)
        check("upsert_user_context_embedding succeeds", 'embedding_dim' in result, str(result))
        check("upserted embedding is 384-dim",          result.get('embedding_dim') == 384)
    except ImportError:
        check("sentence-transformers installed", False, "Run: pip install sentence-transformers")
    except Exception as e:
        check("Embedding service", False, traceback.format_exc())


# ── 9. LLM engine ────────────────────────────────────────────────────────────

async def test_llm_engine():
    print(HEAD.format("\n[9] LLM engine (RAG + Groq)"))
    try:
        from app.services.llm_engine import chat_with_coach, generate_quick_cue

        result = await chat_with_coach(TEST_USER_ID, "What should I focus on today?")
        check("chat_with_coach returns dict",    isinstance(result, dict))
        check("reply is non-empty string",       bool(result.get('reply')))
        check("context_used is present",         bool(result.get('context_used')))
        check("tokens_used is int",              isinstance(result.get('tokens_used'), int))
        print(f"         reply preview: \"{result.get('reply', '')[:120]}\"")

        cue = await generate_quick_cue(
            TEST_USER_ID,
            "Morning Run",
            {"current_streak": 5, "total_xp": 120, "level": 2, "leveled_up": False}
        )
        check("generate_quick_cue returns string", isinstance(cue, str) and bool(cue))
        print(f"         cue preview: \"{cue[:100]}\"")
    except Exception as e:
        check("LLM engine", False, traceback.format_exc())


# ── 10. HTTP endpoints ────────────────────────────────────────────────────────

async def test_endpoints():
    print(HEAD.format("\n[10] FastAPI endpoints (requires server running on :8000)"))
    try:
        import httpx
        async with httpx.AsyncClient(base_url="http://localhost:8000", timeout=10) as client:

            r = await client.get("/health")
            check("GET /health returns 200",           r.status_code == 200)
            check("GET /health returns 'Zenith API'",  "Zenith" in r.text)

            r = await client.get(f"/api/v1/game/stats/{TEST_USER_ID}")
            check("GET /game/stats returns 200",       r.status_code == 200, f"got {r.status_code}")

            r = await client.get(f"/api/v1/habits/?user_id={TEST_USER_ID}")
            check("GET /habits returns 200",           r.status_code == 200, f"got {r.status_code}")

            r = await client.get(f"/api/v1/game/heatmap/{TEST_USER_ID}?weeks=4")
            check("GET /game/heatmap returns 200",     r.status_code == 200, f"got {r.status_code}")

            r = await client.get(f"/api/v1/game/daily-rate/{TEST_USER_ID}?days=7")
            check("GET /game/daily-rate returns 200",  r.status_code == 200, f"got {r.status_code}")

            r = await client.post("/api/v1/chat/message", json={
                "user_id": TEST_USER_ID,
                "message": "What habit should I focus on?"
            })
            check("POST /chat/message returns 200",    r.status_code == 200, f"got {r.status_code}")

    except ImportError:
        check("httpx installed", False, "Run: pip install httpx")
    except Exception as e:
        if "connection refused" in str(e).lower():
            check("Server reachable on :8000", False, "Start server first: uvicorn main:app --reload")
        else:
            check("Endpoint tests", False, str(e))


# ── Runner ────────────────────────────────────────────────────────────────────

async def main():
    print("\n" + "="*52)
    print("  Zenith Backend — Full Verification Suite")
    print("="*52)

    connected = test_supabase_connection()
    if not connected:
        print("\n\033[91mSupabase connection failed — fix this before running other checks.\033[0m")
        sys.exit(1)

    test_schema()
    test_user_exists()
    test_habits_and_logs()
    await test_gamification()
    await test_analytics()
    await test_groq()
    await test_embeddings()
    await test_llm_engine()
    await test_endpoints()

    passed = sum(1 for _, p in results if p)
    total  = len(results)
    color  = "\033[92m" if passed == total else "\033[93m"

    print("\n" + "="*52)
    print(f"{color}  Results: {passed}/{total} checks passed\033[0m")
    print("="*52 + "\n")

    if passed < total:
        print("Failed checks:")
        for name, p in results:
            if not p:
                print(f"  \033[91m✗\033[0m  {name}")
        print()

if __name__ == "__main__":
    asyncio.run(main())
