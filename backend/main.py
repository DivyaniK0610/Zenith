from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Updated import path based on your new app/api structure
from app.api.routes_habits import router as habits_router

app = FastAPI(
    title="Zenith API",
    description="Production-grade backend for Zenith AI habit tracker",
    version="1.0.0"
)

origins = [
    "http://localhost:3000",
    "http://localhost:5173", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the modular routes
app.include_router(habits_router)

@app.get("/health")
async def health_check():
    """Basic health check to verify API status."""
    return {"status": "Zenith API is live"}