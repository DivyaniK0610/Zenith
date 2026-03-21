from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.services.llm_engine import chat_with_coach, analyze_habits
from app.services.embedding import upsert_user_context_embedding
from app.db.supabase import supabase

router = APIRouter(
    prefix="/api/v1/chat",
    tags=["AI Coach"]
)

# Schemas

class ChatRequest(BaseModel):
    user_id: str = Field(..., description="UUID of the user")
    message: str = Field(..., min_length=1, max_length=1000)

class EmbedRequest(BaseModel):
    user_id: str = Field(..., description="UUID of the user to embed context for")

# Endpoints

@router.get("/history/{user_id}", status_code=status.HTTP_200_OK)
async def get_chat_history(user_id: str, limit: int = 100):
    """
    Returns the last `limit` messages for a user, oldest first.
    Called on page load to restore the conversation.
    """
    try:
        response = (
            supabase.table("chat_messages")
            .select("id, role, content, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return {
            "message": "History retrieved",
            "data": response.data or [],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve history: {str(e)}"
        )


@router.delete("/history/{user_id}", status_code=status.HTTP_200_OK)
async def clear_chat_history(user_id: str):
    """Wipes all chat messages for a user."""
    try:
        supabase.table("chat_messages").delete().eq("user_id", user_id).execute()
        return {"message": "Chat history cleared"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear history: {str(e)}"
        )


@router.post("/message", status_code=status.HTTP_200_OK)
async def send_message(request: ChatRequest):
    """
    Main AI Coach chat endpoint.
    Persists both the user message and the AI reply to Supabase.
    """
    try:
        # 1. Persist user message
        supabase.table("chat_messages").insert({
            "user_id": request.user_id,
            "role": "user",
            "content": request.message,
        }).execute()

        # 2. Generate reply
        result = await chat_with_coach(
            user_id=request.user_id,
            user_message=request.message,
        )

        # 3. Persist assistant reply
        supabase.table("chat_messages").insert({
            "user_id": request.user_id,
            "role": "assistant",
            "content": result["reply"],
        }).execute()

        return {
            "message": "Response generated successfully",
            "data": result,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LLM call failed: {str(e)}"
        )


@router.get("/analyze/{user_id}", status_code=status.HTTP_200_OK)
async def get_habit_analysis(user_id: str):
    """
    Runs a deep 3-insight analysis of the user's habit patterns.
    """
    try:
        result = await analyze_habits(user_id=user_id)
        return {
            "message": "Analysis complete",
            "data": result,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post("/embed", status_code=status.HTTP_200_OK)
async def refresh_user_embedding(request: EmbedRequest):
    """
    Manually triggers a re-embedding of the user's habit context.
    """
    try:
        result = await upsert_user_context_embedding(user_id=request.user_id)
        return {
            "message": "Embedding refreshed successfully",
            "data": result,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Embedding failed: {str(e)}"
        )
