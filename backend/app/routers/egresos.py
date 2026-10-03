from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database.database import get_db
from app.models.models import Egreso
from app.schemas.schemas import EgresoCreate, EgresoUpdate, EgresoOut

router = APIRouter(prefix="/egresos", tags=["Egresos"])


@router.get("/", response_model=List[EgresoOut])
def listar_egresos(
    skip: int = 0,
    limit: int = 100,
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    """Lista egresos con filtros opcionales por rango de fechas."""
    query = db.query(Egreso)

    if fecha_desde:
        query = query.filter(Egreso.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Egreso.fecha <= fecha_hasta)

    return query.order_by(Egreso.fecha.desc()).offset(skip).limit(limit).all()


@router.get("/{egreso_id}", response_model=EgresoOut)
def obtener_egreso(egreso_id: int, db: Session = Depends(get_db)):
    """Obtiene un egreso por su ID."""
    egreso = db.query(Egreso).filter(Egreso.id == egreso_id).first()
    if not egreso:
        raise HTTPException(status_code=404, detail="Egreso no encontrado")
    return egreso


@router.post("/", response_model=EgresoOut, status_code=201)
def crear_egreso(egreso: EgresoCreate, db: Session = Depends(get_db)):
    """Registra un nuevo egreso."""
    db_egreso = Egreso(**egreso.model_dump())
    db.add(db_egreso)
    db.commit()
    db.refresh(db_egreso)
    return db_egreso


@router.put("/{egreso_id}", response_model=EgresoOut)
def actualizar_egreso(
    egreso_id: int,
    datos: EgresoUpdate,
    db: Session = Depends(get_db)
):
    """Actualiza un egreso existente."""
    egreso = db.query(Egreso).filter(Egreso.id == egreso_id).first()
    if not egreso:
        raise HTTPException(status_code=404, detail="Egreso no encontrado")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(egreso, campo, valor)

    db.commit()
    db.refresh(egreso)
    return egreso


@router.delete("/{egreso_id}", status_code=204)
def eliminar_egreso(egreso_id: int, db: Session = Depends(get_db)):
    """Elimina un egreso."""
    egreso = db.query(Egreso).filter(Egreso.id == egreso_id).first()
    if not egreso:
        raise HTTPException(status_code=404, detail="Egreso no encontrado")
    db.delete(egreso)
    db.commit()
