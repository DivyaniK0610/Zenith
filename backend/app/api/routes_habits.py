from fastapi import APIRouter, HTTPException, status, Query
from app.db.schemas import HabitCreate, HabitLogCreate
from app.db.supabase import supabase
# PHASE 3: Importing the new gamification engine
from app.services.gamification import process_habit_log

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
    Logs a habit entry and triggers the gamification engine.
    """
    try:
        log_dict = habit_log.model_dump()
        log_dict['log_date'] = log_dict['log_date'].isoformat()
        
        # A. Fetch user_id
        habit_info = supabase.table('habits').select('user_id').eq('id', habit_log.habit_id).single().execute()
        if not habit_info.data:
            raise HTTPException(status_code=404, detail="Habit not found")
        
        user_id = habit_info.data['user_id']

        # B. Insert the log
        response = supabase.table('habit_logs').insert(log_dict).execute()
        
        # C. TRIGGER THE GAMIFICATION (Matching the imported name)
        game_stats = await process_habit_log(
        habit_id=str(habit_log.habit_id),
        user_id=user_id,
        log_date=habit_log.log_date,
        completed=habit_log.completed,
        metric_value=habit_log.metric_value
    )
        
        return {
            "message": "Habit logged and XP updated",
            "data": response.data[0],
            "gamification": game_stats 
        }

    except HTTPException:
        raise
    except Exception as e:
        if "duplicate key value" in str(e):
            raise HTTPException(status_code=409, detail="Log already exists for this date.")
        raise HTTPException(status_code=500, detail=f"Failed to log habit: {str(e)}")