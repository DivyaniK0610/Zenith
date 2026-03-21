from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel, Field
from typing import Optional
from app.db.supabase import supabase

router = APIRouter(
    prefix="/api/v1/goals",
    tags=["Goals"]
)

class GoalCreate(BaseModel):
    user_id:     str
    title:       str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=300)
    emoji:       Optional[str] = "🎯"
    target_date: Optional[str] = None

class GoalUpdate(BaseModel):
    title:       Optional[str] = None
    description: Optional[str] = None
    emoji:       Optional[str] = None
    target_date: Optional[str] = None
    status:      Optional[str] = None  # 'in_progress' | 'completed' | 'archived'

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_goal(goal: GoalCreate):
    try:
        response = supabase.table('macro_goals').insert(goal.model_dump()).execute()
        return {"message": "Goal created", "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create goal: {str(e)}")

@router.get("/", status_code=status.HTTP_200_OK)
async def get_goals(user_id: str = Query(...)):
    try:
        response = (
            supabase.table('macro_goals')
            .select('*')
            .eq('user_id', user_id)
            .neq('status', 'archived')
            .order('created_at', desc=False)
            .execute()
        )
        return {"message": "Goals retrieved", "data": response.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch goals: {str(e)}")

@router.delete("/{goal_id}", status_code=status.HTTP_200_OK)
async def delete_goal(goal_id: str):
    try:
        # Unlink habits from this goal first
        supabase.table('habits').update(
            {"macro_goal_id": None}
        ).eq('macro_goal_id', goal_id).execute()
        supabase.table('macro_goals').delete().eq('id', goal_id).execute()
        return {"message": "Goal deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete goal: {str(e)}")

@router.patch("/{goal_id}", status_code=status.HTTP_200_OK)
async def update_goal(goal_id: str, update: GoalUpdate):
    try:
        data = {k: v for k, v in update.model_dump().items() if v is not None}
        response = supabase.table('macro_goals').update(data).eq('id', goal_id).execute()
        return {"message": "Goal updated", "data": response.data[0] if response.data else {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update goal: {str(e)}")

@router.patch("/{goal_id}/assign/{habit_id}", status_code=status.HTTP_200_OK)
async def assign_habit_to_goal(goal_id: str, habit_id: str):
    try:
        response = supabase.table('habits').update(
            {"macro_goal_id": goal_id}
        ).eq('id', habit_id).execute()
        return {"message": "Habit assigned to goal", "data": response.data[0] if response.data else {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to assign habit: {str(e)}")

@router.patch("/unassign/{habit_id}", status_code=status.HTTP_200_OK)
async def unassign_habit_from_goal(habit_id: str):
    try:
        response = supabase.table('habits').update(
            {"macro_goal_id": None}
        ).eq('id', habit_id).execute()
        return {"message": "Habit unassigned", "data": response.data[0] if response.data else {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to unassign habit: {str(e)}")
