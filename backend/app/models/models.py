from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database.database import Base


# ─── Enums ────────────────────────────────────────────────────────────────────

class MetodoPago(str, enum.Enum):
    efectivo = "efectivo"
    transferencia = "transferencia"
    tarjeta = "tarjeta"
    cheque = "cheque"
    otro = "otro"


class Moneda(str, enum.Enum):
    DOP = "DOP"
    USD = "USD"


class CategoriaIngreso(str, enum.Enum):
    venta_servicio = "Venta de Servicio"
    venta_producto = "Venta de Producto"
    cobro_pendiente = "Cobro Pendiente"
    anticipo = "Anticipo"
    otro = "Otro"


class CategoriaEgreso(str, enum.Enum):
    nomina = "Nómina"
    alquiler = "Alquiler"
    servicios = "Servicios (luz, agua, internet)"
    compra_insumos = "Compra de Insumos"
    marketing = "Marketing"
    impuestos = "Impuestos / DGII"
    transporte = "Transporte"
    otro = "Otro"


# ─── Modelos ───────────────────────────────────────────────────────────────────

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False, index=True)
    rnc_cedula = Column(String(20), unique=True, nullable=True)
    telefono = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    direccion = Column(Text, nullable=True)
    notas = Column(Text, nullable=True)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    # Relación con ingresos
    ingresos = relationship("Ingreso", back_populates="cliente")


class Ingreso(Base):
    __tablename__ = "ingresos"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False, index=True)
    descripcion = Column(String(255), nullable=False)
    monto = Column(Float, nullable=False)
    moneda = Column(Enum(Moneda), default=Moneda.DOP, nullable=False)
    categoria = Column(Enum(CategoriaIngreso), nullable=False)
    metodo_pago = Column(Enum(MetodoPago), nullable=False)
    numero_factura = Column(String(50), nullable=True)
    notas = Column(Text, nullable=True)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    # Relación con cliente (opcional — puede ser un ingreso sin cliente)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    cliente = relationship("Cliente", back_populates="ingresos")


class Egreso(Base):
    __tablename__ = "egresos"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False, index=True)
    descripcion = Column(String(255), nullable=False)
    proveedor = Column(String(150), nullable=True)
    monto = Column(Float, nullable=False)
    moneda = Column(Enum(Moneda), default=Moneda.DOP, nullable=False)
    categoria = Column(Enum(CategoriaEgreso), nullable=False)
    metodo_pago = Column(Enum(MetodoPago), nullable=False)
    numero_comprobante = Column(String(50), nullable=True)
    notas = Column(Text, nullable=True)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())
