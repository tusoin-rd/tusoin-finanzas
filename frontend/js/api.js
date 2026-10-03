// URL base de la API — cambiar en producción
const API_BASE = "http://localhost:8000";

/**
 * GET request a la API
 */
async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${response.status}`);
  }
  return response.json();
}

/**
 * POST request a la API
 */
async function apiPost(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${response.status}`);
  }
  return response.json();
}

/**
 * PUT request a la API
 */
async function apiPut(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${response.status}`);
  }
  return response.json();
}

/**
 * DELETE request a la API
 */
async function apiDelete(path) {
  const response = await fetch(`${API_BASE}${path}`, { method: "DELETE" });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${response.status}`);
  }
  return true;
}

/**
 * Formatea número como moneda DOP
 */
function fmtDOP(n) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 2,
  }).format(n);
}

/**
 * Muestra un toast de notificación
 */
function showToast(message, type = "success") {
  const colors = {
    success: "bg-green-600",
    error:   "bg-red-600",
    info:    "bg-blue-600",
  };
  const toast = document.createElement("div");
  toast.className = `fixed bottom-4 right-4 z-50 ${colors[type]} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-opacity`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 500); }, 3000);
}
