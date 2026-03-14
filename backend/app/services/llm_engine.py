import os
from groq import AsyncGroq
from dotenv import load_dotenv
from app.services.embedding import retrieve_relevant_context, upsert_user_context_embedding

load_dotenv()

# ---------------------------------------------------------------------------
# Client — one instance, reused across requests
# ---------------------------------------------------------------------------

_groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.1-8b-instant"

# ---------------------------------------------------------------------------
# System prompts
# ---------------------------------------------------------------------------

COACH_SYSTEM_PROMPT = """You are Zenith, a brutally honest, high-performance AI productivity coach.
You have access to the user's real habit data. Use it.

Rules:
1. Maximum 4 sentences per response.
2. Reference specific habits or numbers from the context — never give generic advice.
3. If a streak is at risk, name the habit and the urgency directly.
4. Use Markdown formatting: **bold** for habit names and key numbers, bullet points only when listing 3+ items.
5. Never use filler phrases like "Great job!" or "Keep it up!".
6. End every response with one specific action the user should take in the next 24 hours, prefixed with: **Your move:**"""

QUICK_CUE_SYSTEM_PROMPT = """You are Zenith. Generate a single motivational cue — one sentence only.
It must reference a specific habit, streak, or XP number from the context.
No filler. No generic advice. Raw, direct, specific."""

HABIT_ANALYSIS_SYSTEM_PROMPT = """You are Zenith, analyzing a user's habit performance data.
Respond in this exact Markdown format — no deviations:

## What's working
One sentence about their strongest habit with specific numbers.

## What needs attention
One sentence about their weakest habit or biggest consistency gap.

## Your move tomorrow
One concrete, specific action. Start with a verb. No vague advice."""

# ---------------------------------------------------------------------------
# Core chat completion — with RAG context injection
# ---------------------------------------------------------------------------

async def chat_with_coach(user_id: str, user_message: str) -> dict:
    context = await retrieve_relevant_context(user_id, user_message, top_k=3)

    augmented_user_message = f"""Context about this user's habits:
{context}

User's message: {user_message}"""

    try:
        completion = await _groq_client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": COACH_SYSTEM_PROMPT},
                {"role": "user",   "content": augmented_user_message},
            ],
            temperature=0.65,
            max_tokens=200,
        )
        reply       = completion.choices[0].message.content.strip()
        tokens_used = completion.usage.total_tokens
        return {"reply": reply, "context_used": context, "tokens_used": tokens_used}

    except Exception as e:
        err = str(e).lower()
        if "rate limit" in err or "429" in err:
            return {
                "reply":        "I'm processing a lot right now — give me a moment and try again.",
                "context_used": context,
                "tokens_used":  0,
            }
        if "authentication" in err or "401" in err:
            return {
                "reply":        "There's a configuration issue on my end. Let the team know.",
                "context_used": context,
                "tokens_used":  0,
            }
        if "connection" in err or "timeout" in err:
            return {
                "reply":        "Lost connection to the AI — check your network and retry.",
                "context_used": context,
                "tokens_used":  0,
            }
        raise


# ---------------------------------------------------------------------------
# Quick motivational cue — fired after a habit is logged
# ---------------------------------------------------------------------------

async def generate_quick_cue(user_id: str, habit_title: str, gamification_result: dict) -> str:
    streak  = gamification_result.get('current_streak', 0)
    xp      = gamification_result.get('total_xp', 0)
    level   = gamification_result.get('level', 1)
    leveled = gamification_result.get('leveled_up', False)

    context_snippet = (
        f"User just logged '{habit_title}'. "
        f"Current streak: {streak} days. Total XP: {xp}. Level: {level}. "
        f"{'They just leveled up.' if leveled else ''}"
    )

    try:
        completion = await _groq_client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": QUICK_CUE_SYSTEM_PROMPT},
                {"role": "user",   "content": context_snippet},
            ],
            temperature=0.75,
            max_tokens=60,
        )
        return completion.choices[0].message.content.strip()

    except Exception as e:
        err = str(e).lower()
        if "rate limit" in err or "429" in err:
            return "Keep going — you're building something real."
        if "authentication" in err or "401" in err:
            return "Habit logged. Keep the streak alive."
        if "connection" in err or "timeout" in err:
            return "Logged. Don't break the chain."
        raise



# ---------------------------------------------------------------------------
# Deep habit analysis — for the Analytics page
# ---------------------------------------------------------------------------

async def analyze_habits(user_id: str) -> dict:
    try:
        embed_result = await upsert_user_context_embedding(user_id)
        context      = embed_result['context']
    except Exception as e:
        context = "No habit context available yet."

    try:
        completion = await _groq_client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": HABIT_ANALYSIS_SYSTEM_PROMPT},
                {"role": "user",   "content": f"Analyze this user's data:\n{context}"},
            ],
            temperature=0.5,
            max_tokens=300,
        )
        raw = completion.choices[0].message.content.strip()

        insights = []
        for line in raw.splitlines():
            line = line.strip()
            if line.startswith("INSIGHT") or line.startswith("##"):
                parts = line.split(":", 1)
                if len(parts) == 2:
                    insights.append(parts[1].strip())

        return {
            "insights":     insights,
            "raw_response": raw,
            "context_used": context,
        }

    except Exception as e:
        err = str(e).lower()
        if "rate limit" in err or "429" in err:
            return {
                "insights":     [],
                "raw_response": "",
                "context_used": context,
                "error":        "I'm processing a lot right now — try again in a moment.",
            }
        if "authentication" in err or "401" in err:
            return {
                "insights":     [],
                "raw_response": "",
                "context_used": context,
                "error":        "Configuration issue on our end. Let the team know.",
            }
        if "connection" in err or "timeout" in err:
            return {
                "insights":     [],
                "raw_response": "",
                "context_used": context,
                "error":        "Lost connection to the AI — check your network and retry.",
            }
        raise