import requests
import sqlite3
import os
from datetime import datetime, timedelta

uuid = 'test-user-123'
base_url = 'http://localhost:8000'

print('--- SUITO BACKEND SMOKE TEST ---')

try:
    print(f'1. Consultando estado inicial de {uuid}...')
    r1 = requests.get(f'{base_url}/user/status/{uuid}')
    print(f'   Respuesta: {r1.status_code} - {r1.json() if r1.status_code==200 else "User not found"}')
except Exception as e:
    print(f'   Error de conexión: {e}. ¿Está el servidor corriendo?')

print('\n2. Simulando persistencia en DB...')
try:
    conn = sqlite3.connect('suito.db')
    cursor = conn.cursor()
    # Asegurar que la tabla existe (aunque uvicorn ya debería haberla creado)
    cursor.execute('''CREATE TABLE IF NOT EXISTS users 
                      (id INTEGER PRIMARY KEY, uuid TEXT UNIQUE, status TEXT, expiration_date DATETIME)''')
    
    exp_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute("INSERT OR REPLACE INTO users (uuid, status, expiration_date) VALUES (?, ?, ?)", 
                   (uuid, 'paid_one_time', exp_date))
    conn.commit()
    conn.close()
    print('   [OK] Registro insertado manualmente en suito.db')
except Exception as e:
    print(f'   Error de base de datos: {e}')

print('\n3. Verificando actualización vía API...')
try:
    r2 = requests.get(f'{base_url}/user/status/{uuid}')
    data = r2.json()
    print(f'   Respuesta Final: {data}')
    if data.get('is_premium') == True:
        print('\n✅ TEST EXITOSO: El backend reconoce al usuario como PREMIUM.')
    else:
        print('\n❌ TEST FALLIDO: El status no cambió.')
except Exception as e:
    print(f'   Error en verificación final: {e}')
