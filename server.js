const http = require('http');
const fs = require('fs');
const path = require('path');

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

// Almacenamiento en memoria con persistencia en archivo JSON local o variable de entorno
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

const server = http.createServer((req, res) => {
  // CORS
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
      port: PORT
    }));
    return;
  }

  // Rutas de Persistencia Nube
  if (pathname === '/api/sync/load' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'success',
      data: cloudState,
      has_data: Object.keys(cloudState).length > 0
    }));
    return;
  }

  if (pathname === '/api/sync/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        Object.assign(cloudState, payload);
        saveStateToFile();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'success',
          saved_keys: Object.keys(payload),
          timestamp: new Date().toISOString()
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: err.message }));
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
