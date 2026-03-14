from app.db.supabase import supabase
from datetime import datetime, date, timedelta

def process_gamification_logic(user_id: str, habit_id: str):
    """
    Rutwik's Gamification Function:
    1. Awards XP for completing a habit.
    2. Updates user-level and habit-level streaks.
    """
    try:
        # 1. Award 10 XP for the log
        # Using a Supabase RPC or direct update to increment XP
        user_record = supabase.table("users").select("total_xp, current_streak, longest_streak").eq("id", user_id).single().execute()
        
        if not user_record.data:
            return None

        current_xp = user_record.data.get("total_xp", 0)
        new_xp = current_xp + 10
        
        # 2. Simple Streak Logic 
        # (In a full build, you'd check if the last log was yesterday. 
        # For now, we increment current_streak for the milestone)
        new_streak = user_record.data.get("current_streak", 0) + 1
        longest = user_record.data.get("longest_streak", 0)
        new_longest = max(new_streak, longest)

        # 3. Update the User Table
        supabase.table("users").update({
            "total_xp": new_xp,
            "current_streak": new_streak,
            "longest_streak": new_longest
        }).eq("id", user_id).execute()

        return {
            "xp_gained": 10,
            "total_xp": new_xp,
            "new_streak": new_streak,
            "is_milestone": new_streak % 5 == 0  # True every 5 days
        }
    except Exception as e:
        print(f"Gamification Error: {e}")
        return None