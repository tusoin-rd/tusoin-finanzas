# TuSoinRD - Sistema de Finanzas, Cotizaciones y Control Operativo

Sistema web profesional de nivel empresarial para el control financiero, cotizaciones institucionales con NCF, facturación y gestión operativa de **"TuSoin" (Tu solución inmediata)**.

---

## 🔐 1. Endurecimiento de Seguridad y Control de Acceso
- **Google OAuth 2.0 con selección forzada de cuenta (`prompt=select_account`):**
  Obliga la selección manual y explícita de la cuenta Google activa en el navegador.
- **Lista Blanca Estricta en Backend (Allowlist):**
  Solo los siguientes correos corporativos autorizados tienen permiso de acceso:
  * `gerencia@tusoinrd.com` (Gerencia Financiera)
  * `admin@tusoinrd.com` (Administrador Principal)
  * `tusoin.rd@gmail.com` (TuSoin RD Oficial)
  * *Cualquier correo ajeno es denegado inmediatamente (HTTP 403) con destrucción de sesión y el mensaje:*
    > "Acceso denegado. Este correo electrónico no está autorizado para acceder al sistema administrativo."
- **Acceso Maestro de Respaldo de Emergencia:**
  * Correo maestro: `Admin2027@tusoinrd.com`
  * Contraseña maestra: `AdminD&J2027`
  * Almacenadas de forma segura en variables de entorno del servidor (`MASTER_ADMIN_EMAIL`, `MASTER_ADMIN_PASSWORD`).

---

## ☁️ 2. Base de Datos Global en la Nube y Sincronización en Tiempo Real
- **Arquitectura PostgreSQL en la Nube:**
  Soporte automatizado y sin intervención manual para instancias de PostgreSQL en Render, Supabase o Neon mediante la variable de entorno `DATABASE_URL`.
- **Estructura de Tablas Automatizadas:**
  * **`ventas`:** `id`, `num_factura`, `fecha`, `cliente`, `concepto`, `monto`, `costo_produccion`, `abono_cliente`, `pendiente_cliente`, `monto_pagado_nc`, `monto_pendiente_nc`, `estado`, `margen`, `estado_costo_produccion`, `registrado_por`, `created_at`.
  * **`cotizaciones`:** `id`, `fecha`, `ncf`, `cliente`, `rnc_cliente`, `total`, `registrado_por`, `raw_data`, `created_at`.
  * **`productos`:** `id`, `nombre`, `categoria`, `precio`, `stock`, `costo`, `descripcion`, `created_at`.
  * **`gastos`:** `id`, `fecha`, `categoria`, `descripcion`, `monto`, `created_at`.
  * **`tusoin_cloud_state`:** Tabla clave-valor JSONB para hidratación atómica instantánea.
- **Sincronización Multidispositivo en Tiempo Real (10 Segundos):**
  Mecanismo background `setInterval` ejecutándose exactamente cada 10 segundos (10,000 ms), consultando la base de datos y refrescando en segundo plano todas las vistas, métricas y tablas analíticas sin requerir recargar la página.

---

## 📑 3. Cotizaciones Elegantes & Membrete Oficial
- **Datos Fiscales e Institucionales Integrados:**
  * **RNC Oficial:** `1-31-59570-7`
  * **Dirección:** `C/ Juan de Moya #10, 1er Nivel, El Almirante, Sto. Dgo. Este, Rep. Dom.`
  * **Contactos:** Tel: `809-762-6064` | Email: `tusoin.rd@gmail.com` | Web: `tusoin.rd`
  * **NCF Gubernamental:** Formato `B1500000001` con cálculo dinámico de ITBIS y retenciones.
- **Paleta Corporativa Institucional:**
  Verde esmeralda (#10b981), Negro grafito (#0b0f19) y Blanco (#ffffff).
- **Exportación Limpia:**
  Descarga directa en PDF o impresión libre de botones y contornos de edición mediante estilos `@media print`.

---

## ⚡ 4. Despliegue e Infalibilidad 24/7 (Keep-Alive)
- **Puerto Dinámico:** Configurado mediante `process.env.PORT || 3000`.
- **Ruta de Salud:** `GET /api/health` retorna `200 OK` con estado del servidor y base de datos.
- **Monitor Keep-Alive Autónomo:** Sistema de ping interno recurrente (y script `keep_alive.js`) que envía solicitudes periódicas para evitar la suspensión en capas gratuitas (Render / Koyeb).
