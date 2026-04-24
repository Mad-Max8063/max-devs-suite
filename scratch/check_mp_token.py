import requests
import os
from dotenv import load_dotenv

load_dotenv()

MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN")

print(f"Testing MP_ACCESS_TOKEN: {MP_ACCESS_TOKEN[:10]}...")

headers = {
    "Authorization": f"Bearer {MP_ACCESS_TOKEN}"
}

try:
    response = requests.get("https://api.mercadopago.com/users/me", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print("[OK] Token is valid!")
        print(f"Seller ID: {data.get('id')}")
        print(f"Nickname: {data.get('nickname')}")
    else:
        print(f"[ERROR] Token is invalid or expired. Status: {response.status_code}")
        print(response.json())
except Exception as e:
    print(f"[CRITICAL] Error connecting to Mercado Pago: {e}")
