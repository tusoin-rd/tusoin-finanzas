/**
 * Script de Keep-Alive Automático 24/7 para TuSoin
 * Realiza un ping HTTP a la ruta /api/health cada 5 minutos
 * para evitar que plataformas como Render o Koyeb entren en suspensión.
 */

const http = require('http');
const https = require('https');

const TARGET_URL = process.env.PING_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000/api/health';
const INTERVAL_MS = parseInt(process.env.PING_INTERVAL_MS, 10) || (5 * 60 * 1000); // 5 minutos

console.log(`[Keep-Alive 24/7] Iniciando monitor hacia: ${TARGET_URL}`);
console.log(`[Keep-Alive 24/7] Intervalo de ping: ${INTERVAL_MS / 1000}s`);

function sendPing() {
  const client = TARGET_URL.startsWith('https') ? https : http;
  const start = Date.now();

  client.get(TARGET_URL, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      const duration = Date.now() - start;
      console.log(`[Keep-Alive 24/7] Ping exitoso (${res.statusCode}) en ${duration}ms - ${new Date().toISOString()}`);
    });
  }).on('error', (err) => {
    console.error(`[Keep-Alive 24/7] Error en ping: ${err.message} - ${new Date().toISOString()}`);
  });
}

// Ping inmediato al arrancar
sendPing();

// Programar ping recurrente cada 5 minutos
setInterval(sendPing, INTERVAL_MS);
