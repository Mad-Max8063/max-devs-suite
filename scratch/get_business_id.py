import sys
import argparse
import requests
import os
from dotenv import load_dotenv

# Prioritize turnos/.env
if os.path.exists('turnos/.env'):
    load_dotenv('turnos/.env', override=True)
else:
    load_dotenv(override=True)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

print(f"Using Supabase URL: {SUPABASE_URL}")

if not SUPABASE_URL or "mock" in SUPABASE_URL:
    print("Error: Supabase credentials are still 'mock' or missing.")
    sys.exit(1)

def get_business_id(slug):
    url = f"{SUPABASE_URL}/rest/v1/businesses?slug=eq.{slug}&select=id,nombre_negocio"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            if data:
                biz = data[0]
                print(f"Business Found: {biz['nombre_negocio']}")
                print(f"ID: {biz['id']}")
            else:
                print(f"No business found for slug: {slug}")
        else:
            print(f"Error querying Supabase: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--slug", required=True, help="Business slug")
    args = parser.parse_args()
    
    get_business_id(args.slug)
