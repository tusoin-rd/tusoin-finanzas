from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date

from app.database.database import get_db
from app.models.models import Ingreso
from app.schemas.schemas import IngresoCreate, IngresoUpdate, IngresoOut

router = APIRouter(prefix="/ingresos", tags=["Ingresos"])


@router.get("/", response_model=List[IngresoOut])
def listar_ingresos(
    skip: int = 0,
    limit: int = 100,
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    cliente_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Lista ingresos con filtros opcionales por fecha y cliente."""
    query = db.query(Ingreso).options(joinedload(Ingreso.cliente))

    if fecha_desde:
        query = query.filter(Ingreso.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Ingreso.fecha <= fecha_hasta)
    if cliente_id:
        query = query.filter(Ingreso.cliente_id == cliente_id)

    return query.order_by(Ingreso.fecha.desc()).offset(skip).limit(limit).all()


@router.get("/{ingreso_id}", response_model=IngresoOut)
def obtener_ingreso(ingreso_id: int, db: Session = Depends(get_db)):
    """Obtiene un ingreso por su ID."""
    ingreso = db.query(Ingreso).options(
        joinedload(Ingreso.cliente)
    ).filter(Ingreso.id == ingreso_id).first()
    if not ingreso:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return ingreso


@router.post("/", response_model=IngresoOut, status_code=201)
def crear_ingreso(ingreso: IngresoCreate, db: Session = Depends(get_db)):
    """Registra un nuevo ingreso."""
    db_ingreso = Ingreso(**ingreso.model_dump())
    db.add(db_ingreso)
    db.commit()
    db.refresh(db_ingreso)
    # Recargar con relación
    return db.query(Ingreso).options(
        joinedload(Ingreso.cliente)
    ).filter(Ingreso.id == db_ingreso.id).first()


@router.put("/{ingreso_id}", response_model=IngresoOut)
def actualizar_ingreso(
    ingreso_id: int,
    datos: IngresoUpdate,
    db: Session = Depends(get_db)
):
    """Actualiza un ingreso existente."""
    ingreso = db.query(Ingreso).filter(Ingreso.id == ingreso_id).first()
    if not ingreso:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(ingreso, campo, valor)

    db.commit()
    db.refresh(ingreso)
    return db.query(Ingreso).options(
        joinedload(Ingreso.cliente)
    ).filter(Ingreso.id == ingreso_id).first()


@router.delete("/{ingreso_id}", status_code=204)
def eliminar_ingreso(ingreso_id: int, db: Session = Depends(get_db)):
    """Elimina un ingreso."""
    ingreso = db.query(Ingreso).filter(Ingreso.id == ingreso_id).first()
    if not ingreso:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    db.delete(ingreso)
    db.commit()
