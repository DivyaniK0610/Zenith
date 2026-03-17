from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes_habits import router as habits_router
from app.api.routes_chat import router as chat_router
from app.api.routes_game import router as game_router
from app.api.routes_goals import router as goals_router
from app.api.routes_timer import router as timer_router
from app.api.routes_achievements import router as achievements_router   # ← NEW


app = FastAPI(
    title="Zenith API",
    description="Production-grade backend for Zenith AI habit tracker",
    version="1.0.0"
)


origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://zenith-eta-ruddy.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pre-warm embedding model in background ──────────────────────────────
@app.on_event("startup")
async def startup_event():
    import asyncio
    asyncio.create_task(
        asyncio.to_thread(
            lambda: __import__('app.services.embedding', fromlist=['_get_model'])._get_model()
        )
    )
# ────────────────────────────────────────────────────────────────────────

from fastapi.exceptions import HTTPException, RequestValidationError
from app.api.error_handlers import safe_http_exception_handler, unhandled_exception_handler

app.add_exception_handler(HTTPException, safe_http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(habits_router)
app.include_router(chat_router)
app.include_router(game_router)
app.include_router(goals_router)
app.include_router(timer_router)
app.include_router(achievements_router)                                  # ← NEW

@app.get("/health")
async def health_check():
    return {"status": "Zenith API is live"}