const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Carga segura de variables de entorno desde .env
const ENV_FILE = path.join(__dirname, '.env');
if (fs.existsSync(ENV_FILE)) {
  try {
    const envContent = fs.readFileSync(ENV_FILE, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    });
  } catch (e) {
    console.error('Error cargando .env:', e);
  }
}

// Credenciales Maestras de Respaldo por Defecto
const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL || 'Admin2027@tusoinrd.com';
const MASTER_ADMIN_PASSWORD = process.env.MASTER_ADMIN_PASSWORD || 'AdminD&J2027';

// Lista Blanca Exclusiva para Google OAuth 2.0
const ALLOWED_GOOGLE_EMAILS = (process.env.ALLOWED_GOOGLE_EMAILS || 'gerencia@tusoinrd.com,admin@tusoinrd.com,tusoin.rd@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase());

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

// Almacenamiento en memoria con persistencia de doble vía (PostgreSQL Cloud + Archivo de Respaldo Local)
const DB_FILE = path.join(__dirname, 'tusoinrd_cloud_state.json');
let cloudState = {};

if (fs.existsSync(DB_FILE)) {
  try {
    cloudState = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.error('Error leyendo estado en JSON:', e);
  }
}

function saveStateToFile() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(cloudState, null, 2), 'utf8');
  } catch (e) {
    console.error('Error guardando estado en JSON:', e);
  }
}

// =========================================================
// CONFIGURACIÓN Y MIGRACIÓN AUTOMÁTICA POSTGRESQL CLOUD
// =========================================================
let pgPool = null;
let isPostgresConnected = false;

if (process.env.DATABASE_URL) {
  try {
    const isLocalPg = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isLocalPg ? false : { rejectUnauthorized: false }
    });

    pgPool.on('error', (err) => {
      console.error('[PostgreSQL Pool Error]', err.message);
    });
  } catch (err) {
    console.error('[PostgreSQL Init Error]', err);
  }
}

