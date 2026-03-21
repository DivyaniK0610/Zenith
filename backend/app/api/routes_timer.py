from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel, Field
from typing import Optional
from app.db.supabase import supabase

router = APIRouter(
    prefix="/api/v1/timer",
    tags=["Timer Sessions"]
)

class TimerSessionCreate(BaseModel):
    user_id:      str
    mode:         str   = Field(..., description="focus | short_break | long_break")
    duration_mins: int  = Field(..., ge=1, le=120)
    habit_id:     Optional[str] = None
    habit_title:  Optional[str] = None
    note:         Optional[str] = Field(None, max_length=300)
    completed_at: Optional[str] = None   # ISO timestamp, defaults to now()


@router.post("/sessions", status_code=status.HTTP_201_CREATED)
async def log_timer_session(session: TimerSessionCreate):
    """
    Persists a completed Pomodoro session to the database.
    Called after every focus/break completion.
    """
    try:
        payload = {
            "user_id":      session.user_id,
            "mode":         session.mode,
            "duration_mins": session.duration_mins,
            "habit_id":     session.habit_id,
            "habit_title":  session.habit_title,
            "note":         session.note or "",
        }
        if session.completed_at:
            payload["completed_at"] = session.completed_at

        response = supabase.table("timer_sessions").insert(payload).execute()
        return {
            "message": "Session logged",
            "data": response.data[0] if response.data else {},
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to log session: {str(e)}"
        )


@router.get("/sessions/{user_id}", status_code=status.HTTP_200_OK)
async def get_timer_sessions(
    user_id: str,
    limit:   int = Query(default=50, le=200),
    offset:  int = Query(default=0),
    mode:    Optional[str] = Query(default=None, description="Filter by mode: focus | short_break | long_break"),
):
    """
    Returns paginated timer session history for a user, newest first.
    """
    try:
        query = (
            supabase.table("timer_sessions")
            .select("*")
            .eq("user_id", user_id)
            .order("completed_at", desc=True)
            .range(offset, offset + limit - 1)
        )
        if mode:
            query = query.eq("mode", mode)

        response = query.execute()
        return {
            "message": "Sessions retrieved",
            "data": response.data or [],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch sessions: {str(e)}"
        )


@router.get("/stats/{user_id}", status_code=status.HTTP_200_OK)
async def get_timer_stats(user_id: str):
    """
    Returns aggregate stats: total focus time, sessions this week, streak days, etc.
    """
    try:
        response = (
            supabase.table("timer_sessions")
            .select("mode, duration_mins, completed_at, habit_id")
            .eq("user_id", user_id)
            .eq("mode", "focus")
            .execute()
        )
        sessions = response.data or []

        total_mins    = sum(s["duration_mins"] for s in sessions)
        total_sessions = len(sessions)
        habits_hit    = len(set(s["habit_id"] for s in sessions if s.get("habit_id")))

        # Sessions this week
        from datetime import datetime, timedelta, timezone
        week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        weekly = [s for s in sessions if s["completed_at"] and s["completed_at"] >= week_ago]

        return {
            "message": "Stats retrieved",
            "data": {
                "total_focus_mins":    total_mins,
                "total_sessions":      total_sessions,
                "habits_hit":          habits_hit,
                "sessions_this_week":  len(weekly),
                "focus_mins_this_week": sum(s["duration_mins"] for s in weekly),
                "cycles_completed":    total_sessions // 4,
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch stats: {str(e)}"
        )
