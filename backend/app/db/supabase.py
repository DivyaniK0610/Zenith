import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from your .env file
load_dotenv()

# Get the credentials from .env
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Safety Check
if not url or not key:
    raise ValueError("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env file!")

# Create the client instance
supabase: Client = create_client(url, key)



