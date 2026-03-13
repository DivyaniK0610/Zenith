from fastapi import APIRouter, HTTPException, status, Query
from app.db.schemas import HabitCreate, HabitLogCreate
from app.db.supabase import supabase

router = APIRouter(
    prefix="/api/v1/habits",
    tags=["Habits"]
)

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_habit(habit: HabitCreate):
    """
    Validates and creates a new habit in the Supabase database.
    """
    try:
        habit_dict = habit.model_dump()
        
        # Execute Supabase insert
        response = supabase.table('habits').insert(habit_dict).execute()
        
        return {
            "message": "Habit created successfully",
            "data": response.data[0]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process habit creation: {str(e)}"
        )

@router.get("/", status_code=status.HTTP_200_OK)
async def get_all_habits(user_id: str = Query(..., description="UUID of the user to fetch habits for")):
    """
    Fetches all habits for a specific user.
    """
    try:
        # Fetch habits filtering by the provided user_id
        response = supabase.table('habits').select('*').eq('user_id', user_id).execute()
        
        return {
            "message": "Habits retrieved successfully",
            "data": response.data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve habits: {str(e)}"
        )

@router.post("/log", status_code=status.HTTP_201_CREATED)
async def log_habit(habit_log: HabitLogCreate):
    """
    Validates and logs a daily habit entry to Supabase.
    """
    try:
        # Convert date to string for JSON serialization
        log_dict = habit_log.model_dump()
        log_dict['log_date'] = log_dict['log_date'].isoformat()
        
        # Execute Supabase insert
        response = supabase.table('habit_logs').insert(log_dict).execute()
        
        return {
            "message": "Habit log recorded successfully",
            "data": response.data[0]
        }
    except Exception as e:
        # Check for unique constraint violation (duplicate log for same day)
        if "duplicate key value violates unique constraint" in str(e):
             raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A log already exists for this habit on this date."
            )
             
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process habit log: {str(e)}"
        )