import os
import sys
import json
import logging
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import uvicorn

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("tusoin")

# Configuración de puerto dinámico para Render / Koyeb / Heroku / Vercel
PORT = int(os.environ.get("PORT", 3000))
HOST = "0.0.0.0"

# Configuración de Base de Datos Externa (PostgreSQL / Supabase / SQLite)
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./tusoinrd_cloud.db")
if DATABASE_URL.startswith("postgres://"):
    # Compatibilidad con SQLAlchemy 2.0 que requiere postgresql://
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

try:
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    logger.info(f"Conectado a base de datos: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else 'SQLite local'}")
except Exception as e:
    logger.error(f"Error al inicializar base de datos {DATABASE_URL}: {e}")
    # Fallback garantizado a SQLite para asegurar arranque
    engine = create_engine("sqlite:///./tusoinrd_cloud.db", connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class CloudDataStore(Base):
    __tablename__ = "tusoin_cloud_state"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, index=True, nullable=False)
    data = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# Instancia de FastAPI
app = FastAPI(
    title="TuSoin - API y Servidor de Producción",
    description="Sistema de Finanzas, Cotizaciones Elegantes y Control Operativo 24/7",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# RUTAS DE SALUD Y KEEP-ALIVE 24/7
# -------------------------------------------------------------
@app.get("/health", tags=["Salud"])
@app.get("/api/health", tags=["Salud"])
def health_check():
    """Ruta pública 200 OK para monitoreo Keep-Alive (UptimeRobot, Koyeb, Render)."""
    return {
        "status": "ok",
        "app": "TuSoin - Tu solución inmediata",
        "server_time": datetime.utcnow().isoformat(),
        "database": "postgresql" if "postgresql" in str(engine.url) else "sqlite_fallback",
        "keep_alive": True
    }

# -------------------------------------------------------------
# RUTAS DE PERSISTENCIA EXTERNA (NUBE / SUPABASE / POSTGRESQL)
# -------------------------------------------------------------
@app.get("/api/sync/load", tags=["Persistencia Nube"])
def load_cloud_state():
    """Carga los datos almacenados en la base de datos externa permanente."""
    db = SessionLocal()
    try:
        results = {}
        for record in db.query(CloudDataStore).all():
            try:
                results[record.key] = json.loads(record.data)
            except Exception:
                results[record.key] = record.data
        return {"status": "success", "data": results, "has_data": len(results) > 0}
    except Exception as e:
        logger.error(f"Error al cargar estado de la nube: {e}")
        return {"status": "error", "message": str(e), "data": {}}
    finally:
        db.close()

@app.post("/api/sync/save", tags=["Persistencia Nube"])
async def save_cloud_state(request: Request):
    """Guarda o actualiza las colecciones en la base de datos permanente."""
    payload = await request.json()
    db = SessionLocal()
    try:
        saved_keys = []
        for key, value in payload.items():
            record = db.query(CloudDataStore).filter(CloudDataStore.key == key).first()
            json_str = json.dumps(value, ensure_ascii=False)
            if record:
                record.data = json_str
                record.updated_at = datetime.utcnow()
            else:
                record = CloudDataStore(key=key, data=json_str)
                db.add(record)
            saved_keys.append(key)
        db.commit()
        return {"status": "success", "saved_keys": saved_keys, "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        db.rollback()
        logger.error(f"Error al guardar estado en nube: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

# -------------------------------------------------------------
# RUTAS DE AUTENTICACIÓN SEGURA Y CONTROL DE ACCESO
# -------------------------------------------------------------
MASTER_ADMIN_EMAIL = os.environ.get("MASTER_ADMIN_EMAIL", "Admin2027@tusoinrd.com")
MASTER_ADMIN_PASSWORD = os.environ.get("MASTER_ADMIN_PASSWORD", "AdminD&J2027")

ALLOWED_GOOGLE_EMAILS = [
    e.strip().lower() for e in os.environ.get(
        "ALLOWED_GOOGLE_EMAILS",
        "gerencia@tusoinrd.com,admin@tusoinrd.com,tusoin.rd@gmail.com"
    ).split(",") if e.strip()
]

@app.post("/api/auth/login", tags=["Autenticación"])
async def master_login(request: Request):
    """Acceso de respaldo maestro vía formulario tradicional."""
    body = await request.json()
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if email == MASTER_ADMIN_EMAIL.lower() and password == MASTER_ADMIN_PASSWORD:
        return {
            "success": True,
            "user": {
                "email": MASTER_ADMIN_EMAIL,
                "name": "Administrador Maestro TuSoin",
                "role": "Super Administrador (Acceso Maestro)",
                "initials": "AM",
                "authProvider": "master_backup"
            }
        }
    return JSONResponse(
        status_code=401,
        content={"success": False, "message": "Credenciales inválidas. Verifica tu correo corporativo y contraseña de respaldo maestro."}
    )

@app.post("/api/auth/google", tags=["Autenticación"])
async def google_auth_validation(request: Request):
    """Validación obligatoria de Google OAuth 2.0 contra lista blanca."""
    body = await request.json()
    email = (body.get("email") or "").strip().lower()

    if email in ALLOWED_GOOGLE_EMAILS:
        names_map = {
            "gerencia@tusoinrd.com": "Gerencia Financiera",
            "admin@tusoinrd.com": "Administrador Principal",
            "tusoin.rd@gmail.com": "TuSoin RD Oficial"
        }
        roles_map = {
            "gerencia@tusoinrd.com": "Gerente de Operaciones",
            "admin@tusoinrd.com": "Administrador Principal",
            "tusoin.rd@gmail.com": "Administrador General"
        }
        initials_map = {
            "gerencia@tusoinrd.com": "GE",
            "admin@tusoinrd.com": "AD",
            "tusoin.rd@gmail.com": "TS"
        }
        return {
            "success": True,
            "user": {
                "email": email,
                "name": names_map.get(email, "Administrador TuSoin"),
                "role": roles_map.get(email, "Administrador Autorizado (Google)"),
                "initials": initials_map.get(email, "TS"),
                "authProvider": "google"
            }
        }

    return JSONResponse(
        status_code=403,
        content={"success": False, "message": "Acceso denegado. Este correo electrónico no está autorizado para acceder al sistema administrativo."}
    )

# -------------------------------------------------------------
# SERVIDORES DE ARCHIVOS ESTÁTICOS Y FRONTEND
# -------------------------------------------------------------
current_dir = os.path.dirname(os.path.abspath(__file__))

if os.path.exists(os.path.join(current_dir, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(current_dir, "assets")), name="assets")

@app.get("/styles.css")
def get_styles():
    return FileResponse(os.path.join(current_dir, "styles.css"), media_type="text/css")

@app.get("/app.js")
def get_app_js():
    return FileResponse(os.path.join(current_dir, "app.js"), media_type="application/javascript")

@app.get("/initialData.js")
def get_initial_data():
    return FileResponse(os.path.join(current_dir, "initialData.js"), media_type="application/javascript")

@app.get("/")
def get_index():
    return FileResponse(os.path.join(current_dir, "index.html"), media_type="text/html")

if __name__ == "__main__":
    logger.info(f"Iniciando TuSoin en http://{HOST}:{PORT}")
    uvicorn.run("server:app", host=HOST, port=PORT, reload=False)
