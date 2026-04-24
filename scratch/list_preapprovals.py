import requests
import os
from dotenv import load_dotenv

load_dotenv()

MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN")

headers = {
    "Authorization": f"Bearer {MP_ACCESS_TOKEN}"
}

print("Fetching recent preapprovals...")
response = requests.get("https://api.mercadopago.com/preapproval/search?sort=date_created:desc&limit=5", headers=headers)

if response.status_code == 200:
    data = response.json()
    results = data.get('results', [])
    if not results:
        print("No recent preapprovals found.")
    for res in results:
        print(f"ID: {res.get('id')} | Status: {res.get('status')} | Ref: {res.get('external_reference')} | Created: {res.get('date_created')}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
