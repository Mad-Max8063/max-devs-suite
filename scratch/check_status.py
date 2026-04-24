import requests
import os
from dotenv import load_dotenv

if os.path.exists('turnos/.env'):
    load_dotenv('turnos/.env', override=True)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

slug = "max-devs-solutions"
url = f"{SUPABASE_URL}/rest/v1/businesses?slug=eq.{slug}&select=is_premium,subscription_status,trial_ends_at"
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

response = requests.get(url, headers=headers)
if response.status_code == 200:
    data = response.json()
    if data:
        print(data[0])
    else:
        print("Business not found")
else:
    print(f"Error: {response.status_code}")
