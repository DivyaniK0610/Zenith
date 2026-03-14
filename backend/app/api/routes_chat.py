from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.services.llm_engine import chat_with_coach, analyze_habits
from app.services.embedding import upsert_user_context_embedding

router = APIRouter(
    prefix="/api/v1/chat",
    tags=["AI Coach"]
)

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    user_id: str = Field(..., description="UUID of the user")
    message: str = Field(..., min_length=1, max_length=1000)

class EmbedRequest(BaseModel):
    user_id: str = Field(..., description="UUID of the user to embed context for")

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/message", status_code=status.HTTP_200_OK)
async def send_message(request: ChatRequest):
    """
    Main AI Coach chat endpoint.
    Retrieves RAG context, calls Groq, returns the AI reply.
    """
    try:
        result = await chat_with_coach(
            user_id=request.user_id,
            user_message=request.message,
        )
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
    Refreshes embeddings before analyzing — always uses current data.
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
    Call this after bulk habit updates or on a daily schedule.
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