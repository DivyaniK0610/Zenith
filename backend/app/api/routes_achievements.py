from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from app.db.supabase import supabase

router = APIRouter(
    prefix="/api/v1/achievements",
    tags=["Achievements"]
)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class AchievementUnlock(BaseModel):
    user_id:        str  = Field(..., description="UUID of the user")
    achievement_id: str  = Field(..., description="Slug of the achievement, e.g. 'streak_7'")


# ---------------------------------------------------------------------------
# GET  /api/v1/achievements/:user_id
# Returns all earned achievement records for this user
# ---------------------------------------------------------------------------

@router.get("/{user_id}", status_code=status.HTTP_200_OK)
async def get_achievements(user_id: str):
    """
    Returns every achievement the user has earned, with earned_at timestamps.
    Shape: [{ achievement_id, earned_at }]
    """
    try:
        response = (
            supabase
            .table("user_achievements")
            .select("achievement_id, earned_at")
            .eq("user_id", user_id)
            .order("earned_at", desc=False)
            .execute()
        )
        return {
            "message": "Achievements retrieved",
            "data": response.data or [],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve achievements: {str(e)}"
        )


# ---------------------------------------------------------------------------
# POST /api/v1/achievements/unlock
# Idempotent — safe to call multiple times for the same achievement.
# Uses upsert so a second unlock of the same badge is a no-op.
# ---------------------------------------------------------------------------

@router.post("/unlock", status_code=status.HTTP_200_OK)
async def unlock_achievement(payload: AchievementUnlock):
    """
    Persists a single achievement unlock for a user.
    Idempotent: calling this twice for the same (user, achievement) pair
    is safe — Supabase upserts on the UNIQUE constraint and returns
    the existing row without erroring.
    """
    try:
        response = (
            supabase
            .table("user_achievements")
            .upsert(
                {
                    "user_id":        payload.user_id,
                    "achievement_id": payload.achievement_id,
                },
                on_conflict="user_id,achievement_id",   # honour the UNIQUE constraint
                ignore_duplicates=True,                  # no-op on duplicate
            )
            .execute()
        )
        return {
            "message": "Achievement unlocked",
            "data": response.data[0] if response.data else {},
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unlock achievement: {str(e)}"
        )


# ---------------------------------------------------------------------------
# POST /api/v1/achievements/sync
# Bulk-upsert all achievement IDs that the client already knows are earned.
# Called once on first page load to back-fill pre-existing progress.
# ---------------------------------------------------------------------------

class SyncPayload(BaseModel):
    user_id:         str        = Field(..., description="UUID of the user")
    achievement_ids: list[str]  = Field(..., description="All currently earned achievement slugs")


@router.post("/sync", status_code=status.HTTP_200_OK)
async def sync_achievements(payload: SyncPayload):
    """
    Bulk back-fill achievements that were computed client-side but not yet
    persisted (e.g. first run after migration, or existing users upgrading).

    Sends a single upsert batch — safe to call repeatedly.
    """
    if not payload.achievement_ids:
        return {"message": "Nothing to sync", "data": []}

    try:
        rows = [
            {"user_id": payload.user_id, "achievement_id": aid}
            for aid in payload.achievement_ids
        ]
        response = (
            supabase
            .table("user_achievements")
            .upsert(rows, on_conflict="user_id,achievement_id", ignore_duplicates=True)
            .execute()
        )
        return {
            "message": f"Synced {len(payload.achievement_ids)} achievements",
            "data": response.data or [],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync achievements: {str(e)}"
        )