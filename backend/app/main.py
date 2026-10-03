from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

from app.database.database import engine
from app.models import models
from app.routers import clientes, ingresos, egresos, reportes

load_dotenv()

# Crear todas las tablas automáticamente al iniciar
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=os.getenv("APP_TITLE", "TuSoinRD - Control Financiero"),
    description="API para gestión de finanzas de TuSoinRD: ingresos, egresos, clientes y reportes.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — permite que el frontend (archivo HTML local) llame a la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, cambiar a tu dominio específico
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(clientes.router)
app.include_router(ingresos.router)
app.include_router(egresos.router)
app.include_router(reportes.router)


@app.get("/", tags=["Root"])
def root():
    return {
        "app": "TuSoinRD - Control Financiero",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "✅ API corriendo correctamente",
    }


@app.get("/health", tags=["Root"])
def health():
    return {"status": "ok"}
