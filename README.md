# TuSoinRD - Sistema de Finanzas y Control Diario (Base de Datos Real)

Sistema web profesional para el registro diario de ventas, costos de producción, abonos, gastos fijos y control analítico de **"TuSoinRD"**.

Cargado con la **base de datos real del negocio** extraída directamente de **"Hoja de Control _ TuSoinRD.xlsx"**:
- **91 registros de ventas y trabajos** (Facturas #1 al #92 con clientes reales, montos, abonos y margen).
- **87 registros de salida mensual** (Gastos fijos y variables reales con montos y descripciones).
- Control de pagos y deudas con el proveedor principal **NorthCentral**.

---

## 🔐 1. Credenciales de Acceso

| Administrador | Correo Corporativo | Contraseña | Rol |
| :--- | :--- | :--- | :--- |
| **Admin 1** | `admin@tusoinrd.com` | `admin123` | Administrador Principal |
| **Admin 2 (Gerencia)** | `gerencia@tusoinrd.com` | `tusoin2026` | Gerente de Operaciones |

*(Puedes hacer clic directamente en los botones "Admin 1" o "Admin 2" en la pantalla de inicio para auto-llenar los campos).*

---

## 📊 2. Estructura de Campos Reales ("Hoja de Control")

### A. Registro Diario de Ventas y Trabajos
1. **Nº de Factura:** Numérico (#1, #2, ..., #92).
2. **Fecha:** YYYY-MM-DD.
3. **Cliente:** Nombre del cliente o negocio (ej. *Aura global wellnes, Nathalie de oleo, Dulcenis, Kendra franco*, etc.).
4. **Cantidad (Unid.):** Unidades procesadas.
5. **Artículo / Trabajo:** Detalle del trabajo (ej. *Letrero 107x37 vinyl, polos dryfit, banner, carnets*, etc.).
6. **Costo de Producción:** Monto del costo directo de materiales y confección.
7. **Total Venta:** Precio facturado al cliente.
8. **Abono Cliente:** Monto pagado por el cliente.
9. **Pendiente Cliente:** Saldo adeudado por el cliente (`Total Venta - Abono Cliente`).
10. **Monto Pagado a NorthCentral:** Costo liquidado al proveedor NorthCentral.
11. **Monto Pendiente a NorthCentral:** Deuda por pagar a NorthCentral.
12. **Margen ($):** Beneficio bruto generado (`Total Venta - Costo de Producción`).
13. **Estado del Trabajo:** "Entregado", "En Proceso", "Pendiente", "Sin Iniciar".
14. **Estado Costo de Producción:** "PAGADO", "PENDIENTE", "NO PAGADO".

### B. Salida Mensual (Gastos Operativos)
- **Fecha:** Fecha del desembolso.
- **Categoría:** *Gasto Fijo* o *Gasto variable*.
- **Descripción / Detalle:** Concepto exacto (ej. *Alquiler local, Edeeste luz, Uber, Jessica, Balmis*, etc.).
- **Monto:** Valor monetario del gasto.

---

## 📈 3. Dashboard Analítico y Métricas Clave

- **Filtro de Tiempo:** Alterna entre `Hoy`, `Últimos 7 días`, `Este mes`, `Este año` y `Todo el historial`.
- **KPIs en Tiempo Real:**
  * **Ventas Totales:** Suma acumulada de las 91 órdenes reales.
  * **Margen de Ganancia ($):** Utilidad bruta directa calculada.
  * **Pendiente Cobrar a Clientes:** Cuentas por cobrar reales.
  * **Pendiente a NorthCentral:** Deuda pendiente con el taller de producción NorthCentral.
  * **Ticket Promedio:** Promedio facturado por trabajo.
- **Gráficos Chart.js:**
  * Evolución temporal de facturación vs costos.
  * Top 5 artículos y trabajos más vendidos.
  * Distribución por estados de entrega (*Entregado, En Proceso, Pendiente, Sin Iniciar*).
  * Comparativa mensual de ventas vs gastos de operación.

---

## 🔄 4. Botón "Resetear Datos Excel"
En la barra superior encontrarás el botón **"Resetear Datos Excel"**. Si en cualquier momento deseas descartar pruebas o modificaciones y volver al estado original extraído del archivo Excel, simplemente pulsa ese botón para restaurar instantáneamente los 91 registros de ventas y 87 gastos.

---

## 🚀 Cómo Abrir la Aplicación

1. Navega a la carpeta:
   `C:\Users\Windows\.gemini\antigravity\scratch\tusoinrd-finanzas`
2. Abre [index.html](file:///C:/Users/Windows/.gemini/antigravity/scratch/tusoinrd-finanzas/index.html) en tu navegador.
3. Inicia sesión con cualquiera de los administradores.
