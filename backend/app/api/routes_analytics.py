from fastapi import APIRouter, HTTPException, Query, status
from app.services.analytics import get_heatmap_matrix

router = APIRouter(
    prefix="/api/v1/analytics",
    tags=["Analytics"]
)

@router.get("/heatmap", status_code=status.HTTP_200_OK)
async def fetch_heatmap(
    user_id: str = Query(..., description="UUID of the user"),
    weeks: int = Query(12, ge=1, le=52)
):
    """
    Exposes Rutwik's heatmap aggregation function to the frontend.
    """
    try:
        # Calls the function in backend/app/services/analytics.py
        data = await get_heatmap_matrix(user_id=user_id, weeks=weeks)
        return {
            "message": "Heatmap data retrieved successfully",
            "data": data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analytics engine error: {str(e)}"
        )