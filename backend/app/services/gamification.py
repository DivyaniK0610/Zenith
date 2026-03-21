from datetime import date, timedelta
from typing import Optional
from app.db.supabase import supabase


# XP & Level constants  (tune these freely)

XP_STANDARD_LOG = 10     # base XP for any completed habit log
XP_PER_LEVEL    = 100    # XP needed to advance one level

STREAK_BONUSES: dict[int, int] = {
    7:   50,
    30:  200,
    100: 1000,
}


# Pure helpers  (no I/O)

def _calculate_level(total_xp: int) -> int:
    """Level is 1-indexed: Level 1 starts at 0 XP."""
    return (total_xp // XP_PER_LEVEL) + 1


def _streak_milestone_bonus(streak: int) -> int:
    """Return bonus XP if streak hits a milestone, else 0."""
    return STREAK_BONUSES.get(streak, 0)


def _build_message(
    streak:          int,
    milestone_bonus: int,
    leveled_up:      bool,
    new_level:       int,
) -> str:
    if leveled_up:
        return (
            f"⚡ LEVEL UP — you're now Level {new_level}. "
            "The grind is paying off."
        )
    if milestone_bonus > 0:
        return (
            f"🔥 {streak}-day streak unlocked! +{milestone_bonus} bonus XP. "
            "Consistency is the only cheat code."
        )
    if streak >= 3:
        return (
            f"🔥 {streak} days straight. "
            "Momentum is a weapon — don't waste it."
        )
    return "✅ Habit logged. +10 XP. Small wins compound."


# DB helpers  (Supabase calls)

async def _fetch_streak(habit_id: str, up_to_date: date) -> int:
    """
    Walk backwards from up_to_date through habit_logs to count how many
    consecutive days the habit has been logged.

    Returns 0 on any error or if no logs exist.
    """
    try:
        response = (
            supabase
            .table("habit_logs")
            .select("log_date")
            .eq("habit_id", habit_id)
            .lte("log_date", up_to_date.isoformat())
            .order("log_date", desc=True)
            .execute()
        )
        rows = response.data   # [{"log_date": "YYYY-MM-DD"}, ...]
    except Exception:
        return 0

    if not rows:
        return 0

    streak      = 0
    cursor_date = up_to_date

    for row in rows:
        row_date = date.fromisoformat(row["log_date"])
        if row_date == cursor_date:
            streak      += 1
            cursor_date -= timedelta(days=1)
        elif row_date < cursor_date:
            # Gap — streak is broken
            break

    return streak


async def _fetch_user(user_id: str) -> dict:
    """
    Fetch the full users row for user_id.
    Raises RuntimeError if the user doesn't exist.
    """
    response = (
        supabase
        .table("users")
        .select("id, xp, level, current_streak, longest_streak")
        .eq("id", user_id)
        .single()
        .execute()
    )
    if not response.data:
        raise RuntimeError(f"User {user_id} not found in users table.")
    return response.data


async def _update_habit_streak(habit_id: str, new_streak: int) -> None:
    """Persist current_streak on the habits row."""
    supabase.table("habits").update(
        {"current_streak": new_streak}
    ).eq("id", habit_id).execute()


async def _update_user_stats(
    user_id:       str,
    xp_gained:     int,
    new_streak:    int,
    current_stats: dict,
) -> dict:
    """
    Add xp_gained to the user's total XP, recompute level,
    and update longest_streak if new_streak beats the record.

    Returns a dict with the updated values plus leveled_up / old_level flags.
    """
    old_xp       = current_stats["xp"]
    old_level    = current_stats["level"]
    old_longest  = current_stats["longest_streak"] or 0

    new_xp       = old_xp + xp_gained
    new_level    = _calculate_level(new_xp)
    new_longest  = max(old_longest, new_streak)

    supabase.table("users").update({
        "xp":             new_xp,
        "level":          new_level,
        "current_streak": new_streak,
        "longest_streak": new_longest,
    }).eq("id", user_id).execute()

    return {
        "xp":             new_xp,
        "level":          new_level,
        "longest_streak": new_longest,
        "leveled_up":     new_level > old_level,
        "old_level":      old_level,
    }


# Public entry point — call this from routes_habits.py after inserting a log

async def process_habit_log(
    habit_id:     str,
    user_id:      str,
    log_date:     date,
    completed:    Optional[bool]  = None,
    metric_value: Optional[float] = None,
) -> dict:
    """
    Orchestrates streak detection, XP calculation, and stat persistence
    after a habit_log row has been successfully inserted.

    Parameters
    ----------
    habit_id     : UUID string of the logged habit
    user_id      : UUID string of the habit owner
    log_date     : the date being logged (from HabitLogCreate)
    completed    : boolean value if metric_type == 'boolean'
    metric_value : numeric value if metric_type == 'numeric'

    Return shape
    ------------
    {
        "streak_updated":  bool,
        "current_streak":  int,
        "xp_gained":       int,
        "milestone_bonus": int,
        "total_xp":        int,
        "level":           int,
        "leveled_up":      bool,
        "old_level":       int,
        "longest_streak":  int,
        "message":         str,
    }
    """
    # Only award XP / update streak for genuinely completed logs
    is_completed = (completed is True) or (
        metric_value is not None and metric_value > 0
    )

    # Fetch current user stats once
    user_stats = await _fetch_user(user_id)

    if not is_completed:
        return {
            "streak_updated":  False,
            "current_streak":  user_stats["current_streak"] or 0,
            "xp_gained":       0,
            "milestone_bonus": 0,
            "total_xp":        user_stats["xp"],
            "level":           user_stats["level"],
            "leveled_up":      False,
            "old_level":       user_stats["level"],
            "longest_streak":  user_stats["longest_streak"] or 0,
            "message":         "No XP awarded — habit not marked complete.",
        }

    # 1. Recalculate habit streak
    new_streak = await _fetch_streak(habit_id, log_date)
    await _update_habit_streak(habit_id, new_streak)

    # 2. XP = base + milestone bonus
    milestone_bonus = _streak_milestone_bonus(new_streak)
    xp_gained       = XP_STANDARD_LOG + milestone_bonus

    # 3. Persist XP / level / longest_streak on users row
    updated = await _update_user_stats(
        user_id       = user_id,
        xp_gained     = xp_gained,
        new_streak    = new_streak,
        current_stats = user_stats,
    )

    # 4. Build motivational message
    message = _build_message(
        streak          = new_streak,
        milestone_bonus = milestone_bonus,
        leveled_up      = updated["leveled_up"],
        new_level       = updated["level"],
    )

    return {
        "streak_updated":  new_streak > 0,
        "current_streak":  new_streak,
        "xp_gained":       xp_gained,
        "milestone_bonus": milestone_bonus,
        "total_xp":        updated["xp"],
        "level":           updated["level"],
        "leveled_up":      updated["leveled_up"],
        "old_level":       updated["old_level"],
        "longest_streak":  updated["longest_streak"],
        "message":         message,
    }
