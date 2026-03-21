from fastapi import APIRouter, HTTPException, status, Query
from app.db.supabase import supabase

router = APIRouter(
    prefix="/api/v1/game",
    tags=["Gamification"]
)

@router.get("/stats/{user_id}", status_code=status.HTTP_200_OK)
async def get_user_stats(user_id: str):
    """
    Returns the full gamification profile for a user:
    XP, level, current streak, longest streak.
    Called on app load to hydrate the frontend store.
    """
    try:
        response = (
            supabase.table('users')
            .select('id, xp, level, current_streak, longest_streak')
            .eq('id', user_id)
            .single()
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found.")
        return {
            "message": "Stats retrieved successfully",
            "data": response.data,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve stats: {str(e)}"
        )


@router.get("/leaderboard", status_code=status.HTTP_200_OK)
async def get_leaderboard(limit: int = Query(default=10, le=50)):
    """
    Returns top users ranked by XP.
    Useful for a future social/competitive feature.
    """
    try:
        response = (
            supabase.table('users')
            .select('id, xp, level, current_streak')
            .order('xp', desc=True)
            .limit(limit)
            .execute()
        )
        return {
            "message": "Leaderboard retrieved",
            "data": response.data or [],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve leaderboard: {str(e)}"
        )

from app.services.analytics import get_heatmap_matrix, get_daily_completion_rate

@router.get("/heatmap/{user_id}", status_code=status.HTTP_200_OK)
async def get_heatmap(user_id: str, weeks: int = Query(default=12, le=52)):
    try:
        data = await get_heatmap_matrix(user_id=user_id, weeks=weeks)
        return {"message": "Heatmap data retrieved", "data": data}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to build heatmap: {str(e)}"
        )


@router.get("/daily-rate/{user_id}", status_code=status.HTTP_200_OK)
async def get_daily_rate(user_id: str, days: int = Query(default=30, le=365)):
    try:
        data = await get_daily_completion_rate(user_id=user_id, days=days)
        return {"message": "Daily rates retrieved", "data": data}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve daily rates: {str(e)}"
        )
