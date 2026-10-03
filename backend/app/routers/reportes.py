from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from datetime import date

from app.database.database import get_db
from app.models.models import Ingreso, Egreso, Cliente
from app.schemas.schemas import ResumenFinanciero

router = APIRouter(prefix="/reportes", tags=["Reportes"])


@router.get("/resumen", response_model=ResumenFinanciero)
def resumen_financiero(
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    """Devuelve el resumen financiero: total ingresos, egresos y balance."""
    q_ing = db.query(func.coalesce(func.sum(Ingreso.monto), 0))
    q_egr = db.query(func.coalesce(func.sum(Egreso.monto), 0))

    if fecha_desde:
        q_ing = q_ing.filter(Ingreso.fecha >= fecha_desde)
        q_egr = q_egr.filter(Egreso.fecha >= fecha_desde)
    if fecha_hasta:
        q_ing = q_ing.filter(Ingreso.fecha <= fecha_hasta)
        q_egr = q_egr.filter(Egreso.fecha <= fecha_hasta)

    total_ingresos = float(q_ing.scalar())
    total_egresos = float(q_egr.scalar())
    total_clientes = db.query(func.count(Cliente.id)).scalar()

    return ResumenFinanciero(
        total_ingresos=total_ingresos,
        total_egresos=total_egresos,
        balance=total_ingresos - total_egresos,
        total_clientes=total_clientes,
    )


@router.get("/por-mes")
def ingresos_egresos_por_mes(
    anio: int = Query(default=2024, description="Año a consultar"),
    db: Session = Depends(get_db)
):
    """Devuelve totales de ingresos y egresos agrupados por mes (para gráfica)."""
    ingresos_mes = (
        db.query(
            extract("month", Ingreso.fecha).label("mes"),
            func.sum(Ingreso.monto).label("total")
        )
        .filter(extract("year", Ingreso.fecha) == anio)
        .group_by("mes")
        .all()
    )
    egresos_mes = (
        db.query(
            extract("month", Egreso.fecha).label("mes"),
            func.sum(Egreso.monto).label("total")
        )
        .filter(extract("year", Egreso.fecha) == anio)
        .group_by("mes")
        .all()
    )

    meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
             "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

    ing_dict = {int(r.mes): float(r.total) for r in ingresos_mes}
    egr_dict = {int(r.mes): float(r.total) for r in egresos_mes}

    return {
        "labels": meses,
        "ingresos": [ing_dict.get(m, 0) for m in range(1, 13)],
        "egresos": [egr_dict.get(m, 0) for m in range(1, 13)],
    }


@router.get("/top-clientes")
def top_clientes(
    limite: int = Query(default=5),
    db: Session = Depends(get_db)
):
    """Top clientes por monto total de ingresos."""
    resultados = (
        db.query(
            Cliente.nombre,
            func.sum(Ingreso.monto).label("total")
        )
        .join(Ingreso, Ingreso.cliente_id == Cliente.id)
        .group_by(Cliente.id)
        .order_by(func.sum(Ingreso.monto).desc())
        .limit(limite)
        .all()
    )
    return [{"cliente": r.nombre, "total": float(r.total)} for r in resultados]
