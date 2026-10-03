from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import date, datetime
from app.models.models import MetodoPago, Moneda, CategoriaIngreso, CategoriaEgreso


# ─── Cliente ──────────────────────────────────────────────────────────────────

class ClienteBase(BaseModel):
    nombre: str
    rnc_cedula: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    notas: Optional[str] = None


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(ClienteBase):
    nombre: Optional[str] = None


class ClienteOut(ClienteBase):
    id: int
    creado_en: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Ingreso ──────────────────────────────────────────────────────────────────

class IngresoBase(BaseModel):
    fecha: date
    descripcion: str
    monto: float
    moneda: Moneda = Moneda.DOP
    categoria: CategoriaIngreso
    metodo_pago: MetodoPago
    numero_factura: Optional[str] = None
    notas: Optional[str] = None
    cliente_id: Optional[int] = None

    @field_validator("monto")
    @classmethod
    def monto_positivo(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("El monto debe ser mayor a 0")
        return v


class IngresoCreate(IngresoBase):
    pass


class IngresoUpdate(IngresoBase):
    fecha: Optional[date] = None
    descripcion: Optional[str] = None
    monto: Optional[float] = None
    moneda: Optional[Moneda] = None
    categoria: Optional[CategoriaIngreso] = None
    metodo_pago: Optional[MetodoPago] = None


class IngresoOut(IngresoBase):
    id: int
    creado_en: Optional[datetime] = None
    cliente: Optional[ClienteOut] = None

    model_config = {"from_attributes": True}


# ─── Egreso ───────────────────────────────────────────────────────────────────

class EgresoBase(BaseModel):
    fecha: date
    descripcion: str
    proveedor: Optional[str] = None
    monto: float
    moneda: Moneda = Moneda.DOP
    categoria: CategoriaEgreso
    metodo_pago: MetodoPago
    numero_comprobante: Optional[str] = None
    notas: Optional[str] = None

    @field_validator("monto")
    @classmethod
    def monto_positivo(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("El monto debe ser mayor a 0")
        return v


class EgresoCreate(EgresoBase):
    pass


class EgresoUpdate(EgresoBase):
    fecha: Optional[date] = None
    descripcion: Optional[str] = None
    monto: Optional[float] = None
    moneda: Optional[Moneda] = None
    categoria: Optional[CategoriaEgreso] = None
    metodo_pago: Optional[MetodoPago] = None


class EgresoOut(EgresoBase):
    id: int
    creado_en: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Resumen para Dashboard ───────────────────────────────────────────────────

class ResumenFinanciero(BaseModel):
    total_ingresos: float
    total_egresos: float
    balance: float
    total_clientes: int
