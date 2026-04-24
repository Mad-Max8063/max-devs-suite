import requests
import os
from dotenv import load_dotenv

if os.path.exists('turnos/.env'):
    load_dotenv('turnos/.env', override=True)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

slug = "max-devs-solutions"
url = f"{SUPABASE_URL}/rest/v1/businesses?slug=eq.{slug}"
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

data = {
    "is_premium": False,
    "subscription_status": "trialing"
}

response = requests.patch(url, headers=headers, json=data)
if response.status_code in [200, 204]:
    print("Successfully reset business status to non-premium for testing.")
else:
    print(f"Error: {response.status_code}")
    print(response.text)