async function initPostgresTables() {
  if (!pgPool) {
    console.log('[TuSoin Storage] Modo Local/Memoria activo (DATABASE_URL no configurada aún).');
    return false;
  }
  try {
    const client = await pgPool.connect();
    try {
      await client.query(`
        -- 1. Tabla de Ventas y Trabajos Diarios
        CREATE TABLE IF NOT EXISTS ventas (
          id VARCHAR(64) PRIMARY KEY,
          num_factura INTEGER,
          fecha VARCHAR(32),
          cliente VARCHAR(255),
          concepto TEXT,
          monto NUMERIC(14, 2),
          costo_produccion NUMERIC(14, 2) DEFAULT 0,
          abono_cliente NUMERIC(14, 2) DEFAULT 0,
          pendiente_cliente NUMERIC(14, 2) DEFAULT 0,
          monto_pagado_nc NUMERIC(14, 2) DEFAULT 0,
          monto_pendiente_nc NUMERIC(14, 2) DEFAULT 0,
          estado VARCHAR(64) DEFAULT 'Entregado',
          margen NUMERIC(14, 2) DEFAULT 0,
          estado_costo_produccion VARCHAR(64) DEFAULT '',
          registrado_por VARCHAR(128) DEFAULT 'Admin',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 2. Tabla de Cotizaciones Institucionales
        CREATE TABLE IF NOT EXISTS cotizaciones (
          id VARCHAR(64) PRIMARY KEY,
          fecha VARCHAR(32),
          ncf VARCHAR(64),
          cliente VARCHAR(255),
          rnc_cliente VARCHAR(64),
          total NUMERIC(14, 2),
          registrado_por VARCHAR(128) DEFAULT 'Admin',
          raw_data JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 3. Tabla de Productos y Servicios
        CREATE TABLE IF NOT EXISTS productos (
          id VARCHAR(64) PRIMARY KEY,
          nombre VARCHAR(255),
          categoria VARCHAR(128),
          precio NUMERIC(14, 2),
          stock INTEGER DEFAULT 0,
          costo NUMERIC(14, 2) DEFAULT 0,
          descripcion TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 4. Tabla de Gastos Mensuales
        CREATE TABLE IF NOT EXISTS gastos (
          id VARCHAR(64) PRIMARY KEY,
          fecha VARCHAR(32),
          categoria VARCHAR(128),
          descripcion TEXT,
          monto NUMERIC(14, 2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 5. Tabla de Estado Global en Tiempo Real
        CREATE TABLE IF NOT EXISTS tusoin_cloud_state (
          key VARCHAR(64) PRIMARY KEY,
          value JSONB,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      isPostgresConnected = true;
      console.log('[TuSoin PostgreSQL] ✅ Tablas creadas y verificadas en la nube: ventas, cotizaciones, productos, gastos, tusoin_cloud_state.');

      // Hidratar o sincronizar estado inicial desde PostgreSQL
      const resState = await client.query(`SELECT value FROM tusoin_cloud_state WHERE key = 'app_state'`);
      if (resState.rows.length > 0 && resState.rows[0].value) {
        cloudState = resState.rows[0].value;
        saveStateToFile();
        console.log('[TuSoin PostgreSQL] Estado global hidratado exitosamente desde la base de datos en la nube.');
      } else if (Object.keys(cloudState).length > 0) {
        await client.query(`
          INSERT INTO tusoin_cloud_state (key, value, updated_at)
          VALUES ('app_state', $1, NOW())
          ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()
        `, [JSON.stringify(cloudState)]);
        console.log('[TuSoin PostgreSQL] Estado inicial sembrado en la base de datos.');

        // Sembrar filas iniciales en tablas relacionales ventas, cotizaciones, productos
        const countRes = await client.query(`SELECT COUNT(*) FROM ventas`);
        if (parseInt(countRes.rows[0].count, 10) === 0 && Array.isArray(cloudState.sales)) {
          console.log('[TuSoin PostgreSQL] Sembrando tablas relacionales iniciales (ventas, cotizaciones, productos)...');
          for (const s of cloudState.sales) {
            await client.query(`
              INSERT INTO ventas (id, num_factura, fecha, cliente, concepto, monto, costo_produccion, abono_cliente, pendiente_cliente, monto_pagado_nc, monto_pendiente_nc, estado, margen, estado_costo_produccion, registrado_por)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
              ON CONFLICT (id) DO NOTHING
            `, [
              s.id || `sale-${s.numFactura || Date.now()}`,
              s.numFactura || null,
              s.fecha || '',
              s.cliente || '',
              s.articuloTrabajo || s.concepto || '',
              s.totalVenta || s.monto || 0,
              s.costoProduccion || 0,
              s.abonoCliente || 0,
              s.pendienteCliente || 0,
              s.montoPagadoNorthCentral || 0,
              s.montoPendienteNorthCentral || 0,
              s.estado || 'Entregado',
              s.margen || 0,
              s.estadoCostoProduccion || '',
              s.registradoPor || 'Admin'
            ]);
          }
          console.log(`[TuSoin PostgreSQL] ✅ ${cloudState.sales.length} registros insertados en tabla 'ventas'.`);
        }
      }
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[TuSoin PostgreSQL Error]', err.message);
    isPostgresConnected = false;
    return false;
  }
}

// Ejecutar migración de inicio
initPostgresTables();

async function persistState(payload) {
  Object.assign(cloudState, payload);
  saveStateToFile();

  if (pgPool && isPostgresConnected) {
    try {
      const client = await pgPool.connect();
      try {
        await client.query(`
          INSERT INTO tusoin_cloud_state (key, value, updated_at)
          VALUES ('app_state', $1, NOW())
          ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()
        `, [JSON.stringify(cloudState)]);

        // Sincronizar tabla relacional 'ventas'
        if (Array.isArray(payload.sales)) {
          for (const s of payload.sales) {
            await client.query(`
              INSERT INTO ventas (id, num_factura, fecha, cliente, concepto, monto, costo_produccion, abono_cliente, pendiente_cliente, monto_pagado_nc, monto_pendiente_nc, estado, margen, estado_costo_produccion, registrado_por)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
              ON CONFLICT (id) DO UPDATE SET
                num_factura = EXCLUDED.num_factura,
                fecha = EXCLUDED.fecha,
                cliente = EXCLUDED.cliente,
                concepto = EXCLUDED.concepto,
                monto = EXCLUDED.monto,
                costo_produccion = EXCLUDED.costo_produccion,
                abono_cliente = EXCLUDED.abono_cliente,
                pendiente_cliente = EXCLUDED.pendiente_cliente,
                monto_pagado_nc = EXCLUDED.monto_pagado_nc,
                monto_pendiente_nc = EXCLUDED.monto_pendiente_nc,
                estado = EXCLUDED.estado,
                margen = EXCLUDED.margen,
                estado_costo_produccion = EXCLUDED.estado_costo_produccion,
                registrado_por = EXCLUDED.registrado_por
            `, [
              s.id || `sale-${s.numFactura || Date.now()}`,
              s.numFactura || null,
              s.fecha || '',
              s.cliente || '',
              s.articuloTrabajo || s.concepto || '',
              s.totalVenta || s.monto || 0,
              s.costoProduccion || 0,
              s.abonoCliente || 0,
              s.pendienteCliente || 0,
              s.montoPagadoNorthCentral || 0,
              s.montoPendienteNorthCentral || 0,
              s.estado || 'Entregado',
              s.margen || 0,
              s.estadoCostoProduccion || '',
              s.registradoPor || 'Admin'
            ]);
          }
        }

        // Sincronizar tabla relacional 'cotizaciones'
        if (Array.isArray(payload.quotes)) {
          for (const q of payload.quotes) {
            await client.query(`
              INSERT INTO cotizaciones (id, fecha, ncf, cliente, rnc_cliente, total, registrado_por, raw_data)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              ON CONFLICT (id) DO UPDATE SET
                fecha = EXCLUDED.fecha,
                ncf = EXCLUDED.ncf,
                cliente = EXCLUDED.cliente,
                rnc_cliente = EXCLUDED.rnc_cliente,
                total = EXCLUDED.total,
                registrado_por = EXCLUDED.registrado_por,
                raw_data = EXCLUDED.raw_data
            `, [
              q.id || `quote-${Date.now()}`,
              q.date || q.fecha || '',
              q.ncf || '',
              q.client || q.cliente || '',
              q.rnc || q.rncCliente || '',
              q.grandTotal || q.total || 0,
              q.registradoPor || 'Admin',
              JSON.stringify(q)
            ]);
          }
        }

        // Sincronizar tabla relacional 'productos'
        if (Array.isArray(payload.catalog)) {
          for (const p of payload.catalog) {
            await client.query(`
              INSERT INTO productos (id, nombre, categoria, precio, stock, costo, descripcion)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT (id) DO UPDATE SET
                nombre = EXCLUDED.nombre,
                categoria = EXCLUDED.categoria,
                precio = EXCLUDED.precio,
                stock = EXCLUDED.stock,
                costo = EXCLUDED.costo,
                descripcion = EXCLUDED.descripcion
            `, [
              p.id || `prod-${Date.now()}`,
              p.name || p.nombre || '',
              p.category || p.categoria || 'General',
              p.price || p.precio || 0,
              p.stock != null ? p.stock : 100,
              p.cost || p.costo || 0,
              p.description || p.descripcion || ''
            ]);
          }
        }
      } finally {
        client.release();
      }
    } catch (e) {
      console.error('[TuSoin PostgreSQL Sync Error]', e.message);
    }
  }
}

const server = http.createServer((req, res) => {
  // Configuración CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Ruta de Salud Keep-Alive 24/7
  if (pathname === '/health' || pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      app: 'TuSoin - Tu solución inmediata',
      server_time: new Date().toISOString(),
      keep_alive: true,
      port: PORT,
      database: isPostgresConnected ? 'PostgreSQL Cloud Connected' : 'Persistent Storage Active'
    }));
    return;
  }

  // Rutas de Persistencia y Sincronización en la Nube
  if (pathname === '/api/sync/load' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'success',
      data: cloudState,
      has_data: Object.keys(cloudState).length > 0,
      engine: isPostgresConnected ? 'PostgreSQL' : 'Persistent Cloud Cache',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  if (pathname === '/api/sync/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        await persistState(payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'success',
          saved_keys: Object.keys(payload),
          engine: isPostgresConnected ? 'PostgreSQL Cloud' : 'Persistent Cloud Cache',
          timestamp: new Date().toISOString()
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: err.message }));
      }
    });
    return;
  }

  // ---------------------------------------------------------
  // RUTAS DE AUTENTICACIÓN SEGURA Y CONTROL DE ACCESO
  // ---------------------------------------------------------
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body || '{}');
        const cleanEmail = (email || '').trim().toLowerCase();
        if (cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase() && password === MASTER_ADMIN_PASSWORD) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            user: {
              email: MASTER_ADMIN_EMAIL,
              name: 'Administrador Maestro TuSoin',
              role: 'Super Administrador (Acceso Maestro)',
              initials: 'AM',
              authProvider: 'master_backup'
            }
          }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: 'Credenciales inválidas. Verifica tu correo corporativo y contraseña de respaldo maestro.'
          }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Solicitud inválida' }));
      }
    });
    return;
  }

  if (pathname === '/api/auth/google' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { email } = JSON.parse(body || '{}');
        const cleanEmail = (email || '').trim().toLowerCase();

        // Validación estricta en Backend contra Lista Blanca
        if (ALLOWED_GOOGLE_EMAILS.includes(cleanEmail)) {
          const namesMap = {
            'gerencia@tusoinrd.com': 'Gerencia Financiera',
            'admin@tusoinrd.com': 'Administrador Principal',
            'tusoin.rd@gmail.com': 'TuSoin RD Oficial'
          };
          const rolesMap = {
            'gerencia@tusoinrd.com': 'Gerente de Operaciones',
            'admin@tusoinrd.com': 'Administrador Principal',
            'tusoin.rd@gmail.com': 'Administrador General'
          };
          const initialsMap = {
            'gerencia@tusoinrd.com': 'GE',
            'admin@tusoinrd.com': 'AD',
            'tusoin.rd@gmail.com': 'TS'
          };

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            user: {
              email: cleanEmail,
              name: namesMap[cleanEmail] || 'Administrador TuSoin',
              role: rolesMap[cleanEmail] || 'Administrador Autorizado (Google)',
              initials: initialsMap[cleanEmail] || 'TS',
              authProvider: 'google'
            }
          }));
        } else {
          // Denegación estricta inmediata con HTTP 403
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: 'Acceso denegado. Este correo electrónico no está autorizado para acceder al sistema administrativo.'
          }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Solicitud inválida' }));
      }
    });
    return;
  }

  // Servir archivos estáticos
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  // Prevenir Directory Traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Acceso denegado');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback a index.html para SPA
      filePath = path.join(__dirname, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Error interno del servidor');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`[TuSoin Server] Escuchando en puerto ${PORT}`);
  console.log(`[TuSoin Server] Ruta Keep-Alive: http://localhost:${PORT}/api/health`);
});

// Auto Keep-Alive interno en Producción (evita sleep en Render/Koyeb)
const EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || process.env.PING_URL;
if (EXTERNAL_URL) {
  console.log(`[Keep-Alive 24/7] Iniciando monitor hacia: ${EXTERNAL_URL}/api/health`);
  setInterval(() => {
    const client = EXTERNAL_URL.startsWith('https') ? https : http;
    client.get(`${EXTERNAL_URL}/api/health`, (r) => {
      // Consume response data to free up memory
      r.resume();
    }).on('error', (err) => {
      console.warn('[Keep-Alive Ping]', err.message);
    });
  }, 4 * 60 * 1000); // Cada 4 minutos
}
