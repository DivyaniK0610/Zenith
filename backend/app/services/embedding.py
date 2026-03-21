from sentence_transformers import SentenceTransformer
from app.db.supabase import supabase
import asyncio
from functools import lru_cache
from datetime import date

# Model — loaded once at import time, reused across all requests

@lru_cache(maxsize=1)
def _get_model() -> SentenceTransformer:
    """Lazy-load the embedding model once and cache it."""
    return SentenceTransformer('all-MiniLM-L6-v2')


def embed_text(text: str) -> list[float]:
    """
    Converts a string into a 384-dimensional embedding vector.
    Runs synchronously — wrap with asyncio.to_thread for async routes.
    """
    model = _get_model()
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()


# Build a rich text snapshot of a user's recent habit activity

def _build_habit_context_string(
    habits: list[dict],
    logs: list[dict],
    user_stats: dict,
) -> str:
    """
    Constructs a structured natural-language summary of the user's
    habit activity. This string is embedded and stored for RAG retrieval.

    Example output:
        User is Level 3 with 280 XP. Current streak: 5 days.
        Habit: 'Run' (boolean) — completed 6/7 days this week. Streak: 5.
        Habit: 'Sleep 8 hours' (numeric, target: 8 hours) — avg value: 6.8 this week.
    """
    lines = [
        f"User is Level {user_stats.get('level', 1)} with {user_stats.get('xp', 0)} XP.",
        f"Current streak: {user_stats.get('current_streak', 0)} days. "
        f"Longest streak: {user_stats.get('longest_streak', 0)} days.",
    ]

    # Group logs by habit_id
    logs_by_habit: dict[str, list[dict]] = {}
    for log in logs:
        logs_by_habit.setdefault(log['habit_id'], []).append(log)

    for habit in habits:
        hid   = habit['id']
        title = habit['title']
        mtype = habit.get('metric_type', 'boolean')
        streak = habit.get('current_streak', 0)
        habit_logs = logs_by_habit.get(hid, [])

        if mtype == 'boolean':
            completed_count = sum(1 for l in habit_logs if l.get('completed') is True)
            total = len(habit_logs) or 1
            lines.append(
                f"Habit: '{title}' (boolean) — completed {completed_count}/{total} days logged. "
                f"Current streak: {streak}."
            )
        else:
            values = [l['metric_value'] for l in habit_logs if l.get('metric_value') is not None]
            avg = round(sum(values) / len(values), 2) if values else 0
            target = habit.get('target_value', '?')
            unit   = habit.get('unit', '')
            lines.append(
                f"Habit: '{title}' (numeric, target: {target} {unit}) — "
                f"avg logged value: {avg} {unit} over {len(values)} entries. "
                f"Current streak: {streak}."
            )

    return "\n".join(lines)


# Upsert a user context embedding into Supabase pgvector

async def upsert_user_context_embedding(user_id: str) -> dict:
    """
    Fetches the user's habits, recent logs (last 30 days), and stats,
    builds a context string, embeds it, and upserts it into the
    'user_embeddings' table for RAG retrieval.

    Supabase table required:
        user_embeddings (
            user_id   uuid PRIMARY KEY REFERENCES users(id),
            context   text,
            embedding vector(384),
            updated_at timestamptz DEFAULT now()
        )
    """
    # 1. Fetch data concurrently
    habits_resp = supabase.table('habits').select('*').eq('user_id', user_id).execute()
    stats_resp  = supabase.table('users').select('*').eq('id', user_id).single().execute()

    habits     = habits_resp.data or []
    user_stats = stats_resp.data or {}
    habit_ids  = [h['id'] for h in habits]

    logs: list[dict] = []
    if habit_ids:
        logs_resp = (
            supabase.table('habit_logs')
            .select('*')
            .in_('habit_id', habit_ids)
            .gte('log_date', str(date.today().replace(day=1)))  # current month
            .execute()
        )
        logs = logs_resp.data or []

    # 2. Build context string
    context_text = _build_habit_context_string(habits, logs, user_stats)

    # 3. Generate embedding (offload CPU work to thread)
    vector = await asyncio.to_thread(embed_text, context_text)

    # 4. Upsert into Supabase
    supabase.table('user_embeddings').upsert({
        'user_id':  user_id,
        'context':  context_text,
        'embedding': vector,
    }).execute()

    return {"context": context_text, "embedding_dim": len(vector)}


# Retrieve the most relevant context chunks for a user query (RAG)

async def retrieve_relevant_context(user_id: str, query: str, top_k: int = 3) -> str:
    """
    Embeds the user's query and performs a cosine similarity search
    against stored embeddings in Supabase using pgvector.

    Requires this SQL function in Supabase:
        CREATE OR REPLACE FUNCTION match_user_context(
            query_embedding vector(384),
            match_user_id   uuid,
            match_count     int DEFAULT 3
        )
        RETURNS TABLE (context text, similarity float)
        LANGUAGE sql STABLE AS $$
            SELECT context, 1 - (embedding <=> query_embedding) AS similarity
            FROM user_embeddings
            WHERE user_id = match_user_id
            ORDER BY embedding <=> query_embedding
            LIMIT match_count;
        $$;

    Returns a single merged context string to inject into the LLM prompt.
    """
    query_vector = await asyncio.to_thread(embed_text, query)

    result = supabase.rpc('match_user_context', {
        'query_embedding': query_vector,
        'match_user_id':   user_id,
        'match_count':     top_k,
    }).execute()

    if not result.data:
        return "No habit context available yet."

    chunks = [row['context'] for row in result.data]
    return "\n---\n".join(chunks)
