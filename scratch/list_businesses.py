import requests
import os
from dotenv import load_dotenv

if os.path.exists('turnos/.env'):
    load_dotenv('turnos/.env', override=True)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

url = f"{SUPABASE_URL}/rest/v1/businesses?select=slug,nombre_negocio"
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

response = requests.get(url, headers=headers)
if response.status_code == 200:
    for biz in response.json():
        print(f"Slug: {biz['slug']} | Name: {biz['nombre_negocio']}")
else:
    print(f"Error: {response.status_code}")
