from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.database import get_db
from app.models.models import Cliente
from app.schemas.schemas import ClienteCreate, ClienteUpdate, ClienteOut

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.get("/", response_model=List[ClienteOut])
def listar_clientes(
    skip: int = 0,
    limit: int = 100,
    buscar: Optional[str] = Query(None, description="Buscar por nombre o RNC"),
    db: Session = Depends(get_db)
):
    """Lista todos los clientes. Soporta búsqueda por nombre o RNC/cédula."""
    query = db.query(Cliente)
    if buscar:
        query = query.filter(
            Cliente.nombre.ilike(f"%{buscar}%") |
            Cliente.rnc_cedula.ilike(f"%{buscar}%")
        )
    return query.offset(skip).limit(limit).all()


@router.get("/{cliente_id}", response_model=ClienteOut)
def obtener_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Obtiene un cliente por su ID."""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.post("/", response_model=ClienteOut, status_code=201)
def crear_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    """Crea un nuevo cliente."""
    # Verificar RNC/cédula único si se provee
    if cliente.rnc_cedula:
        existente = db.query(Cliente).filter(
            Cliente.rnc_cedula == cliente.rnc_cedula
        ).first()
        if existente:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un cliente con RNC/cédula {cliente.rnc_cedula}"
            )
    db_cliente = Cliente(**cliente.model_dump())
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente


@router.put("/{cliente_id}", response_model=ClienteOut)
def actualizar_cliente(
    cliente_id: int,
    datos: ClienteUpdate,
    db: Session = Depends(get_db)
):
    """Actualiza los datos de un cliente existente."""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(cliente, campo, valor)

    db.commit()
    db.refresh(cliente)
    return cliente


@router.delete("/{cliente_id}", status_code=204)
def eliminar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Elimina un cliente (solo si no tiene ingresos asociados)."""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    if cliente.ingresos:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar: el cliente tiene ingresos registrados"
        )
    db.delete(cliente)
    db.commit()
