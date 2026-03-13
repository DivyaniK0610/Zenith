import os
import asyncio
from groq import AsyncGroq
from dotenv import load_dotenv

# Load environment variables (ensure .env is in the same directory and ignored by git)
load_dotenv()

# Initialize the async Groq client
client = AsyncGroq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

# System prompt optimized for Zenith's gamification and personalized coaching
ZENITH_SYSTEM_PROMPT = """You are Zenith, a high-performance AI productivity coach.
Your purpose is to analyze user habit logs and provide hyper-personalized, actionable advice.
Rules:
1. Keep responses short, punchy, and highly motivational.
2. If analyzing quantitative metrics (e.g., sleep hours, deep work sessions), connect them directly to performance outcomes.
3. Maintain a gamified tone—treat productivity as a strategic game to be won.
4. Do not be overly verbose or use generic self-help cliches."""

async def test_groq_connection():
    print("Initiating Groq API connection test...")
    
    # Mock retrieved context (RAG simulation)
    vectorized_context = "User logged 4.5 hours of sleep. User completed morning run (Boolean: True). User has a 3-day streak for running."
    
    user_prompt = f"Context: {vectorized_context}\n\nWhat is my move for today considering my current metrics?"

    try:
        response = await client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": ZENITH_SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
            model="llama-3.1-8b-instant",
            temperature=0.6,
            max_tokens=150,
        )
        
        print("\n✅ API Connection Successful!\n")
        print("🤖 Zenith AI Response:")
        print("-" * 40)
        print(response.choices[0].message.content)
        print("-" * 40)
        
    except Exception as e:
        print(f"\n❌ Error connecting to Groq API: {e}")
        print("Please verify that GROQ_API_KEY is correctly set in your .env file.")

if __name__ == "__main__":
    asyncio.run(test_groq_connection())