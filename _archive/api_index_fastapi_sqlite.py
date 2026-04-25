from fastapi import FastAPI, Request, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, ForeignKey, Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime, timedelta
import mercadopago
import os
import json

# --- CONFIGURATION ---
# Nota: Pedir estas credenciales al usuario si no están en el entorno
MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN", "TU_ACCESS_TOKEN_AQUÍ")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./suito.db") # O la URL de Supabase Postgres

sdk = mercadopago.SDK(MP_ACCESS_TOKEN)

# --- DATABASE MODELS ---
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True) # ID de Supabase Auth
    email = Column(String, unique=True)
    status = Column(String, default="free") # free, paid_one_time, subscribed
    expiration_date = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    mp_payment_id = Column(String, unique=True)
    amount = Column(Numeric)
    status = Column(String) # approved, pending, rejected
    payment_type = Column(String) # single, subscription
    created_at = Column(DateTime, default=datetime.utcnow)

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    mp_preapproval_id = Column(String, unique=True)
    status = Column(String) # authorized, paused, cancelled
    next_billing_date = Column(DateTime)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

# --- API INITIALIZATION ---
app = FastAPI(title="Suito Monetization Engine")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- WEBHOOK HANDLER ---

@app.post("/webhooks/mercadopago")
async def mp_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Punto de entrada único para Webhooks de Mercado Pago.
    Maneja tanto pagos únicos como suscripciones (preapprovals).
    """
    payload = await request.json()
    print(f"Webhook recibido: {json.dumps(payload)}")

    resource_id = payload.get("data", {}).get("id")
    topic = payload.get("type") or payload.get("topic")

    if not resource_id or not topic:
        return {"status": "ignored"}

    if topic == "payment":
        # Lógica para Pago Único
        payment_info = sdk.payment().get(resource_id)
        if payment_info["status"] == 200:
            data = payment_info["response"]
            status = data["status"]
            external_reference = data.get("external_reference") # Aquí debe venir el UUID de Supabase
            
            if status == "approved":
                activate_user_plan(external_reference, resource_id, data["transaction_amount"], db)
                return {"status": "success", "action": "plan_activated"}

    elif topic == "subscription" or topic == "preapproval":
        # Lógica para Suscripciones
        sub_info = sdk.preapproval().get(resource_id)
        if sub_info["status"] == 200:
            data = sub_info["response"]
            status = data["status"]
            external_reference = data.get("external_reference")
            
            if status == "authorized":
                handle_subscription_activation(external_reference, resource_id, db)
                return {"status": "success", "action": "subscription_active"}

    return {"status": "received"}

# --- LOGICA DE NEGOCIO ---

def activate_user_plan(user_uuid: str, payment_id: str, amount: float, db: Session):
    user = db.query(User).filter(User.uuid == user_uuid).first()
    if not user:
        # Si el usuario no existe en nuestra DB local pero viene de Supabase, lo creamos
        user = User(uuid=user_uuid, status="free")
        db.add(user)
        db.commit()
        db.refresh(user)

    # Evitar duplicados de pago
    existing_payment = db.query(Payment).filter(Payment.mp_payment_id == str(payment_id)).first()
    if existing_payment:
        return

    # Actualizar Usuario
    user.status = "paid_one_time"
    user.expiration_date = datetime.utcnow() + timedelta(days=30)
    
    # Registrar Pago
    new_payment = Payment(
        user_id=user.id,
        mp_payment_id=str(payment_id),
        amount=amount,
        status="approved",
        payment_type="single"
    )
    
    db.add(new_payment)
    db.commit()
    print(f"Plan activado para usuario {user_uuid} hasta {user.expiration_date}")

def handle_subscription_activation(user_uuid: str, preapproval_id: str, db: Session):
    user = db.query(User).filter(User.uuid == user_uuid).first()
    if user:
        user.status = "subscribed"
        user.expiration_date = None # Las suscripciones no "expiran" mientras estén activas
        
        # Registrar o actualizar suscripción
        sub = db.query(Subscription).filter(Subscription.mp_preapproval_id == str(preapproval_id)).first()
        if not sub:
            sub = Subscription(
                user_id=user.id,
                mp_preapproval_id=str(preapproval_id),
                status="authorized"
            )
            db.add(sub)
        else:
            sub.status = "authorized"
            
        db.commit()

# --- ENDPOINTS DE CONTROL ---

@app.get("/user/status/{uuid}")
def get_user_status(uuid: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.uuid == uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check for expiration on the fly
    if user.status == "paid_one_time" and user.expiration_date < datetime.utcnow():
        user.status = "free"
        db.commit()
        
    return {
        "status": user.status,
        "expiration_date": user.expiration_date,
        "is_premium": user.status in ["paid_one_time", "subscribed"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
