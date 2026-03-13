from fastapi import APIRouter, HTTPException, status

# Updated import path based on your new app/db structure
from app.db.schemas import HabitCreate, HabitLogCreate

# Initialize the router
router = APIRouter(
    prefix="/api/v1/habits",
    tags=["Habits"]
)

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_habit(habit: HabitCreate):
    """
    Validates and creates a new habit.
    Sahil: Plug in the Supabase db/supabase.py insertion logic here.
    """
    try:
        # Pydantic has already strictly validated 'habit' at this point.
        habit_dict = habit.model_dump()
        
        # --- SAHIL'S DB LOGIC GOES HERE ---
        # Example:
        # response = supabase.table('habits').insert(habit_dict).execute()
        # return response.data
        # ----------------------------------
        
        return {
            "message": "Habit validated and ready for DB insertion",
            "validated_data": habit_dict
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process habit creation: {str(e)}"
        )

@router.post("/log", status_code=status.HTTP_201_CREATED)
async def log_habit(habit_log: HabitLogCreate):
    """
    Validates and logs a daily habit entry.
    Sahil: Plug in the Supabase db/supabase.py insertion logic here.
    """
    try:
        log_dict = habit_log.model_dump()
        
        # --- SAHIL'S DB LOGIC GOES HERE ---
        # Example:
        # response = supabase.table('habit_logs').insert(log_dict).execute()
        # return response.data
        # ----------------------------------
        
        return {
            "message": "Habit log validated successfully",
            "validated_data": log_dict
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process habit log: {str(e)}"
        )