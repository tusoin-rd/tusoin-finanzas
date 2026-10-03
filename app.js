/**
 * TuSoinRD - Sistema de Finanzas y Control Diario
 * Lógica Completa adaptada a la Hoja de Control Real (Excel)
 * 91 Registros de Ventas y Trabajos + 87 Registros de Salida Mensual
 */

// ==========================================
// 1. CONFIGURACIÓN Y VERSIONADO DE BASE DE DATOS
// ==========================================
const DB_VERSION = 'tusoinrd_real_excel_v2';

const AUTH_USERS = [
  {
    email: 'admin@tusoinrd.com',
    password: 'admin123',
    name: 'Admin TuSoinRD',
    role: 'Administrador Principal',
    initials: 'AD'
  },
  {
    email: 'gerencia@tusoinrd.com',
    password: 'tusoin2026',
    name: 'Gerencia Financiera',
    role: 'Gerente de Operaciones',
    initials: 'GE'
  }
];

// ==========================================
// 2. ESTADO GLOBAL DE LA APLICACIÓN
// ==========================================
const APP_STATE = {
  currentUser: null,
  currency: 'RD$',
  sales: [],
  expenses: [],
  suppliers: [],
  catalog: [],
  quotes: [],
  currentTab: 'tab-dashboard',
  dashboardTimeRange: 'all', // Por defecto mostrar todo el historial del Excel
  activeCatalogCategory: 'all',
  catalogSearch: '',
  quoteSearch: '',
  quoteFilterStatus: 'all',
  currentQuoteEditingId: null,
  activeFilters: {
    search: '',
    dateStart: '',
    dateEnd: '',
    status: 'all',
    paymentStatus: 'all'
  }
};

// Catálogo predeterminado del negocio (Productos, Servicios, Artículos)
const DEFAULT_CATALOG = [
  {
    id: 'cat-1',
    name: 'Letrero Acrílico 3D con Luz LED',
    category: 'Producto',
    description: 'Letras corpóreas en acrílico con retroiluminación LED resistente a la intemperie.',
    price: 8500.00,
    cost: 4200.00
  },
  {
    id: 'cat-2',
    name: 'Polos Dry-Fit Bordados (Personalizados)',
    category: 'Producto',
    description: 'Polos deportivos en tela microfibra dry-fit con bordado computarizado pechera.',
    price: 650.00,
    cost: 320.00
  },
  {
    id: 'cat-3',
    name: 'Tazas Mágicas Sublimadas',
    category: 'Producto',
    description: 'Taza de cerámica térmica con diseño que se devela al contacto con agua caliente.',
    price: 350.00,
    cost: 140.00
  },
  {
    id: 'cat-4',
    name: 'Gorras Personalizadas con Parche Sintético',
    category: 'Producto',
    description: 'Gorra trucker de 5 paneles con parche en semipiel grabado a láser.',
    price: 450.00,
    cost: 210.00
  },
  {
    id: 'cat-5',
    name: 'Rotulación de Vehículos Comerciales (Vinil)',
    category: 'Servicio',
    description: 'Diseño e instalación de rotulación integral en vinil automotriz para flotillas.',
    price: 12000.00,
    cost: 4500.00
  },
  {
    id: 'cat-6',
    name: 'Diseño Gráfico & Manual de Identidad Corporativa',
    category: 'Servicio',
    description: 'Creación de logo profesional, paleta cromática, manual de marca y archivos vectoriales.',
    price: 5000.00,
    cost: 800.00
  },
  {
    id: 'cat-7',
    name: 'Instalación & Montaje en Exteriores',
    category: 'Servicio',
    description: 'Servicio de anclaje, instalación eléctrica y fijación en sitio del cliente.',
    price: 3500.00,
    cost: 1000.00
  },
  {
    id: 'cat-8',
    name: 'Tarjetas de Presentación Soft Touch (Millar)',
    category: 'Artículo',
    description: 'Tarjetas full color ambos lados en sulfato 14pt con laminado mate aterciopelado.',
    price: 2200.00,
    cost: 1100.00
  },
  {
    id: 'cat-9',
    name: 'Flyers Promocionales 5.5x8.5 Pulg (Millar)',
    category: 'Artículo',
    description: 'Volantes impresos full color en papel satinado de 100lb.',
    price: 3800.00,
    cost: 1900.00
  },
  {
    id: 'cat-10',
    name: 'Pendones / Roll-Up Banner con Base de Aluminio',
    category: 'Artículo',
    description: 'Banner retractil de 33x79 pulgadas en lona mate 13oz con bolso de transporte.',
    price: 4500.00,
    cost: 2100.00
  }
];

// Cotizaciones iniciales de ejemplo
const DEFAULT_QUOTES = [
  {
    id: 'quote-1',
    number: 'COT-2026-001',
    date: '2026-10-01',
    expiry: '2026-10-16',
    status: 'Emitida',
    ncfType: 'B15',
    ncf: 'B1500000001',
    client: 'Construcciones & Estructuras del Caribe',
    rnc: '1-31-88421-9',
    address: 'Av. Winston Churchill #1099, Piantini, Sto. Dgo., Rep. Dom.',
    phone: '(809) 472-8822',
    email: 'compras@construcaribe.com.do',
    terms: '1. Precios cotizados en Pesos Dominicanos (RD$).\n2. Para iniciar la producción se requiere un anticipo del 50%, y el restante 50% contra entrega.\n3. Tiempo estimado de entrega: 3 a 5 días laborables luego de aprobado el diseño final.\n4. Esta cotización tiene una validez de 15 días a partir de su emisión.',
    includeTax: true,
    discount: 500,
    items: [
      {
        catalogId: 'cat-1',
        description: 'Letrero Acrílico 3D con Luz LED para marquesina principal (3.0 x 0.8 mts)',
        qty: 1,
        price: 8500.00,
        total: 8500.00
      },
      {
        catalogId: 'cat-7',
        description: 'Instalación y conexión eléctrica en torre corporativa Piantini',
        qty: 1,
        price: 3500.00,
        total: 3500.00
      }
    ],
    subtotal: 12000.00,
    tax: 2160.00,
    grandTotal: 13660.00
  }
];

// Instancias activas de Chart.js
const CHART_INSTANCES = {
  evolucion: null,
  topArticulos: null,
  estadoPagos: null,
  comparativa: null
};

// ==========================================
// 3. INICIALIZACIÓN Y PERSISTENCIA REAL
// ==========================================
function initApp() {
  loadRealData();
  setupEventListeners();
  initSidebarState();
  loadCompanyInfo();
  checkAuth();
  syncWithCloudDatabase();
}

function loadRealData(forceReset = false) {
  const currentDbVersion = localStorage.getItem('tusoinrd_db_version');

  // Si es primera vez, o la versión cambió, o el usuario forzó el reset:
  if (forceReset || currentDbVersion !== DB_VERSION) {
    console.log('Cargando base de datos real desde Hoja de Control _ TuSoinRD.xlsx...');
    
    // Mapear ventas reales asegurando tipos correctos
    APP_STATE.sales = (REAL_INITIAL_DATA.registro || []).map((s, idx) => ({
      id: 'sale-' + (s.numFactura || idx + 1),
      numFactura: Number(s.numFactura) || (idx + 1),
      fecha: s.fecha || new Date().toISOString().split('T')[0],
      cliente: s.cliente || 'Cliente General',
      cantidad: Number(s.cantidad) || 1,
      articuloTrabajo: s.articuloTrabajo || '',
      costoProduccion: Number(s.costoProduccion) || 0,
      totalVenta: Number(s.totalVenta) || 0,
      abonoCliente: Number(s.abonoCliente) || 0,
      pendienteCliente: Number(s.pendienteCliente != null ? s.pendienteCliente : (s.totalVenta - s.abonoCliente)) || 0,
      montoPagadoNorthCentral: Number(s.montoPagadoNorthCentral) || 0,
      montoPendienteNorthCentral: Number(s.montoPendienteNorthCentral) || 0,
      estado: s.estado || 'Entregado',
      margen: Number(s.margen != null ? s.margen : (s.totalVenta - s.costoProduccion)) || 0,
      estadoCostoProduccion: s.estadoCostoProduccion || ''
    }));

    // Mapear gastos reales de Salida Mensual
    APP_STATE.expenses = (REAL_INITIAL_DATA.salidaMensual || []).map((e, idx) => ({
      id: 'exp-' + (idx + 1),
      fecha: e.fecha || new Date().toISOString().split('T')[0],
      categoria: e.categoria || 'Gasto variable',
      descripcion: e.descripcion || '',
      monto: Number(e.monto) || 0
    }));

    // Proveedor NorthCentral derivado de las operaciones reales
    const totalNCPagado = APP_STATE.sales.reduce((acc, s) => acc + (s.montoPagadoNorthCentral || 0), 0);
    const totalNCPendiente = APP_STATE.sales.reduce((acc, s) => acc + (s.montoPendienteNorthCentral || 0), 0);
    
    APP_STATE.suppliers = [
      {
        id: 'supp-nc',
        name: 'NorthCentral',
        concept: 'Insumos, impresiones y servicios de producción',
        date: '2026-10-02',
        total: totalNCPagado + totalNCPendiente,
        paid: totalNCPagado,
        balance: totalNCPendiente
      }
    ];

    // Cargar o inicializar Catálogo y Cotizaciones
    APP_STATE.catalog = JSON.parse(localStorage.getItem('tusoinrd_catalog')) || [...DEFAULT_CATALOG];
    APP_STATE.quotes = JSON.parse(localStorage.getItem('tusoinrd_quotes')) || [...DEFAULT_QUOTES];

    saveSales();
    saveExpenses();
    saveSuppliers();
    saveCatalog();
    saveQuotes();
    localStorage.setItem('tusoinrd_db_version', DB_VERSION);
  } else {
    // Cargar desde LocalStorage
    try {
      APP_STATE.sales = JSON.parse(localStorage.getItem('tusoinrd_sales')) || [];
      APP_STATE.expenses = JSON.parse(localStorage.getItem('tusoinrd_expenses')) || [];
      APP_STATE.suppliers = JSON.parse(localStorage.getItem('tusoinrd_suppliers')) || [];
      APP_STATE.catalog = JSON.parse(localStorage.getItem('tusoinrd_catalog')) || [...DEFAULT_CATALOG];
      APP_STATE.quotes = JSON.parse(localStorage.getItem('tusoinrd_quotes')) || [...DEFAULT_QUOTES];
    } catch (e) {
      loadRealData(true);
      return;
    }
  }

  const savedCurrency = localStorage.getItem('tusoinrd_currency');
  if (savedCurrency) APP_STATE.currency = savedCurrency;
}

// Persistencia en LocalStorage y Sincronización Inmediata con Base de Datos Externa (PostgreSQL / Supabase)
let cloudSyncDebounce = null;

function triggerCloudSave() {
  if (cloudSyncDebounce) clearTimeout(cloudSyncDebounce);
  cloudSyncDebounce = setTimeout(async () => {
    try {
      const payload = {
        sales: APP_STATE.sales,
        expenses: APP_STATE.expenses,
        suppliers: APP_STATE.suppliers,
        catalog: APP_STATE.catalog,
        quotes: APP_STATE.quotes,
        company: JSON.parse(localStorage.getItem('tusoinrd_company_info') || '{}')
      };
      await fetch('/api/sync/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log('[TuSoin Cloud] Datos sincronizados en base de datos externa permanente.');
    } catch (err) {
      // Continuar con persistencia local si no hay conexión al backend
    }
  }, 1000);
}

async function syncWithCloudDatabase() {
  try {
    const res = await fetch('/api/sync/load');
    if (res.ok) {
      const resp = await res.json();
      if (resp.status === 'success' && resp.has_data && resp.data) {
        let hasChanges = false;
        if (resp.data.sales && Array.isArray(resp.data.sales) && resp.data.sales.length > 0) {
          APP_STATE.sales = resp.data.sales;
          saveSales(false);
          hasChanges = true;
        }
        if (resp.data.expenses && Array.isArray(resp.data.expenses) && resp.data.expenses.length > 0) {
          APP_STATE.expenses = resp.data.expenses;
          saveExpenses(false);
          hasChanges = true;
        }
        if (resp.data.catalog && Array.isArray(resp.data.catalog) && resp.data.catalog.length > 0) {
          APP_STATE.catalog = resp.data.catalog;
          saveCatalog(false);
          hasChanges = true;
        }
        if (resp.data.quotes && Array.isArray(resp.data.quotes) && resp.data.quotes.length > 0) {
          APP_STATE.quotes = resp.data.quotes;
          saveQuotes(false);
          hasChanges = true;
        }
        if (resp.data.company && typeof resp.data.company === 'object') {
          localStorage.setItem('tusoinrd_company_info', JSON.stringify(resp.data.company));
          loadCompanyInfo();
          hasChanges = true;
        }
        if (hasChanges) {
          console.log('[TuSoin Cloud] Estado hidratado desde base de datos externa permanente.');
          renderAllViews();
        }
      }
    }
  } catch (e) {
    console.log('[TuSoin] Modo local activo.');
  }
}

function saveSales(triggerSync = true) {
  localStorage.setItem('tusoinrd_sales', JSON.stringify(APP_STATE.sales));
  if (triggerSync) triggerCloudSave();
}
function saveExpenses(triggerSync = true) {
  localStorage.setItem('tusoinrd_expenses', JSON.stringify(APP_STATE.expenses));
  if (triggerSync) triggerCloudSave();
}
function saveSuppliers(triggerSync = true) {
  localStorage.setItem('tusoinrd_suppliers', JSON.stringify(APP_STATE.suppliers));
  if (triggerSync) triggerCloudSave();
}
function saveCatalog(triggerSync = true) {
  localStorage.setItem('tusoinrd_catalog', JSON.stringify(APP_STATE.catalog));
  if (triggerSync) triggerCloudSave();
}
function saveQuotes(triggerSync = true) {
  localStorage.setItem('tusoinrd_quotes', JSON.stringify(APP_STATE.quotes));
  if (triggerSync) triggerCloudSave();
}
function saveCurrency() {
  localStorage.setItem('tusoinrd_currency', APP_STATE.currency);
}

// ==========================================
// 4. CONTROL DE ACCESO (AUTENTICACIÓN)
// ==========================================
function checkAuth() {
  const sessionUser = localStorage.getItem('tusoinrd_session') || sessionStorage.getItem('tusoinrd_session');
  const authContainer = document.getElementById('authContainer');
  const appLayout = document.getElementById('appLayout');

  if (sessionUser) {
    try {
      APP_STATE.currentUser = JSON.parse(sessionUser);
      authContainer.style.display = 'none';
      appLayout.style.display = 'flex';
      updateUserUI();
      updateCurrencyUI();
      renderAllViews();
    } catch (e) {
      handleLogout();
    }
  } else {
    APP_STATE.currentUser = null;
    authContainer.style.display = 'flex';
    appLayout.style.display = 'none';
  }
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const remember = document.getElementById('rememberMe').checked;
  const submitBtn = document.getElementById('btnLoginSubmit');
  const alertBox = document.getElementById('loginAlert');
  const alertText = document.getElementById('loginAlertText');

  submitBtn.querySelector('.btn-text').style.display = 'none';
  submitBtn.querySelector('.btn-loader').style.display = 'flex';
  submitBtn.disabled = true;
  alertBox.style.display = 'none';

  setTimeout(() => {
    const userFound = AUTH_USERS.find(u => u.email.toLowerCase() === email && u.password === password);

    if (userFound) {
      const userSession = {
        email: userFound.email,
        name: userFound.name,
        role: userFound.role,
        initials: userFound.initials,
        loginAt: new Date().toISOString()
      };

      if (remember) {
        localStorage.setItem('tusoinrd_session', JSON.stringify(userSession));
      } else {
        sessionStorage.setItem('tusoinrd_session', JSON.stringify(userSession));
      }

      APP_STATE.currentUser = userSession;
      checkAuth();
      showToast(`¡Bienvenido, ${userFound.name}!`);
    } else {
      alertText.textContent = 'Correo electrónico o contraseña incorrectos. Verifica tus credenciales.';
      alertBox.style.display = 'flex';
    }

    submitBtn.querySelector('.btn-text').style.display = 'inline-block';
    submitBtn.querySelector('.btn-loader').style.display = 'none';
    submitBtn.disabled = false;
  }, 400);
}

function handleLogout() {
  localStorage.removeItem('tusoinrd_session');
  sessionStorage.removeItem('tusoinrd_session');
  APP_STATE.currentUser = null;
  checkAuth();
  showToast('Has cerrado sesión correctamente.');
}

function updateUserUI() {
  if (!APP_STATE.currentUser) return;
  document.getElementById('userAvatarText').textContent = APP_STATE.currentUser.initials || 'AD';
  document.getElementById('userFullName').textContent = APP_STATE.currentUser.name || 'Admin TuSoinRD';
  document.getElementById('userEmailText').textContent = APP_STATE.currentUser.email || 'admin@tusoinrd.com';
}

window.fillAdminCredentials = function(email, password) {
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginPassword').value = password;
  document.getElementById('loginAlert').style.display = 'none';
};

// ==========================================
// 5. FORMATEO Y UTILIDADES FINANCIERAS
// ==========================================
function formatMoney(amount) {
  const num = Number(amount) || 0;
  return `${APP_STATE.currency} ${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function getNextInvoiceNumber() {
  let highest = 0;
  APP_STATE.sales.forEach(s => {
    const num = Number(s.numFactura);
    if (!isNaN(num) && num > highest) highest = num;
  });
  return highest + 1;
}

// ==========================================
// 6. SECCIÓN ANALÍTICA: DASHBOARD & MÉTRICAS
// ==========================================
function getSalesByTimeRange(range) {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7);
  const currentYear = today.substring(0, 4);

  return APP_STATE.sales.filter(s => {
    if (range === 'today') return s.fecha === today;
    if (range === '7days') {
      const saleTime = new Date(s.fecha).getTime();
      const sevenDaysAgo = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
      return saleTime >= sevenDaysAgo;
    }
    if (range === 'month') return s.fecha && s.fecha.startsWith(currentMonth);
    if (range === 'year') return s.fecha && s.fecha.startsWith(currentYear);
    return true; // 'all'
  });
}

function renderDashboardMetrics() {
  const range = APP_STATE.dashboardTimeRange;
  const sales = getSalesByTimeRange(range);

  let totalSales = 0;
  let totalCosts = 0;
  let totalPendingClient = 0;
  let totalPendingNC = 0;
  let totalPaidNC = 0;
  let totalGrossProfit = 0;
  const clientsSet = new Set();

  sales.forEach(s => {
    totalSales += Number(s.totalVenta) || 0;
    totalCosts += Number(s.costoProduccion) || 0;
    totalPendingClient += Number(s.pendienteCliente) || 0;
    totalPendingNC += Number(s.montoPendienteNorthCentral) || 0;
    totalPaidNC += Number(s.montoPagadoNorthCentral) || 0;
    totalGrossProfit += Number(s.margen != null ? s.margen : (s.totalVenta - s.costoProduccion)) || 0;
    if (s.cliente) clientsSet.add(s.cliente.trim().toLowerCase());
  });

  const marginPct = totalSales > 0 ? ((totalGrossProfit / totalSales) * 100).toFixed(1) : 0;
  const avgSale = sales.length > 0 ? (totalSales / sales.length) : 0;
  const collectedAmount = Math.max(0, totalSales - totalPendingClient);
  const collectedPct = totalSales > 0 ? ((collectedAmount / totalSales) * 100).toFixed(1) : 0;

  // Actualizar Tarjetas SaaS del Dashboard
  document.getElementById('dashTotalSales').textContent = formatMoney(totalSales);
  document.getElementById('dashSalesCount').textContent = `${sales.length} trabajos registrados`;
  document.getElementById('dashSalesGrowthText').textContent = `${sales.length} órdenes`;

  document.getElementById('dashGrossProfit').textContent = formatMoney(totalGrossProfit);
  document.getElementById('dashProfitMargin').textContent = `Margen: ${marginPct}%`;
  document.getElementById('dashCostSubtext').textContent = `Costos: ${formatMoney(totalCosts)}`;

  document.getElementById('dashPendingBalance').textContent = formatMoney(totalPendingClient);
  const pendingCount = sales.filter(s => s.pendienteCliente > 0.01).length;
  document.getElementById('dashPendingOrders').textContent = `${pendingCount} facturas con saldo`;
  document.getElementById('dashCollectedPercent').textContent = `${collectedPct}% recaudado`;

  document.getElementById('dashPendingNorthCentral').textContent = formatMoney(totalPendingNC);
  document.getElementById('dashPaidNorthCentral').textContent = `Pagado: ${formatMoney(totalPaidNC)}`;

  document.getElementById('dashAvgSale').textContent = formatMoney(avgSale);
  document.getElementById('dashClientsCount').textContent = `${clientsSet.size} clientes`;

  const labels = {
    today: 'Datos: Hoy',
    '7days': 'Datos: Últimos 7 días',
    month: 'Datos: Este mes',
    year: 'Datos: Este año',
    all: 'Datos Reales: Todo el historial (Excel)'
  };
  document.getElementById('dashboardFilterLabel').textContent = labels[range] || 'Datos filtrados';

  renderCharts(sales);
}

// ==========================================
// 7. GRÁFICOS INTERACTIVOS (CHART.JS)
// ==========================================
function renderCharts(salesList) {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js no está disponible aún');
    return;
  }

  // 1. Gráfico de Líneas / Área: Evolución de Ventas vs Costos
  renderChartEvolucion(salesList);

  // 2. Gráfico de Barras: Top 5 Trabajos / Artículos
  renderChartTopArticulos(salesList);

  // 3. Gráfico Circular: Estados de Entrega / Trabajos
  renderChartEstadoPagos(salesList);

  // 4. Comparativa Mensual: Facturación vs Salida Mensual
  renderChartComparativaMensual();
}

function renderChartEvolucion(salesList) {
  const ctx = document.getElementById('chartEvolucion');
  if (!ctx) return;

  if (CHART_INSTANCES.evolucion) {
    CHART_INSTANCES.evolucion.destroy();
  }

  // Agrupar ventas y costos por fecha
  const dateMap = {};
  const sorted = [...salesList].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  sorted.forEach(s => {
    if (!s.fecha) return;
    if (!dateMap[s.fecha]) {
      dateMap[s.fecha] = { sales: 0, costs: 0 };
    }
    dateMap[s.fecha].sales += Number(s.totalVenta) || 0;
    dateMap[s.fecha].costs += Number(s.costoProduccion) || 0;
  });

  const labels = Object.keys(dateMap).map(d => formatDate(d));
  const dataSales = Object.values(dateMap).map(v => v.sales);
  const dataCosts = Object.values(dateMap).map(v => v.costs);

  CHART_INSTANCES.evolucion = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length > 0 ? labels : ['Sin datos'],
      datasets: [
        {
          label: 'Ventas (Ingresos)',
          data: dataSales.length > 0 ? dataSales : [0],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointBackgroundColor: '#10b981',
          pointRadius: 3,
          pointHoverRadius: 6
        },
        {
          label: 'Costos Producción',
          data: dataCosts.length > 0 ? dataCosts : [0],
          borderColor: '#64748b',
          backgroundColor: 'rgba(100, 116, 139, 0.08)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointBackgroundColor: '#64748b',
          pointRadius: 2.5,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { font: { family: 'Plus Jakarta Sans', size: 12 }, boxWidth: 14 } },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Plus Jakarta Sans', size: 13, weight: 'bold' },
          bodyFont: { family: 'JetBrains Mono', size: 12 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: context => ` ${context.dataset.label}: ${formatMoney(context.parsed.y)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: {
            font: { family: 'JetBrains Mono', size: 11 },
            callback: value => `${APP_STATE.currency} ${value.toLocaleString()}`
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Plus Jakarta Sans', size: 10 }, maxRotation: 45 }
        }
      }
    }
  });
}

function renderChartTopArticulos(salesList) {
  const ctx = document.getElementById('chartTopArticulos');
  if (!ctx) return;

  if (CHART_INSTANCES.topArticulos) {
    CHART_INSTANCES.topArticulos.destroy();
  }

  // Agrupar por artículo/trabajo
  const itemMap = {};
  salesList.forEach(s => {
    const key = s.articuloTrabajo ? s.articuloTrabajo.trim() : 'Sin descripción';
    itemMap[key] = (itemMap[key] || 0) + (Number(s.totalVenta) || 0);
  });

  const sortedItems = Object.entries(itemMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const labels = sortedItems.map(item => truncateText(item[0], 20));
  const data = sortedItems.map(item => item[1]);

  CHART_INSTANCES.topArticulos = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length > 0 ? labels : ['Sin trabajos'],
      datasets: [{
        label: 'Total Facturado',
        data: data.length > 0 ? data : [0],
        backgroundColor: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Plus Jakarta Sans', size: 12 },
          bodyFont: { family: 'JetBrains Mono', size: 12 },
          callbacks: {
            title: items => sortedItems[items[0].dataIndex] ? sortedItems[items[0].dataIndex][0] : '',
            label: context => ` Total Venta: ${formatMoney(context.parsed.y)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: {
            font: { family: 'JetBrains Mono', size: 11 },
            callback: value => `${APP_STATE.currency} ${value.toLocaleString()}`
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } }
        }
      }
    }
  });
}

function renderChartEstadoPagos(salesList) {
  const ctx = document.getElementById('chartEstadoPagos');
  if (!ctx) return;

  if (CHART_INSTANCES.estadoPagos) {
    CHART_INSTANCES.estadoPagos.destroy();
  }

  // Agrupar por Estado del Trabajo de la Hoja de Control
  const statusCounts = {
    'Entregado': 0,
    'En Proceso': 0,
    'Pendiente': 0,
    'Sin Iniciar': 0
  };

  salesList.forEach(s => {
    const est = (s.estado || '').trim();
    if (est === 'Entregado') statusCounts['Entregado']++;
    else if (est.toLowerCase().includes('proceso')) statusCounts['En Proceso']++;
    else if (est.toLowerCase().includes('iniciar')) statusCounts['Sin Iniciar']++;
    else statusCounts['Pendiente']++;
  });

  const labels = Object.keys(statusCounts);
  const data = Object.values(statusCounts);
  const total = data.reduce((a, b) => a + b, 0);

  CHART_INSTANCES.estadoPagos = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: total > 0 ? data : [1],
        backgroundColor: ['#10b981', '#0284c7', '#f59e0b', '#64748b'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Plus Jakarta Sans', size: 11 }, padding: 12 } },
        tooltip: {
          backgroundColor: '#0f172a',
          bodyFont: { family: 'JetBrains Mono', size: 12 },
          callbacks: {
            label: context => {
              const val = context.parsed;
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
              return ` ${context.label}: ${val} órdenes (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

function renderChartComparativaMensual() {
  const ctx = document.getElementById('chartComparativaMensual');
  if (!ctx) return;

  if (CHART_INSTANCES.comparativa) {
    CHART_INSTANCES.comparativa.destroy();
  }

  const monthMap = {};

  APP_STATE.sales.forEach(s => {
    if (!s.fecha) return;
    const m = s.fecha.substring(0, 7);
    if (!monthMap[m]) monthMap[m] = { sales: 0, expenses: 0 };
    monthMap[m].sales += Number(s.totalVenta) || 0;
  });

  APP_STATE.expenses.forEach(e => {
    if (!e.fecha) return;
    const m = e.fecha.substring(0, 7);
    if (!monthMap[m]) monthMap[m] = { sales: 0, expenses: 0 };
    monthMap[m].expenses += Number(e.monto) || 0;
  });

  const sortedMonths = Object.keys(monthMap).sort();
  const monthNames = {
    '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
    '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
  };

  const labels = sortedMonths.map(m => {
    const parts = m.split('-');
    const mName = monthNames[parts[1]] || parts[1];
    return `${mName} ${parts[0]}`;
  });

  const dataSales = sortedMonths.map(m => monthMap[m].sales);
  const dataExpenses = sortedMonths.map(m => monthMap[m].expenses);

  CHART_INSTANCES.comparativa = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length > 0 ? labels : ['Mes actual'],
      datasets: [
        {
          label: 'Facturación Ventas',
          data: dataSales.length > 0 ? dataSales : [0],
          backgroundColor: '#059669',
          borderRadius: 6
        },
        {
          label: 'Salida Mensual (Gastos)',
          data: dataExpenses.length > 0 ? dataExpenses : [0],
          backgroundColor: '#ef4444',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { family: 'Plus Jakarta Sans', size: 12 } } },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Plus Jakarta Sans', size: 13, weight: 'bold' },
          bodyFont: { family: 'JetBrains Mono', size: 12 },
          callbacks: {
            label: context => ` ${context.dataset.label}: ${formatMoney(context.parsed.y)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: {
            font: { family: 'JetBrains Mono', size: 11 },
            callback: value => `${APP_STATE.currency} ${value.toLocaleString()}`
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Plus Jakarta Sans', size: 11 } }
        }
      }
    }
  });
}

// ==========================================
// 8. RENDERIZADO REGISTRO DIARIO (HOJA DE CONTROL)
// ==========================================
function renderSalesTable() {
  const tbody = document.getElementById('salesTableBody');
  const emptyMsg = document.getElementById('emptyTableMessage');
  if (!tbody) return;

  tbody.innerHTML = '';
  const filtered = getFilteredSales();

  if (filtered.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'block';
  } else {
    if (emptyMsg) emptyMsg.style.display = 'none';
  }

  // Ordenar por Nº de factura descendente
  filtered.sort((a, b) => Number(b.numFactura) - Number(a.numFactura));

  filtered.forEach(sale => {
    const tr = document.createElement('tr');
    
    // Indicador visual de fila según balance y estado
    if (sale.pendienteCliente <= 0.01) {
      tr.className = 'row-pagado';
    } else if (sale.abonoCliente > 0) {
      tr.className = 'row-parcial';
    } else {
      tr.className = 'row-pendiente';
    }

    // Badge para Estado del Trabajo
    let estadoBadge = 'badge-pendiente';
    const est = (sale.estado || '').toLowerCase();
    if (est.includes('entregado')) estadoBadge = 'badge-pagado';
    else if (est.includes('proceso')) estadoBadge = 'badge-parcial';

    // Badge para Estado Costo Prod
    let estadoCostoBadge = 'badge-parcial';
    const ec = (sale.estadoCostoProduccion || '').toUpperCase();
    if (ec === 'PAGADO') estadoCostoBadge = 'badge-pagado';
    else if (ec.includes('NO') || ec.includes('PENDIENTE')) estadoCostoBadge = 'badge-pendiente';

    tr.innerHTML = `
      <td><span class="invoice-badge">#${sale.numFactura}</span></td>
      <td>${formatDate(sale.fecha)}</td>
      <td><strong>${escapeHtml(sale.cliente)}</strong></td>
      <td style="text-align: center;">${Number(sale.cantidad).toLocaleString()}</td>
      <td title="${escapeHtml(sale.articuloTrabajo)}">${escapeHtml(truncateText(sale.articuloTrabajo, 35))}</td>
      <td style="text-align: right;" class="table-currency">${formatMoney(sale.costoProduccion)}</td>
      <td style="text-align: right;" class="table-currency font-weight-bold">${formatMoney(sale.totalVenta)}</td>
      <td style="text-align: right;" class="table-currency text-positive">${formatMoney(sale.abonoCliente)}</td>
      <td style="text-align: right;" class="table-currency ${sale.pendienteCliente > 0 ? 'text-negative' : ''}">
        ${formatMoney(sale.pendienteCliente)}
      </td>
      <td style="text-align: right;" class="table-currency text-positive">
        ${formatMoney(sale.montoPagadoNorthCentral)}
      </td>
      <td style="text-align: right;" class="table-currency ${sale.montoPendienteNorthCentral > 0 ? 'text-negative' : ''}">
        ${formatMoney(sale.montoPendienteNorthCentral)}
      </td>
      <td style="text-align: right;" class="table-currency text-positive font-weight-bold">
        ${formatMoney(sale.margen)}
      </td>
      <td style="text-align: center;">
        <span class="status-badge ${estadoBadge}">${escapeHtml(sale.estado || 'Entregado')}</span>
      </td>
      <td style="text-align: center;">
        <span class="status-badge ${estadoCostoBadge}">${escapeHtml(sale.estadoCostoProduccion || '---')}</span>
      </td>
      <td style="text-align: center;">
        <div class="action-buttons-cell">
          ${sale.pendienteCliente > 0.01 ? `
            <button class="btn-icon btn-icon-pay" onclick="openAbonoModal('${sale.id}')" title="Registrar Abono Cliente">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </button>
          ` : ''}
          <button class="btn-icon" onclick="editSale('${sale.id}')" title="Editar Registro">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button class="btn-icon btn-icon-danger" onclick="deleteSale('${sale.id}')" title="Eliminar Registro">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updateKPICards(filtered);
}

function getFilteredSales() {
  const { search, dateStart, dateEnd, status, paymentStatus } = APP_STATE.activeFilters;
  const query = search.trim().toLowerCase();

  return APP_STATE.sales.filter(s => {
    if (query) {
      const matchClient = (s.cliente || '').toLowerCase().includes(query);
      const matchInvoice = String(s.numFactura).includes(query);
      const matchDesc = (s.articuloTrabajo || '').toLowerCase().includes(query);
      if (!matchClient && !matchInvoice && !matchDesc) return false;
    }

    if (status !== 'all') {
      if ((s.estado || '').toLowerCase() !== status.toLowerCase()) return false;
    }

    if (paymentStatus === 'pagado') {
      if (s.pendienteCliente > 0.01) return false;
    } else if (paymentStatus === 'pendiente') {
      if (s.pendienteCliente <= 0.01) return false;
    }

    if (dateStart && s.fecha < dateStart) return false;
    if (dateEnd && s.fecha > dateEnd) return false;

    return true;
  });
}

function updateKPICards(currentSales) {
  let totalVentas = 0;
  let totalCostos = 0;
  let totalMargen = 0;
  let totalAbono = 0;
  let totalPendienteCliente = 0;
  let totalPendienteNC = 0;
  let totalPagadoNC = 0;
  let facturasPendientesCount = 0;

  currentSales.forEach(s => {
    totalVentas += Number(s.totalVenta) || 0;
    totalCostos += Number(s.costoProduccion) || 0;
    totalMargen += Number(s.margen != null ? s.margen : (s.totalVenta - s.costoProduccion)) || 0;
    totalAbono += Number(s.abonoCliente) || 0;
    totalPendienteCliente += Number(s.pendienteCliente) || 0;
    totalPendienteNC += Number(s.montoPendienteNorthCentral) || 0;
    totalPagadoNC += Number(s.montoPagadoNorthCentral) || 0;
    if (s.pendienteCliente > 0.01) facturasPendientesCount++;
  });

  document.getElementById('kpiTotalVentas').textContent = formatMoney(totalVentas);
  document.getElementById('kpiCantVentas').textContent = `${currentSales.length} órdenes reales`;

  document.getElementById('kpiTotalCostos').textContent = formatMoney(totalCostos);
  const costPct = totalVentas > 0 ? ((totalCostos / totalVentas) * 100).toFixed(1) : 0;
  document.getElementById('kpiMargenCosto').textContent = `Representa ${costPct}% de ventas`;

  document.getElementById('kpiGananciaBruta').textContent = formatMoney(totalMargen);
  const marginPct = totalVentas > 0 ? ((totalMargen / totalVentas) * 100).toFixed(1) : 0;
  document.getElementById('kpiMargenPorc').textContent = `Margen Bruto: ${marginPct}%`;

  document.getElementById('kpiTotalCobrado').textContent = formatMoney(totalAbono);
  const cobradoPct = totalVentas > 0 ? ((totalAbono / totalVentas) * 100).toFixed(1) : 0;
  document.getElementById('kpiEfectivoRecibido').textContent = `${cobradoPct}% cobrado`;

  document.getElementById('kpiTotalPorCobrar').textContent = formatMoney(totalPendienteCliente);
  document.getElementById('kpiPendientesCount').textContent = `${facturasPendientesCount} facturas con saldo`;

  document.getElementById('kpiPendienteNorthCentral').textContent = formatMoney(totalPendienteNC);
  document.getElementById('kpiPagadoNorthCentral').textContent = `Pagado a NC: ${formatMoney(totalPagadoNC)}`;
}

// ==========================================
// 9. SALIDA MENSUAL (GASTOS OPERATIVOS)
// ==========================================
function renderExpensesTable() {
  const tbody = document.getElementById('expensesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  let totalGastos = 0;
  let totalFijo = 0;
  let totalVariable = 0;

  APP_STATE.expenses.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  APP_STATE.expenses.forEach(exp => {
    const monto = Number(exp.monto) || 0;
    totalGastos += monto;

    const cat = (exp.categoria || '').toLowerCase();
    if (cat.includes('fijo')) totalFijo += monto;
    else totalVariable += monto;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(exp.fecha)}</td>
      <td><span class="invoice-badge">${escapeHtml(exp.categoria)}</span></td>
      <td><strong>${escapeHtml(exp.descripcion)}</strong></td>
      <td style="text-align: right;" class="table-currency text-negative">${formatMoney(monto)}</td>
      <td style="text-align: center;">
        <button class="btn-icon btn-icon-danger" onclick="deleteExpense('${exp.id}')" title="Eliminar Gasto">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('expensesTotalAmount').textContent = formatMoney(totalGastos);
  document.getElementById('expensesFixedTotal').textContent = formatMoney(totalFijo);
  document.getElementById('expensesVariableTotal').textContent = formatMoney(totalVariable);
  document.getElementById('expensesCount').textContent = `${APP_STATE.expenses.length} gastos`;
}

// ==========================================
// 10. PAGOS A PROVEEDORES / TERCEROS
// ==========================================
function renderSuppliersTable() {
  const tbody = document.getElementById('suppliersTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  let totalDebt = 0;
  let totalPaid = 0;

  APP_STATE.suppliers.forEach(supp => {
    const balance = Math.max(0, supp.total - supp.paid);
    totalDebt += balance;
    totalPaid += supp.paid;

    let badgeClass = 'badge-pagado';
    let statusText = 'Pagado';
    if (balance > 0.01 && supp.paid > 0) {
      badgeClass = 'badge-parcial';
      statusText = 'Parcial';
    } else if (supp.paid <= 0.01) {
      badgeClass = 'badge-pendiente';
      statusText = 'Pendiente';
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(supp.name)}</strong></td>
      <td>${escapeHtml(supp.concept)}</td>
      <td>${formatDate(supp.date)}</td>
      <td style="text-align: right;" class="table-currency">${formatMoney(supp.total)}</td>
      <td style="text-align: right;" class="table-currency text-positive">${formatMoney(supp.paid)}</td>
      <td style="text-align: right;" class="table-currency ${balance > 0 ? 'text-negative' : ''}">${formatMoney(balance)}</td>
      <td style="text-align: center;">
        <span class="status-badge ${badgeClass}">${statusText}</span>
      </td>
      <td style="text-align: center;">
        <button class="btn-icon btn-icon-danger" onclick="deleteSupplier('${supp.id}')" title="Eliminar Registro">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('suppliersTotalDebt').textContent = formatMoney(totalDebt);
  document.getElementById('suppliersTotalPaid').textContent = formatMoney(totalPaid);
}

// ==========================================
// 11. INGRESO NETO (CASCADA FINANCIERA REAL)
// ==========================================
function renderNetIncomeView() {
  const monthFilter = document.getElementById('monthFilterNet').value;

  let totalVentas = 0;
  let totalCostos = 0;
  let totalGastos = 0;

  APP_STATE.sales.forEach(s => {
    if (!monthFilter || (s.fecha && s.fecha.startsWith(monthFilter))) {
      totalVentas += Number(s.totalVenta) || 0;
      totalCostos += Number(s.costoProduccion) || 0;
    }
  });

  APP_STATE.expenses.forEach(e => {
    if (!monthFilter || (e.fecha && e.fecha.startsWith(monthFilter))) {
      totalGastos += Number(e.monto) || 0;
    }
  });

  const gananciaBruta = totalVentas - totalCostos;
  const utilidadReal = gananciaBruta - totalGastos;
  const netMargin = totalVentas > 0 ? ((utilidadReal / totalVentas) * 100).toFixed(1) : 0;

  document.getElementById('netVentasGross').textContent = formatMoney(totalVentas);
  document.getElementById('netCostosDirectos').textContent = `- ${formatMoney(totalCostos)}`;
  document.getElementById('netGananciaBruta').textContent = formatMoney(gananciaBruta);
  document.getElementById('netGastosOperativos').textContent = `- ${formatMoney(totalGastos)}`;
  
  const grandNum = document.getElementById('netUtilidadReal');
  grandNum.textContent = formatMoney(utilidadReal);
  if (utilidadReal < 0) {
    grandNum.style.color = '#fecaca';
  } else {
    grandNum.style.color = '#ffffff';
  }

  document.getElementById('netMarginPercent').textContent = `Margen Neto Real: ${netMargin}%`;
}

function renderAllViews() {
  renderDashboardMetrics();
  renderSalesTable();
  renderExpensesTable();
  renderSuppliersTable();
  renderNetIncomeView();
  renderCatalogTable();
  renderQuotesTable();
  populateCatalogDropdowns();
  populateClientsDatalist();
}

// ==========================================
// 12. CÁLCULOS DINÁMICOS EN EL FORMULARIO
// ==========================================
function updateLiveFormCalculations() {
  const total = parseFloat(document.getElementById('saleTotal').value) || 0;
  const cost = parseFloat(document.getElementById('saleCost').value) || 0;
  const abono = parseFloat(document.getElementById('saleAbono').value) || 0;
  const pagadoNC = parseFloat(document.getElementById('saleMontoPagadoNC').value) || 0;

  const balanceCliente = Math.max(0, total - abono);
  const margen = total - cost;
  const pendienteNC = Math.max(0, cost - pagadoNC);

  document.getElementById('liveBalancePendiente').textContent = formatMoney(balanceCliente);
  document.getElementById('liveGananciaBruta').textContent = formatMoney(margen);
  
  // Auto sugerir monto pendiente a NorthCentral si el usuario no lo ingresó manualmente
  const inputPendienteNC = document.getElementById('saleMontoPendienteNC');
  if (!inputPendienteNC.dataset.manualEdit) {
    inputPendienteNC.value = pendienteNC.toFixed(2);
  }
}

// ==========================================
// 13. ACCIONES DE VENTAS / TRABAJOS (MODAL)
// ==========================================
function openSaleModal(saleToEdit = null) {
  const form = document.getElementById('saleForm');
  form.reset();

  const title = document.getElementById('saleModalTitle');
  const saleIdInput = document.getElementById('saleId');
  const inputPendienteNC = document.getElementById('saleMontoPendienteNC');
  delete inputPendienteNC.dataset.manualEdit;

  if (saleToEdit) {
    title.textContent = `Editar Trabajo: Factura #${saleToEdit.numFactura}`;
    saleIdInput.value = saleToEdit.id;
    document.getElementById('saleInvoice').value = saleToEdit.numFactura;
    document.getElementById('saleDate').value = saleToEdit.fecha;
    document.getElementById('saleClient').value = saleToEdit.cliente;
    document.getElementById('saleQuantity').value = saleToEdit.cantidad;
    document.getElementById('saleDescription').value = saleToEdit.articuloTrabajo;
    document.getElementById('saleCost').value = saleToEdit.costoProduccion;
    document.getElementById('saleTotal').value = saleToEdit.totalVenta;
    document.getElementById('saleAbono').value = saleToEdit.abonoCliente;
    document.getElementById('saleMontoPagadoNC').value = saleToEdit.montoPagadoNorthCentral;
    document.getElementById('saleMontoPendienteNC').value = saleToEdit.montoPendienteNorthCentral;
    document.getElementById('saleEstadoTrabajo').value = saleToEdit.estado || 'Entregado';
    document.getElementById('saleEstadoCostoProd').value = saleToEdit.estadoCostoProduccion || '';
  } else {
    title.textContent = 'Registrar Venta / Trabajo (Hoja de Control)';
    saleIdInput.value = '';
    document.getElementById('saleInvoice').value = getNextInvoiceNumber();
    document.getElementById('saleDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('saleQuantity').value = '1.00';
    document.getElementById('saleCost').value = '';
    document.getElementById('saleTotal').value = '';
    document.getElementById('saleAbono').value = '0.00';
    document.getElementById('saleMontoPagadoNC').value = '0.00';
    document.getElementById('saleMontoPendienteNC').value = '0.00';
    document.getElementById('saleEstadoTrabajo').value = 'Entregado';
    document.getElementById('saleEstadoCostoProd').value = 'PAGADO';
  }

  updateLiveFormCalculations();
  document.getElementById('saleModal').style.display = 'flex';
}

function closeSaleModal() {
  document.getElementById('saleModal').style.display = 'none';
}

function handleSaveSale(e) {
  e.preventDefault();

  const saleId = document.getElementById('saleId').value;
  const numFactura = Number(document.getElementById('saleInvoice').value) || getNextInvoiceNumber();
  const fecha = document.getElementById('saleDate').value;
  const cliente = document.getElementById('saleClient').value.trim();
  const cantidad = parseFloat(document.getElementById('saleQuantity').value) || 1;
  const articuloTrabajo = document.getElementById('saleDescription').value.trim();
  const costoProduccion = parseFloat(document.getElementById('saleCost').value) || 0;
  const totalVenta = parseFloat(document.getElementById('saleTotal').value) || 0;
  const abonoCliente = parseFloat(document.getElementById('saleAbono').value) || 0;
  const montoPagadoNorthCentral = parseFloat(document.getElementById('saleMontoPagadoNC').value) || 0;
  const montoPendienteNorthCentral = parseFloat(document.getElementById('saleMontoPendienteNC').value) || 0;
  const estado = document.getElementById('saleEstadoTrabajo').value;
  const estadoCostoProduccion = document.getElementById('saleEstadoCostoProd').value;

  const pendienteCliente = Math.max(0, totalVenta - abonoCliente);
  const margen = totalVenta - costoProduccion;

  if (saleId) {
    const index = APP_STATE.sales.findIndex(s => s.id === saleId);
    if (index !== -1) {
      APP_STATE.sales[index] = {
        ...APP_STATE.sales[index],
        numFactura,
        fecha,
        cliente,
        cantidad,
        articuloTrabajo,
        costoProduccion,
        totalVenta,
        abonoCliente,
        pendienteCliente,
        montoPagadoNorthCentral,
        montoPendienteNorthCentral,
        estado,
        margen,
        estadoCostoProduccion
      };
      showToast(`Factura #${numFactura} actualizada correctamente.`);
    }
  } else {
    const newSale = {
      id: 'sale-' + Date.now(),
      numFactura,
      fecha,
      cliente,
      cantidad,
      articuloTrabajo,
      costoProduccion,
      totalVenta,
      abonoCliente,
      pendienteCliente,
      montoPagadoNorthCentral,
      montoPendienteNorthCentral,
      estado,
      margen,
      estadoCostoProduccion
    };
    APP_STATE.sales.unshift(newSale);
    showToast(`Factura #${numFactura} guardada con éxito.`);
  }

  saveSales();
  closeSaleModal();
  renderAllViews();
}

window.editSale = function(id) {
  const sale = APP_STATE.sales.find(s => s.id === id);
  if (sale) openSaleModal(sale);
};

window.deleteSale = function(id) {
  const sale = APP_STATE.sales.find(s => s.id === id);
  if (!sale) return;

  if (confirm(`¿Eliminar definitivamente el registro de Factura #${sale.numFactura} de ${sale.cliente}?`)) {
    APP_STATE.sales = APP_STATE.sales.filter(s => s.id !== id);
    saveSales();
    renderAllViews();
    showToast(`Factura #${sale.numFactura} eliminada.`, 'error');
  }
};

// ==========================================
// 14. REGISTRO DE ABONOS A FACTURAS
// ==========================================
window.openAbonoModal = function(saleId) {
  const sale = APP_STATE.sales.find(s => s.id === saleId);
  if (!sale) return;

  document.getElementById('paySaleId').value = sale.id;
  document.getElementById('payInvoiceNum').textContent = sale.numFactura;
  document.getElementById('payClientName').textContent = sale.cliente;
  document.getElementById('payTotalVenta').textContent = formatMoney(sale.totalVenta);
  document.getElementById('payCurrentAbono').textContent = formatMoney(sale.abonoCliente);
  document.getElementById('payCurrentBalance').textContent = formatMoney(sale.pendienteCliente);

  document.getElementById('payAmount').value = sale.pendienteCliente.toFixed(2);
  document.getElementById('payAmount').max = sale.pendienteCliente.toFixed(2);
  document.getElementById('payDate').value = new Date().toISOString().split('T')[0];

  document.getElementById('paymentModal').style.display = 'flex';
};

function closePaymentModal() {
  document.getElementById('paymentModal').style.display = 'none';
}

function handleSavePayment(e) {
  e.preventDefault();
  const saleId = document.getElementById('paySaleId').value;
  const amount = parseFloat(document.getElementById('payAmount').value) || 0;

  const sale = APP_STATE.sales.find(s => s.id === saleId);
  if (!sale) return;

  if (amount <= 0) {
    alert('El abono debe ser mayor a 0');
    return;
  }

  sale.abonoCliente = (sale.abonoCliente || 0) + amount;
  sale.pendienteCliente = Math.max(0, sale.totalVenta - sale.abonoCliente);

  saveSales();
  closePaymentModal();
  renderAllViews();
  showToast(`Abono de ${formatMoney(amount)} aplicado a Factura #${sale.numFactura}.`);
}

// ==========================================
// 15. GASTOS OPERATIVOS (SALIDA MENSUAL)
// ==========================================
function openExpenseModal() {
  document.getElementById('expenseForm').reset();
  document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('expenseModal').style.display = 'flex';
}

function closeExpenseModal() {
  document.getElementById('expenseModal').style.display = 'none';
}

function handleSaveExpense(e) {
  e.preventDefault();
  const fecha = document.getElementById('expenseDate').value;
  const categoria = document.getElementById('expenseCategory').value;
  const descripcion = document.getElementById('expenseConcept').value.trim();
  const monto = parseFloat(document.getElementById('expenseAmount').value) || 0;

  const newExpense = {
    id: 'exp-' + Date.now(),
    fecha,
    categoria,
    descripcion,
    monto
  };

  APP_STATE.expenses.unshift(newExpense);
  saveExpenses();
  closeExpenseModal();
  renderAllViews();
  showToast(`Gasto "${descripcion}" registrado.`);
}

window.deleteExpense = function(id) {
  if (confirm('¿Deseas eliminar este registro de gasto?')) {
    APP_STATE.expenses = APP_STATE.expenses.filter(e => e.id !== id);
    saveExpenses();
    renderAllViews();
    showToast('Gasto eliminado.', 'error');
  }
};

// ==========================================
// 16. PROVEEDORES / TERCEROS
// ==========================================
function openSupplierModal() {
  document.getElementById('supplierForm').reset();
  document.getElementById('suppDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('supplierModal').style.display = 'flex';
}

function closeSupplierModal() {
  document.getElementById('supplierModal').style.display = 'none';
}

function handleSaveSupplier(e) {
  e.preventDefault();
  const name = document.getElementById('suppName').value.trim();
  const concept = document.getElementById('suppConcept').value.trim();
  const date = document.getElementById('suppDate').value;
  const total = parseFloat(document.getElementById('suppTotal').value) || 0;
  const paid = parseFloat(document.getElementById('suppPaid').value) || 0;
  const balance = Math.max(0, total - paid);

  const newSupp = {
    id: 'supp-' + Date.now(),
    name,
    concept,
    date,
    total,
    paid,
    balance
  };

  APP_STATE.suppliers.unshift(newSupp);
  saveSuppliers();
  closeSupplierModal();
  renderSuppliersTable();
  showToast(`Registro de proveedor "${name}" guardado.`);
}

window.deleteSupplier = function(id) {
  if (confirm('¿Deseas eliminar este registro de proveedor?')) {
    APP_STATE.suppliers = APP_STATE.suppliers.filter(s => s.id !== id);
    saveSuppliers();
    renderSuppliersTable();
    showToast('Proveedor eliminado.', 'error');
  }
};

// ==========================================
// 17. EXPORTACIÓN A CSV Y RESPALDOS
// ==========================================
function exportToCSV() {
  const currentSales = getFilteredSales();
  if (currentSales.length === 0) {
    alert('No hay registros para exportar con los filtros actuales.');
    return;
  }

  const headers = [
    'Nº Factura',
    'Fecha',
    'Cliente',
    'Cantidad',
    'Articulo / Trabajo',
    'Costo de Producción',
    'Total Venta',
    'Abono Cliente',
    'Pendiente Cliente',
    'Monto Pagado a NorthCentral',
    'Monto Pendiente a NorthCentral',
    'Estado',
    'Margen ($)',
    'Estado Costo de Producción'
  ];

  const rows = currentSales.map(s => [
    s.numFactura,
    `"${s.fecha}"`,
    `"${(s.cliente || '').replace(/"/g, '""')}"`,
    s.cantidad,
    `"${(s.articuloTrabajo || '').replace(/"/g, '""')}"`,
    s.costoProduccion.toFixed(2),
    s.totalVenta.toFixed(2),
    s.abonoCliente.toFixed(2),
    s.pendienteCliente.toFixed(2),
    s.montoPagadoNorthCentral.toFixed(2),
    s.montoPendienteNorthCentral.toFixed(2),
    `"${s.estado}"`,
    s.margen.toFixed(2),
    `"${s.estadoCostoProduccion || ''}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `TuSoinRD_HojaControl_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Archivo CSV compatible con Excel descargado.');
}

function exportToJsonBackup() {
  const data = {
    appName: 'TuSoinRD Finance',
    exportDate: new Date().toISOString(),
    currency: APP_STATE.currency,
    registro: APP_STATE.sales,
    salidaMensual: APP_STATE.expenses,
    suppliers: APP_STATE.suppliers,
    catalog: APP_STATE.catalog,
    quotes: APP_STATE.quotes
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `TuSoinRD_BackupReal_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  showToast('Copia de seguridad real guardada.');
}

function importFromJson(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const data = JSON.parse(event.target.result);
      if (data.registro && Array.isArray(data.registro)) {
        APP_STATE.sales = data.registro;
        saveSales();
      } else if (data.sales && Array.isArray(data.sales)) {
        APP_STATE.sales = data.sales;
        saveSales();
      }

      if (data.salidaMensual && Array.isArray(data.salidaMensual)) {
        APP_STATE.expenses = data.salidaMensual;
        saveExpenses();
      } else if (data.expenses && Array.isArray(data.expenses)) {
        APP_STATE.expenses = data.expenses;
        saveExpenses();
      }

      if (data.suppliers && Array.isArray(data.suppliers)) {
        APP_STATE.suppliers = data.suppliers;
        saveSuppliers();
      }

      if (data.catalog && Array.isArray(data.catalog)) {
        APP_STATE.catalog = data.catalog;
        saveCatalog();
      }

      if (data.quotes && Array.isArray(data.quotes)) {
        APP_STATE.quotes = data.quotes;
        saveQuotes();
      }

      renderAllViews();
      showToast('Datos restaurados correctamente.');
    } catch (err) {
      alert('Error al leer el archivo JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// ==========================================
// 18. CAMBIO DE MONEDA Y UTILIDADES
// ==========================================
function updateCurrencyUI() {
  const sel = document.getElementById('currencySelect');
  if (sel) sel.value = APP_STATE.currency;
  document.querySelectorAll('.currency-prefix').forEach(el => {
    el.textContent = APP_STATE.currency;
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function truncateText(str, max = 35) {
  if (!str) return '';
  return str.length > max ? str.substring(0, max) + '...' : str;
}

function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      ${type === 'error' ? 
        '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>' : 
        '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'}
    </svg>
    <span>${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ==========================================
// 19. CONTROL DE BARRA LATERAL (SIDEBAR) & RESPONSIVIDAD
// ==========================================
function toggleSidebarCollapse() {
  const sidebar = document.getElementById('mainSidebar');
  if (!sidebar) return;

  sidebar.classList.toggle('collapsed');
  const isCollapsed = sidebar.classList.contains('collapsed');
  localStorage.setItem('tusoinrd_sidebar_collapsed', isCollapsed ? 'true' : 'false');
}

function initSidebarState() {
  const isCollapsed = localStorage.getItem('tusoinrd_sidebar_collapsed') === 'true';
  const sidebar = document.getElementById('mainSidebar');
  if (sidebar && isCollapsed && window.innerWidth > 1024) {
    sidebar.classList.add('collapsed');
  }
}

function quickAdminLogin() {
  fillAdminCredentials('admin@tusoinrd.com', 'admin123');
  const submitBtn = document.getElementById('btnLoginSubmit');
  if (submitBtn) submitBtn.click();
}
window.quickAdminLogin = quickAdminLogin;

// ==========================================
// 20. MÓDULO 1: GESTIÓN DE PRODUCTOS Y SERVICIOS (CRUD & ALMACENAMIENTO)
// ==========================================
function renderCatalogTable() {
  const tbody = document.getElementById('catalogTableBody');
  const emptyMsg = document.getElementById('emptyCatalogMessage');
  if (!tbody) return;

  tbody.innerHTML = '';

  const categoryFilter = APP_STATE.activeCatalogCategory || 'all';
  const searchTerm = (APP_STATE.catalogSearch || '').toLowerCase().trim();

  let totalItems = APP_STATE.catalog.length;
  let prodCount = 0;
  let servCount = 0;
  let artCount = 0;

  APP_STATE.catalog.forEach(item => {
    if (item.category === 'Producto') prodCount++;
    else if (item.category === 'Servicio') servCount++;
    else if (item.category === 'Artículo') artCount++;
  });

  const totalEl = document.getElementById('catalogTotalCount');
  const prodEl = document.getElementById('catalogProductsCount');
  const servEl = document.getElementById('catalogServicesCount');
  const artEl = document.getElementById('catalogArticlesCount');

  if (totalEl) totalEl.textContent = totalItems;
  if (prodEl) prodEl.textContent = prodCount;
  if (servEl) servEl.textContent = servCount;
  if (artEl) artEl.textContent = artCount;

  const filtered = APP_STATE.catalog.filter(item => {
    const matchesCat = (categoryFilter === 'all') || (item.category === categoryFilter);
    const matchesSearch = !searchTerm || 
      (item.name && item.name.toLowerCase().includes(searchTerm)) ||
      (item.description && item.description.toLowerCase().includes(searchTerm)) ||
      (item.category && item.category.toLowerCase().includes(searchTerm));
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'block';
    return;
  } else {
    if (emptyMsg) emptyMsg.style.display = 'none';
  }

  filtered.forEach(item => {
    const tr = document.createElement('tr');

    let badgeClass = 'cat-badge-producto';
    let iconSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>';
    if (item.category === 'Servicio') {
      badgeClass = 'cat-badge-servicio';
      iconSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>';
    } else if (item.category === 'Artículo') {
      badgeClass = 'cat-badge-articulo';
      iconSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon></svg>';
    }

    tr.innerHTML = `
      <td>
        <strong style="color: var(--slate-900); font-size: 0.92rem;">${escapeHtml(item.name)}</strong>
      </td>
      <td>
        <span class="cat-badge ${badgeClass}">
          ${iconSvg}
          ${escapeHtml(item.category)}
        </span>
      </td>
      <td>
        <span class="text-muted" style="font-size: 0.85rem;">${escapeHtml(item.description || 'Sin especificaciones')}</span>
      </td>
      <td style="text-align: right;" class="table-currency">
        <strong>${formatMoney(item.price)}</strong>
      </td>
      <td style="text-align: right;" class="table-currency text-muted">
        ${formatMoney(item.cost || 0)}
      </td>
      <td style="text-align: center;">
        <div style="display: flex; gap: 6px; justify-content: center;">
          <button class="btn-icon" onclick="openProductModal('${item.id}')" title="Editar Producto / Servicio">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn-icon btn-icon-danger" onclick="deleteProduct('${item.id}')" title="Eliminar del catálogo">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openProductModal(id = null) {
  const form = document.getElementById('productForm');
  if (!form) return;
  form.reset();

  const titleEl = document.getElementById('productModalTitle');
  const idInput = document.getElementById('productId');
  const btnSubmit = document.getElementById('btnSaveProduct');

  if (id) {
    const item = APP_STATE.catalog.find(p => p.id === id);
    if (!item) return;

    if (titleEl) titleEl.textContent = 'Editar Producto / Servicio';
    if (btnSubmit) btnSubmit.textContent = 'Actualizar Ítem';
    idInput.value = item.id;
    document.getElementById('prodName').value = item.name;
    document.getElementById('prodCategory').value = item.category;
    document.getElementById('prodPrice').value = item.price;
    document.getElementById('prodCost').value = item.cost != null ? item.cost : '0.00';
    document.getElementById('prodDescription').value = item.description || '';
  } else {
    if (titleEl) titleEl.textContent = 'Registrar Producto / Servicio';
    if (btnSubmit) btnSubmit.textContent = 'Guardar en Catálogo';
    idInput.value = '';
    document.getElementById('prodCategory').value = 'Producto';
    document.getElementById('prodCost').value = '0.00';
  }

  const modal = document.getElementById('productModal');
  if (modal) modal.style.display = 'flex';
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) modal.style.display = 'none';
}

function handleSaveProduct(e) {
  e.preventDefault();

  const id = document.getElementById('productId').value;
  const name = document.getElementById('prodName').value.trim();
  const category = document.getElementById('prodCategory').value;
  const price = parseFloat(document.getElementById('prodPrice').value) || 0;
  const cost = parseFloat(document.getElementById('prodCost').value) || 0;
  const description = document.getElementById('prodDescription').value.trim();

  if (!name) {
    alert('El nombre del ítem es obligatorio.');
    return;
  }

  let isNew = false;
  let targetItem = null;

  if (id) {
    const idx = APP_STATE.catalog.findIndex(p => p.id === id);
    if (idx !== -1) {
      APP_STATE.catalog[idx] = {
        ...APP_STATE.catalog[idx],
        name,
        category,
        price,
        cost,
        description
      };
      targetItem = APP_STATE.catalog[idx];
    }
  } else {
    isNew = true;
    targetItem = {
      id: 'cat-' + Date.now(),
      name,
      category,
      price,
      cost,
      description
    };
    APP_STATE.catalog.unshift(targetItem);
  }

  saveCatalog();

  // SINCRONIZACIÓN DINÁMICA DE DATOS:
  // Si se editó un ítem existente, actualizar inmediatamente cotizaciones y dropdowns
  if (!isNew && targetItem) {
    syncCatalogItemToQuotes(targetItem);
  }

  closeProductModal();
  renderCatalogTable();
  populateCatalogDropdowns();
  renderQuotesTable();

  showToast(isNew ? `"${name}" agregado al catálogo con éxito.` : `"${name}" actualizado y sincronizado en todo el sistema.`);
}

function deleteProduct(id) {
  const item = APP_STATE.catalog.find(p => p.id === id);
  const name = item ? item.name : 'este ítem';

  if (confirm(`¿Estás seguro de eliminar "${name}" del catálogo?`)) {
    APP_STATE.catalog = APP_STATE.catalog.filter(p => p.id !== id);
    saveCatalog();
    renderCatalogTable();
    populateCatalogDropdowns();
    showToast(`"${name}" eliminado del catálogo.`, 'error');
  }
}

// Sincroniza dinámicamente un ítem modificado a todas las cotizaciones y al editor en vivo
function syncCatalogItemToQuotes(updatedItem) {
  let quotesUpdated = 0;

  // 1. Actualizar en cotizaciones guardadas en APP_STATE.quotes
  APP_STATE.quotes.forEach(quote => {
    let modified = false;
    if (quote.items && Array.isArray(quote.items)) {
      quote.items.forEach(line => {
        if (line.catalogId === updatedItem.id) {
          line.price = updatedItem.price;
          line.total = (Number(line.qty) || 1) * updatedItem.price;
          modified = true;
        }
      });
    }

    if (modified) {
      const subtotal = quote.items.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
      const tax = quote.includeTax ? (subtotal * 0.18) : 0;
      const discount = Number(quote.discount) || 0;
      quote.subtotal = subtotal;
      quote.tax = tax;
      quote.grandTotal = Math.max(0, subtotal + tax - discount);
      quotesUpdated++;
    }
  });

  if (quotesUpdated > 0) {
    saveQuotes();
  }

  // 2. Si el diseñador de cotizaciones está abierto en pantalla, actualizar renglones visibles
  const rows = document.querySelectorAll('#quoteItemsTableBody tr');
  rows.forEach(row => {
    const sel = row.querySelector('.quote-item-select');
    if (sel && sel.value === updatedItem.id) {
      const priceInput = row.querySelector('.quote-item-price');
      const qtyInput = row.querySelector('.quote-item-qty');
      const totalDisplay = row.querySelector('.quote-row-total');

      if (priceInput) priceInput.value = updatedItem.price.toFixed(2);
      const qty = parseFloat(qtyInput ? qtyInput.value : 1) || 1;
      const rowTotal = qty * updatedItem.price;
      if (totalDisplay) totalDisplay.textContent = formatMoney(rowTotal);
    }
  });

  recalculateQuoteTotals();
}

function populateCatalogDropdowns() {
  // 1. Dropdown en Modal de Registro Diario de Ventas
  const saleSelect = document.getElementById('saleProductSelect');
  if (saleSelect) {
    const currentVal = saleSelect.value;
    saleSelect.innerHTML = '<option value="">-- Seleccionar producto o servicio para auto-llenar --</option>';

    const grupos = {
      'Producto': document.createElement('optgroup'),
      'Servicio': document.createElement('optgroup'),
      'Artículo': document.createElement('optgroup')
    };
    grupos['Producto'].label = '📦 Productos';
    grupos['Servicio'].label = '🛠️ Servicios';
    grupos['Artículo'].label = '📄 Artículos';

    APP_STATE.catalog.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = `${item.name} (${formatMoney(item.price)})`;
      if (grupos[item.category]) {
        grupos[item.category].appendChild(opt);
      }
    });

    Object.values(grupos).forEach(grp => {
      if (grp.children.length > 0) saleSelect.appendChild(grp);
    });

    saleSelect.value = currentVal;
  }

  // 2. Dropdown en todos los renglones existentes del diseñador de cotización
  document.querySelectorAll('#quoteItemsTableBody .quote-item-select').forEach(sel => {
    const selectedVal = sel.value;
    buildQuoteSelectOptions(sel, selectedVal);
  });
}

function buildQuoteSelectOptions(selectEl, selectedId = '') {
  selectEl.innerHTML = '';
  
  const optDefault = document.createElement('option');
  optDefault.value = '';
  optDefault.textContent = '-- Seleccionar del catálogo --';
  selectEl.appendChild(optDefault);

  const grupos = {
    'Producto': document.createElement('optgroup'),
    'Servicio': document.createElement('optgroup'),
    'Artículo': document.createElement('optgroup')
  };
  grupos['Producto'].label = '📦 Productos';
  grupos['Servicio'].label = '🛠️ Servicios';
  grupos['Artículo'].label = '📄 Artículos';

  APP_STATE.catalog.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = `${item.name} — ${formatMoney(item.price)}`;
    if (grupos[item.category]) {
      grupos[item.category].appendChild(opt);
    }
  });

  Object.values(grupos).forEach(grp => {
    if (grp.children.length > 0) selectEl.appendChild(grp);
  });

  const optCustom = document.createElement('option');
  optCustom.value = 'custom';
  optCustom.textContent = '✏️ + Ítem / Trabajo Personalizado';
  selectEl.appendChild(optCustom);

  if (selectedId) {
    selectEl.value = selectedId;
  }
}

// ==========================================
// 21. MÓDULO 2: GENERADOR DE COTIZACIONES ELEGANTES
// ==========================================
function renderQuotesTable() {
  const tbody = document.getElementById('quotesTableBody');
  const emptyMsg = document.getElementById('emptyQuotesMessage');
  if (!tbody) return;

  tbody.innerHTML = '';

  const filterStatus = APP_STATE.quoteFilterStatus || 'all';
  const searchTerm = (APP_STATE.quoteSearch || '').toLowerCase().trim();

  const filtered = APP_STATE.quotes.filter(q => {
    const matchesStatus = (filterStatus === 'all') || (q.status === filterStatus);
    const matchesSearch = !searchTerm ||
      (q.number && q.number.toLowerCase().includes(searchTerm)) ||
      (q.client && q.client.toLowerCase().includes(searchTerm)) ||
      (q.phone && q.phone.toLowerCase().includes(searchTerm)) ||
      (q.email && q.email.toLowerCase().includes(searchTerm));
    return matchesStatus && matchesSearch;
  });

  if (filtered.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'block';
    return;
  } else {
    if (emptyMsg) emptyMsg.style.display = 'none';
  }

  filtered.forEach(quote => {
    const tr = document.createElement('tr');

    let badgeClass = 'status-badge-emitida';
    if (quote.status === 'Aprobada') badgeClass = 'status-badge-entregado';
    else if (quote.status === 'Facturada') badgeClass = 'status-badge-proceso';
    else if (quote.status === 'Vencida') badgeClass = 'status-badge-nopagado';

    tr.innerHTML = `
      <td>
        <strong style="color: var(--primary); font-family: var(--font-mono); cursor: pointer;" onclick="openQuoteEditor('${quote.id}')" title="Clic para editar cotización">
          ${escapeHtml(quote.number || 'COT-000')}
        </strong>
      </td>
      <td>${formatDate(quote.date)}</td>
      <td>${formatDate(quote.expiry)}</td>
      <td>
        <strong style="color: var(--slate-900);">${escapeHtml(quote.client)}</strong>
        ${quote.rnc ? `<br><small class="text-muted">RNC: ${escapeHtml(quote.rnc)}</small>` : ''}
      </td>
      <td>
        <span>${escapeHtml(quote.phone || '—')}</span>
        ${quote.email ? `<br><small class="text-muted">${escapeHtml(quote.email)}</small>` : ''}
      </td>
      <td style="text-align: right;" class="table-currency">
        <strong style="font-size: 0.95rem;">${formatMoney(quote.grandTotal)}</strong>
      </td>
      <td style="text-align: center;">
        <span class="status-badge ${badgeClass}">${escapeHtml(quote.status || 'Emitida')}</span>
      </td>
      <td style="text-align: center;">
        <div style="display: flex; gap: 6px; justify-content: center;">
          <button class="btn-icon" onclick="openQuoteEditor('${quote.id}')" title="Ver y Editar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn-icon" onclick="printQuoteDirect('${quote.id}')" title="Imprimir / Exportar PDF">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          </button>
          <button class="btn-icon" onclick="duplicateQuote('${quote.id}')" title="Duplicar Cotización">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
          <button class="btn-icon btn-icon-danger" onclick="deleteQuote('${quote.id}')" title="Eliminar Cotización">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function getNextQuoteNumber() {
  let max = 0;
  APP_STATE.quotes.forEach(q => {
    if (q.number && q.number.includes('-')) {
      const parts = q.number.split('-');
      const last = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(last) && last > max) max = last;
    }
  });
  const nextNum = max + 1;
  const pad = nextNum < 10 ? `00${nextNum}` : nextNum < 100 ? `0${nextNum}` : `${nextNum}`;
  return `COT-2026-${pad}`;
}

function openQuoteEditor(quoteId = null) {
  // Cambiar subpestañas
  const tabList = document.getElementById('btnQuoteTabList');
  const tabEditor = document.getElementById('btnQuoteTabEditor');
  const listView = document.getElementById('quoteListView');
  const editorView = document.getElementById('quoteEditorView');

  if (tabList) tabList.classList.remove('active');
  if (tabEditor) tabEditor.classList.add('active');
  if (listView) listView.style.display = 'none';
  if (editorView) editorView.style.display = 'block';

  loadCompanyInfo();
  populateClientsDatalist();

  const tbody = document.getElementById('quoteItemsTableBody');
  if (tbody) tbody.innerHTML = '';

  if (quoteId) {
    const quote = APP_STATE.quotes.find(q => q.id === quoteId);
    if (!quote) return;

    APP_STATE.currentQuoteEditingId = quote.id;

    document.getElementById('quoteDocNumber').value = quote.number || getNextQuoteNumber();
    document.getElementById('quoteDocDate').value = quote.date || new Date().toISOString().split('T')[0];
    document.getElementById('quoteDocExpiry').value = quote.expiry || getExpiryDateString();
    document.getElementById('quoteDocStatus').value = quote.status || 'Emitida';

    const ncfTypeEl = document.getElementById('quoteNcfType');
    if (ncfTypeEl) ncfTypeEl.value = quote.ncfType || 'B15';
    const ncfDocEl = document.getElementById('quoteDocNcf');
    if (ncfDocEl) ncfDocEl.value = quote.ncf || 'B1500000001';

    document.getElementById('quoteClientName').value = quote.client || '';
    document.getElementById('quoteClientRnc').value = quote.rnc || '';
    const addrEl = document.getElementById('quoteClientAddress');
    if (addrEl) addrEl.value = quote.address || '';
    document.getElementById('quoteClientPhone').value = quote.phone || '';
    document.getElementById('quoteClientEmail').value = quote.email || '';

    if (quote.terms) {
      document.getElementById('quoteTermsNotes').value = quote.terms;
    }

    document.getElementById('quoteTaxToggle').checked = !!quote.includeTax;
    document.getElementById('quoteDiscountInput').value = quote.discount != null ? quote.discount : '0.00';

    if (quote.items && quote.items.length > 0) {
      quote.items.forEach(it => addQuoteRow(it));
    } else {
      addQuoteRow();
    }
  } else {
    // Nueva cotización
    APP_STATE.currentQuoteEditingId = null;

    document.getElementById('quoteDocNumber').value = getNextQuoteNumber();
    document.getElementById('quoteDocDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('quoteDocExpiry').value = getExpiryDateString();
    document.getElementById('quoteDocStatus').value = 'Emitida';

    const ncfTypeEl = document.getElementById('quoteNcfType');
    if (ncfTypeEl) ncfTypeEl.value = 'B15';
    const ncfDocEl = document.getElementById('quoteDocNcf');
    if (ncfDocEl) ncfDocEl.value = 'B1500000001';

    document.getElementById('quoteClientName').value = '';
    document.getElementById('quoteClientRnc').value = '';
    const addrEl = document.getElementById('quoteClientAddress');
    if (addrEl) addrEl.value = '';
    document.getElementById('quoteClientPhone').value = '';
    document.getElementById('quoteClientEmail').value = '';

    document.getElementById('quoteTaxToggle').checked = true; // Por defecto ITBIS 18% activo
    document.getElementById('quoteDiscountInput').value = '0.00';

    addQuoteRow();
  }

  updateNcfBanner();
  recalculateQuoteTotals();
}

function updateNcfBanner() {
  const typeSelect = document.getElementById('quoteNcfType');
  const type = typeSelect ? typeSelect.value : 'B15';
  const valInput = document.getElementById('quoteDocNcf');
  const val = valInput ? valInput.value.trim() : 'B1500000001';

  const titleEl = document.getElementById('quoteNcfBannerTitle');
  const valEl = document.getElementById('quoteNcfBannerVal');

  const titles = {
    'B15': 'Factura con Valor Fiscal Gubernamental',
    'B01': 'Factura con Valor de Crédito Fiscal',
    'B02': 'Factura de Consumo Final',
    'B14': 'Factura para Regímenes Especiales de Tributación'
  };

  if (titleEl) titleEl.textContent = titles[type] || 'Factura con Valor Fiscal Gubernamental';
  if (valEl) valEl.textContent = val || 'B1500000001';
}

function getExpiryDateString(days = 15) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function addQuoteRow(itemData = null) {
  const tbody = document.getElementById('quoteItemsTableBody');
  if (!tbody) return;

  const rowCount = tbody.children.length + 1;
  const tr = document.createElement('tr');
  tr.className = 'quote-item-row';

  tr.innerHTML = `
    <td class="quote-row-num">${rowCount}</td>
    <td>
      <select class="quote-item-select form-select-sm"></select>
    </td>
    <td>
      <input type="text" class="quote-item-desc" placeholder="Descripción detallada, medidas, material...">
    </td>
    <td>
      <input type="number" class="quote-item-qty" min="1" step="1" value="1">
    </td>
    <td>
      <input type="number" class="quote-item-price" min="0" step="0.01" value="0.00">
    </td>
    <td>
      <span class="quote-row-total">RD$ 0.00</span>
    </td>
    <td class="no-print" style="text-align: center;">
      <button type="button" class="btn-remove-row" title="Eliminar renglón">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </td>
  `;

  tbody.appendChild(tr);

  const selectEl = tr.querySelector('.quote-item-select');
  const descInput = tr.querySelector('.quote-item-desc');
  const qtyInput = tr.querySelector('.quote-item-qty');
  const priceInput = tr.querySelector('.quote-item-price');
  const totalDisplay = tr.querySelector('.quote-row-total');
  const removeBtn = tr.querySelector('.btn-remove-row');

  buildQuoteSelectOptions(selectEl, itemData ? itemData.catalogId : '');

  if (itemData) {
    descInput.value = itemData.description || '';
    qtyInput.value = itemData.qty != null ? itemData.qty : 1;
    priceInput.value = (Number(itemData.price) || 0).toFixed(2);
  }

  // Listener cambio de producto en dropdown
  selectEl.addEventListener('change', () => {
    const catId = selectEl.value;
    if (catId && catId !== 'custom') {
      const product = APP_STATE.catalog.find(p => p.id === catId);
      if (product) {
        descInput.value = product.description ? `${product.name} - ${product.description}` : product.name;
        priceInput.value = product.price.toFixed(2);
      }
    } else if (catId === 'custom') {
      descInput.value = '';
      descInput.placeholder = 'Ingresa descripción del producto o servicio...';
      descInput.focus();
    }
    updateRowAndQuote();
  });

  function updateRowAndQuote() {
    const qty = parseFloat(qtyInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    const rowTotal = qty * price;
    totalDisplay.textContent = formatMoney(rowTotal);
    recalculateQuoteTotals();
  }

  qtyInput.addEventListener('input', updateRowAndQuote);
  priceInput.addEventListener('input', updateRowAndQuote);

  removeBtn.addEventListener('click', () => {
    tr.remove();
    renumberQuoteRows();
    recalculateQuoteTotals();
  });

  updateRowAndQuote();
}

function renumberQuoteRows() {
  const rows = document.querySelectorAll('#quoteItemsTableBody tr');
  rows.forEach((r, idx) => {
    const numEl = r.querySelector('.quote-row-num');
    if (numEl) numEl.textContent = idx + 1;
  });
}

function recalculateQuoteTotals() {
  let subtotal = 0;
  const rows = document.querySelectorAll('#quoteItemsTableBody tr');

  rows.forEach(r => {
    const qty = parseFloat(r.querySelector('.quote-item-qty')?.value) || 0;
    const price = parseFloat(r.querySelector('.quote-item-price')?.value) || 0;
    subtotal += (qty * price);
  });

  const taxToggle = document.getElementById('quoteTaxToggle');
  const includeTax = taxToggle ? taxToggle.checked : false;
  const tax = includeTax ? (subtotal * 0.18) : 0;

  const discountInput = document.getElementById('quoteDiscountInput');
  const discount = parseFloat(discountInput ? discountInput.value : 0) || 0;

  const grandTotal = Math.max(0, subtotal + tax - discount);

  const subEl = document.getElementById('quoteSubtotalAmount');
  const taxEl = document.getElementById('quoteTaxAmount');
  const discEl = document.getElementById('quoteDiscountDisplay');
  const grandEl = document.getElementById('quoteGrandTotalAmount');

  if (subEl) subEl.textContent = formatMoney(subtotal);
  if (taxEl) taxEl.textContent = formatMoney(tax);
  if (discEl) discEl.textContent = formatMoney(discount);
  if (grandEl) grandEl.textContent = formatMoney(grandTotal);

  return { subtotal, tax, discount, grandTotal, includeTax };
}

function handleSaveQuote() {
  const number = document.getElementById('quoteDocNumber').value.trim() || getNextQuoteNumber();
  const date = document.getElementById('quoteDocDate').value;
  const expiry = document.getElementById('quoteDocExpiry').value;
  const status = document.getElementById('quoteDocStatus').value;
  const ncfType = document.getElementById('quoteNcfType')?.value || 'B15';
  const ncf = document.getElementById('quoteDocNcf')?.value.trim() || 'B1500000001';

  const client = document.getElementById('quoteClientName').value.trim();
  const rnc = document.getElementById('quoteClientRnc').value.trim();
  const address = document.getElementById('quoteClientAddress')?.value.trim() || '';
  const phone = document.getElementById('quoteClientPhone').value.trim();
  const email = document.getElementById('quoteClientEmail').value.trim();
  const terms = document.getElementById('quoteTermsNotes').value;

  if (!client) {
    alert('Por favor introduce el nombre del cliente o empresa.');
    document.getElementById('quoteClientName').focus();
    return;
  }

  const items = [];
  const rows = document.querySelectorAll('#quoteItemsTableBody tr');
  rows.forEach(r => {
    const catalogId = r.querySelector('.quote-item-select')?.value || '';
    const description = r.querySelector('.quote-item-desc')?.value.trim() || '';
    const qty = parseFloat(r.querySelector('.quote-item-qty')?.value) || 1;
    const price = parseFloat(r.querySelector('.quote-item-price')?.value) || 0;
    if (description || price > 0) {
      items.push({
        catalogId,
        description: description || 'Ítem cotizado',
        qty,
        price,
        total: qty * price
      });
    }
  });

  if (items.length === 0) {
    alert('Agrega al menos un renglón a la cotización con descripción y precio.');
    return;
  }

  const { subtotal, tax, discount, grandTotal, includeTax } = recalculateQuoteTotals();

  // Guardar datos corporativos editados
  saveCompanyInfo();

  if (APP_STATE.currentQuoteEditingId) {
    const idx = APP_STATE.quotes.findIndex(q => q.id === APP_STATE.currentQuoteEditingId);
    if (idx !== -1) {
      APP_STATE.quotes[idx] = {
        ...APP_STATE.quotes[idx],
        number,
        date,
        expiry,
        status,
        ncfType,
        ncf,
        client,
        rnc,
        address,
        phone,
        email,
        terms,
        includeTax,
        discount,
        items,
        subtotal,
        tax,
        grandTotal
      };
    }
  } else {
    const newQuote = {
      id: 'quote-' + Date.now(),
      number,
      date,
      expiry,
      status,
      ncfType,
      ncf,
      client,
      rnc,
      address,
      phone,
      email,
      terms,
      includeTax,
      discount,
      items,
      subtotal,
      tax,
      grandTotal
    };
    APP_STATE.quotes.unshift(newQuote);
    APP_STATE.currentQuoteEditingId = newQuote.id;
  }

  saveQuotes();
  renderQuotesTable();
  showToast(`Cotización ${number} guardada exitosamente.`);

  // Regresar a la lista
  const tabList = document.getElementById('btnQuoteTabList');
  const tabEditor = document.getElementById('btnQuoteTabEditor');
  const listView = document.getElementById('quoteListView');
  const editorView = document.getElementById('quoteEditorView');

  if (tabList) tabList.classList.add('active');
  if (tabEditor) tabEditor.classList.remove('active');
  if (listView) listView.style.display = 'block';
  if (editorView) editorView.style.display = 'none';
}

function deleteQuote(id) {
  const q = APP_STATE.quotes.find(item => item.id === id);
  const name = q ? q.number : 'esta cotización';

  if (confirm(`¿Deseas eliminar ${name}?`)) {
    APP_STATE.quotes = APP_STATE.quotes.filter(item => item.id !== id);
    saveQuotes();
    renderQuotesTable();
    showToast(`${name} eliminada.`, 'error');
  }
}

function duplicateQuote(id) {
  const original = APP_STATE.quotes.find(q => q.id === id);
  if (!original) return;

  const newQuote = JSON.parse(JSON.stringify(original));
  newQuote.id = 'quote-' + Date.now();
  newQuote.number = getNextQuoteNumber();
  newQuote.date = new Date().toISOString().split('T')[0];
  newQuote.expiry = getExpiryDateString();
  newQuote.status = 'Emitida';

  APP_STATE.quotes.unshift(newQuote);
  saveQuotes();
  renderQuotesTable();
  showToast(`Cotización duplicada con el número ${newQuote.number}`);
  openQuoteEditor(newQuote.id);
}

function handleConvertQuoteToSale() {
  const client = document.getElementById('quoteClientName').value.trim();
  if (!client) {
    alert('Debes indicar un cliente para convertir la cotización a venta.');
    return;
  }

  const { grandTotal } = recalculateQuoteTotals();
  if (grandTotal <= 0) {
    alert('El monto total de la cotización debe ser mayor a 0.');
    return;
  }

  // Juntar descripciones de ítems
  const rows = document.querySelectorAll('#quoteItemsTableBody tr');
  const descriptions = [];
  rows.forEach(r => {
    const desc = r.querySelector('.quote-item-desc')?.value.trim();
    const qty = r.querySelector('.quote-item-qty')?.value.trim();
    if (desc) descriptions.push(`${qty > 1 ? qty + 'x ' : ''}${desc}`);
  });

  const nextInv = getNextInvoiceNumber();
  const newSale = {
    id: 'sale-' + Date.now(),
    numFactura: nextInv,
    fecha: new Date().toISOString().split('T')[0],
    cliente: client,
    cantidad: 1,
    articuloTrabajo: descriptions.join(' + ') || 'Trabajo cotizado',
    costoProduccion: 0,
    totalVenta: grandTotal,
    abonoCliente: 0,
    pendienteCliente: grandTotal,
    montoPagadoNorthCentral: 0,
    montoPendienteNorthCentral: 0,
    estado: 'En Proceso',
    margen: grandTotal,
    estadoCostoProduccion: 'PENDIENTE'
  };

  APP_STATE.sales.unshift(newSale);
  saveSales();

  // Actualizar estado de la cotización a "Facturada"
  document.getElementById('quoteDocStatus').value = 'Facturada';
  if (APP_STATE.currentQuoteEditingId) {
    const q = APP_STATE.quotes.find(item => item.id === APP_STATE.currentQuoteEditingId);
    if (q) {
      q.status = 'Facturada';
      saveQuotes();
    }
  }

  renderAllViews();
  showToast(`¡Cotización convertida con éxito en Factura #${nextInv} del Registro Diario!`);

  // Navegar a la pestaña de registro diario
  const btnDiario = document.querySelector('.nav-item[data-tab="tab-diario"]');
  if (btnDiario) btnDiario.click();
}

function printQuoteDirect(quoteId) {
  openQuoteEditor(quoteId);
  setTimeout(() => {
    printQuotePDF();
  }, 350);
}

function printQuotePDF() {
  saveCompanyInfo();
  window.print();
}

function downloadQuotePDF() {
  saveCompanyInfo();
  const element = document.getElementById('printableQuoteSheet');
  const quoteNum = document.getElementById('quoteDocNumber').value || 'COTIZACION';
  const rawClient = document.getElementById('quoteClientName').value || 'Cliente';
  const cleanClient = rawClient.replace(/[^a-zA-Z0-9_-]/g, '_');

  if (typeof html2pdf !== 'undefined') {
    showToast('Generando PDF corporativo de alta calidad...', 'info');

    const opt = {
      margin: [10, 12, 10, 12],
      filename: `${quoteNum}_TuSoin_${cleanClient}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      showToast(`PDF ${quoteNum} descargado con éxito.`);
    }).catch(err => {
      console.warn('html2pdf fallback to window.print():', err);
      window.print();
    });
  } else {
    window.print();
  }
}

// Cargar y persistir datos oficiales de la empresa TuSoin
const OFFICIAL_TUSOIN_COMPANY = {
  rnc: '1-31-59570-7',
  address: 'C/ Juan de Moya #10, 1er Nivel, El Almirante, Sto. Dgo. Este, Rep. Dom.',
  phone: '809-762-6064',
  email: 'tusoin.rd@gmail.com',
  web: 'tusoin.rd'
};

function loadCompanyInfo() {
  let data = null;
  const saved = localStorage.getItem('tusoinrd_company_info');
  if (saved) {
    try {
      data = JSON.parse(saved);
    } catch (e) {}
  }

  // Si no hay datos guardados o tiene el placeholder de prueba anterior
  if (!data || data.rnc === '132-94821-4' || !data.rnc) {
    data = { ...OFFICIAL_TUSOIN_COMPANY };
    localStorage.setItem('tusoinrd_company_info', JSON.stringify(data));
  }

  const rncEl = document.getElementById('companyRncText');
  const addrEl = document.getElementById('companyAddressText');
  const phoneEl = document.getElementById('companyPhoneText');
  const emailEl = document.getElementById('companyEmailText');
  const webEl = document.getElementById('companyWebText');

  if (rncEl) rncEl.textContent = data.rnc || OFFICIAL_TUSOIN_COMPANY.rnc;
  if (addrEl) addrEl.textContent = data.address || OFFICIAL_TUSOIN_COMPANY.address;
  if (phoneEl) phoneEl.textContent = data.phone || OFFICIAL_TUSOIN_COMPANY.phone;
  if (emailEl) emailEl.textContent = data.email || OFFICIAL_TUSOIN_COMPANY.email;
  if (webEl) webEl.textContent = data.web || OFFICIAL_TUSOIN_COMPANY.web;
}

function saveCompanyInfo() {
  const rnc = document.getElementById('companyRncText')?.textContent.trim() || OFFICIAL_TUSOIN_COMPANY.rnc;
  const address = document.getElementById('companyAddressText')?.textContent.trim() || OFFICIAL_TUSOIN_COMPANY.address;
  const phone = document.getElementById('companyPhoneText')?.textContent.trim() || OFFICIAL_TUSOIN_COMPANY.phone;
  const email = document.getElementById('companyEmailText')?.textContent.trim() || OFFICIAL_TUSOIN_COMPANY.email;
  const web = document.getElementById('companyWebText')?.textContent.trim() || OFFICIAL_TUSOIN_COMPANY.web;

  const data = { rnc, address, phone, email, web };
  localStorage.setItem('tusoinrd_company_info', JSON.stringify(data));
}

// Autocompletar clientes existentes desde la base de datos real
function populateClientsDatalist() {
  const datalist = document.getElementById('clientsListDatalist');
  if (!datalist) return;

  const clientsSet = new Set();
  APP_STATE.sales.forEach(s => {
    if (s.cliente && s.cliente !== 'Cliente General') clientsSet.add(s.cliente);
  });
  APP_STATE.quotes.forEach(q => {
    if (q.client) clientsSet.add(q.client);
  });

  datalist.innerHTML = '';
  clientsSet.forEach(cl => {
    const opt = document.createElement('option');
    opt.value = cl;
    datalist.appendChild(opt);
  });
}

// Exponer funciones en window para listeners en línea
window.openProductModal = openProductModal;
window.deleteProduct = deleteProduct;
window.openQuoteEditor = openQuoteEditor;
window.printQuoteDirect = printQuoteDirect;
window.duplicateQuote = duplicateQuote;
window.deleteQuote = deleteQuote;

// ==========================================
// 22. CONFIGURACIÓN COMPLETA DE EVENT LISTENERS
// ==========================================
function setupEventListeners() {
  // Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  // Botón Acceso Rápido Administrador
  const btnQuickDemo = document.getElementById('btnQuickDemoLogin');
  if (btnQuickDemo) btnQuickDemo.addEventListener('click', quickAdminLogin);

  // Toggle Password Visibility
  const togglePassBtn = document.getElementById('togglePasswordBtn');
  if (togglePassBtn) {
    togglePassBtn.addEventListener('click', () => {
      const passInput = document.getElementById('loginPassword');
      if (passInput.type === 'password') {
        passInput.type = 'text';
      } else {
        passInput.type = 'password';
      }
    });
  }

  // Logout Button
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) btnLogout.addEventListener('click', handleLogout);

  // Reset a Datos Reales Excel
  const btnResetReal = document.getElementById('btnResetToRealData');
  if (btnResetReal) {
    btnResetReal.addEventListener('click', () => {
      if (confirm('¿Restablecer la base de datos completa a los 91 registros de ventas y 87 gastos originales de la Hoja de Control Excel?')) {
        loadRealData(true);
        renderAllViews();
        showToast('Base de datos real de Excel restablecida con éxito.');
      }
    });
  }

  // Colapsar / Expandir Sidebar (Desktop)
  const collapseBtn = document.getElementById('sidebarCollapseBtn');
  if (collapseBtn) {
    collapseBtn.addEventListener('click', toggleSidebarCollapse);
  }

  // Toggle menú mobile y Overlay Backdrop
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      const sidebar = document.getElementById('mainSidebar');
      if (sidebar) sidebar.classList.toggle('open');
      if (backdrop) backdrop.classList.toggle('active');
    });
  }
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      const sidebar = document.getElementById('mainSidebar');
      if (sidebar) sidebar.classList.remove('open');
      backdrop.classList.remove('active');
    });
  }

  // Píldoras de Rango de Tiempo en Dashboard
  document.querySelectorAll('.time-filter-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.time-filter-pills .pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      APP_STATE.dashboardTimeRange = btn.getAttribute('data-time');
      renderDashboardMetrics();
    });
  });

  // Navegación por pestañas
  document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));

      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      const viewEl = document.getElementById(tabId);
      if (viewEl) viewEl.classList.add('active');
      APP_STATE.currentTab = tabId;

      const titles = {
        'tab-dashboard': ['Dashboard & Analítica Financiera', 'Métricas clave, gráficos interactivos de ventas, márgenes y flujo de caja en tiempo real'],
        'tab-cotizaciones': ['Generador de Cotizaciones Elegantes', 'Crea, administra e imprime cotizaciones profesionales con branding oficial de TuSoin'],
        'tab-catalogo': ['Catálogo de Productos y Servicios', 'Gestión de inventario de productos, servicios y artículos con sincronización en cotizaciones'],
        'tab-diario': ['Registro Diario de Ventas y Trabajos', 'Gestión de facturas, costos de producción, abonos y margen bruto de ganancia'],
        'tab-gastos': ['Salida Mensual de Gastos (Hoja de Control)', 'Control de gastos fijos y variables del negocio'],
        'tab-ingreso-neto': ['Ingreso Neto y Rentabilidad Global Real', 'Reporte consolidado de utilidad real'],
        'tab-proveedores': ['Cuentas y Pagos a Proveedores', 'Saldos pendientes y compras de materiales a NorthCentral y terceros']
      };

      if (titles[tabId]) {
        document.getElementById('pageTitle').textContent = titles[tabId][0];
        document.getElementById('pageSubtitle').textContent = titles[tabId][1];
      }

      if (tabId === 'tab-dashboard') {
        renderDashboardMetrics();
      } else if (tabId === 'tab-catalogo') {
        renderCatalogTable();
      } else if (tabId === 'tab-cotizaciones') {
        renderQuotesTable();
      }

      if (window.innerWidth <= 1024) {
        const sidebar = document.getElementById('mainSidebar');
        if (sidebar) sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('active');
      }
    });
  });

  // Selector de moneda
  const currencySelect = document.getElementById('currencySelect');
  if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
      APP_STATE.currency = e.target.value;
      saveCurrency();
      updateCurrencyUI();
      renderAllViews();
      showToast(`Moneda cambiada a ${APP_STATE.currency}`);
    });
  }

  // ==========================================
  // LISTENERS MÓDULO 1: CATÁLOGO (CRUD)
  // ==========================================
  const btnOpenProd = document.getElementById('btnOpenProductModal');
  if (btnOpenProd) btnOpenProd.addEventListener('click', () => openProductModal());

  const prodForm = document.getElementById('productForm');
  if (prodForm) prodForm.addEventListener('submit', handleSaveProduct);

  const catSearch = document.getElementById('catalogSearchInput');
  if (catSearch) {
    catSearch.addEventListener('input', (e) => {
      APP_STATE.catalogSearch = e.target.value;
      renderCatalogTable();
    });
  }

  const catFilter = document.getElementById('catalogCategoryFilter');
  if (catFilter) {
    catFilter.addEventListener('change', (e) => {
      APP_STATE.activeCatalogCategory = e.target.value;
      renderCatalogTable();
    });
  }

  // Al seleccionar producto en el modal de venta diario, auto-llenar campos
  const saleProdSel = document.getElementById('saleProductSelect');
  if (saleProdSel) {
    saleProdSel.addEventListener('change', () => {
      const catId = saleProdSel.value;
      if (!catId) return;
      const item = APP_STATE.catalog.find(p => p.id === catId);
      if (!item) return;

      const descInput = document.getElementById('saleDescription');
      const costInput = document.getElementById('saleCost');
      const totalInput = document.getElementById('saleTotal');
      const qtyInput = document.getElementById('saleQuantity');

      const qty = parseFloat(qtyInput ? qtyInput.value : 1) || 1;
      if (descInput) descInput.value = item.description ? `${item.name} (${item.description})` : item.name;
      if (totalInput) totalInput.value = (item.price * qty).toFixed(2);
      if (costInput && item.cost) costInput.value = (item.cost * qty).toFixed(2);

      updateLiveFormCalculations();
    });
  }

  // ==========================================
  // LISTENERS MÓDULO 2: COTIZADOR
  // ==========================================
  const btnQuoteList = document.getElementById('btnQuoteTabList');
  const btnQuoteEditor = document.getElementById('btnQuoteTabEditor');
  const quoteListView = document.getElementById('quoteListView');
  const quoteEditorView = document.getElementById('quoteEditorView');

  if (btnQuoteList) {
    btnQuoteList.addEventListener('click', () => {
      btnQuoteList.classList.add('active');
      btnQuoteEditor.classList.remove('active');
      quoteListView.style.display = 'block';
      quoteEditorView.style.display = 'none';
      renderQuotesTable();
    });
  }

  if (btnQuoteEditor) {
    btnQuoteEditor.addEventListener('click', () => {
      btnQuoteEditor.classList.add('active');
      btnQuoteList.classList.remove('active');
      quoteListView.style.display = 'none';
      quoteEditorView.style.display = 'block';
      if (!APP_STATE.currentQuoteEditingId) {
        openQuoteEditor(null);
      }
    });
  }

  const btnNewQuote = document.getElementById('btnNewQuoteCreator');
  if (btnNewQuote) btnNewQuote.addEventListener('click', () => openQuoteEditor(null));

  const btnNewQuoteEditor = document.getElementById('btnNewQuoteFromEditor');
  if (btnNewQuoteEditor) btnNewQuoteEditor.addEventListener('click', () => openQuoteEditor(null));

  const btnBackQuotes = document.getElementById('btnBackToQuoteList');
  if (btnBackQuotes) {
    btnBackQuotes.addEventListener('click', () => {
      btnQuoteList.click();
    });
  }

  const btnSaveQuote = document.getElementById('btnSaveQuote');
  if (btnSaveQuote) btnSaveQuote.addEventListener('click', handleSaveQuote);

  const btnConvertSale = document.getElementById('btnConvertQuoteToSale');
  if (btnConvertSale) btnConvertSale.addEventListener('click', handleConvertQuoteToSale);

  const btnPrintPDF = document.getElementById('btnPrintQuotePDF');
  if (btnPrintPDF) btnPrintPDF.addEventListener('click', printQuotePDF);

  const btnDownloadPDF = document.getElementById('btnDownloadQuotePDF');
  if (btnDownloadPDF) btnDownloadPDF.addEventListener('click', downloadQuotePDF);

  const ncfTypeSelect = document.getElementById('quoteNcfType');
  if (ncfTypeSelect) {
    ncfTypeSelect.addEventListener('change', (e) => {
      const type = e.target.value;
      const ncfInput = document.getElementById('quoteDocNcf');
      if (ncfInput) {
        const cur = ncfInput.value.trim();
        const numPart = cur.replace(/^[A-Za-z0-9]{3}/, '') || '00000001';
        ncfInput.value = `${type}${numPart}`;
      }
      updateNcfBanner();
    });
  }

  const ncfDocInput = document.getElementById('quoteDocNcf');
  if (ncfDocInput) {
    ncfDocInput.addEventListener('input', updateNcfBanner);
  }

  const btnAddRow = document.getElementById('btnAddQuoteRow');
  if (btnAddRow) btnAddRow.addEventListener('click', () => addQuoteRow());

  const taxToggle = document.getElementById('quoteTaxToggle');
  if (taxToggle) taxToggle.addEventListener('change', recalculateQuoteTotals);

  const discInput = document.getElementById('quoteDiscountInput');
  if (discInput) discInput.addEventListener('input', recalculateQuoteTotals);

  const qSearch = document.getElementById('quoteSearchInput');
  if (qSearch) {
    qSearch.addEventListener('input', (e) => {
      APP_STATE.quoteSearch = e.target.value;
      renderQuotesTable();
    });
  }

  const qFilterStatus = document.getElementById('quoteFilterStatus');
  if (qFilterStatus) {
    qFilterStatus.addEventListener('change', (e) => {
      APP_STATE.quoteFilterStatus = e.target.value;
      renderQuotesTable();
    });
  }

  // Guardar datos editables corporativos al perder el foco
  ['companyRncText', 'companyAddressText', 'companyPhoneText', 'companyEmailText'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('blur', saveCompanyInfo);
  });

  // Botón Autonumerar factura
  const btnAutoInvoice = document.getElementById('btnAutoInvoice');
  if (btnAutoInvoice) {
    btnAutoInvoice.addEventListener('click', () => {
      document.getElementById('saleInvoice').value = getNextInvoiceNumber();
    });
  }

  // Cálculos en vivo en formulario de ventas
  ['saleTotal', 'saleCost', 'saleAbono', 'saleMontoPagadoNC'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateLiveFormCalculations);
  });

  const inputPendienteNC = document.getElementById('saleMontoPendienteNC');
  if (inputPendienteNC) {
    inputPendienteNC.addEventListener('input', () => {
      inputPendienteNC.dataset.manualEdit = 'true';
    });
  }

  // Modales generales
  const btnOpenNewSale = document.getElementById('btnOpenNewSaleModal');
  if (btnOpenNewSale) btnOpenNewSale.addEventListener('click', () => openSaleModal());
  const saleForm = document.getElementById('saleForm');
  if (saleForm) saleForm.addEventListener('submit', handleSaveSale);

  const paymentForm = document.getElementById('paymentForm');
  if (paymentForm) paymentForm.addEventListener('submit', handleSavePayment);

  const btnOpenExpense = document.getElementById('btnOpenNewExpenseModal');
  if (btnOpenExpense) btnOpenExpense.addEventListener('click', openExpenseModal);
  const expenseForm = document.getElementById('expenseForm');
  if (expenseForm) expenseForm.addEventListener('submit', handleSaveExpense);

  const btnOpenSupp = document.getElementById('btnOpenSupplierModal');
  if (btnOpenSupp) btnOpenSupp.addEventListener('click', openSupplierModal);
  const suppForm = document.getElementById('supplierForm');
  if (suppForm) suppForm.addEventListener('submit', handleSaveSupplier);

  // Cerrar modales con [data-close]
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      const m = document.getElementById(modalId);
      if (m) m.style.display = 'none';
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.style.display = 'none';
    }
  });

  // Filtros Registro Diario
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      APP_STATE.activeFilters.search = e.target.value;
      renderSalesTable();
    });
  }

  const fStart = document.getElementById('filterDateStart');
  if (fStart) {
    fStart.addEventListener('change', (e) => {
      APP_STATE.activeFilters.dateStart = e.target.value;
      renderSalesTable();
    });
  }

  const fEnd = document.getElementById('filterDateEnd');
  if (fEnd) {
    fEnd.addEventListener('change', (e) => {
      APP_STATE.activeFilters.dateEnd = e.target.value;
      renderSalesTable();
    });
  }

  const fStatus = document.getElementById('filterStatus');
  if (fStatus) {
    fStatus.addEventListener('change', (e) => {
      APP_STATE.activeFilters.status = e.target.value;
      renderSalesTable();
    });
  }

  const fPayStatus = document.getElementById('filterPaymentStatus');
  if (fPayStatus) {
    fPayStatus.addEventListener('change', (e) => {
      APP_STATE.activeFilters.paymentStatus = e.target.value;
      renderSalesTable();
    });
  }

  const btnClearF = document.getElementById('btnClearFilters');
  if (btnClearF) {
    btnClearF.addEventListener('click', () => {
      document.getElementById('searchInput').value = '';
      document.getElementById('filterDateStart').value = '';
      document.getElementById('filterDateEnd').value = '';
      document.getElementById('filterStatus').value = 'all';
      if (fPayStatus) fPayStatus.value = 'all';

      APP_STATE.activeFilters = {
        search: '',
        dateStart: '',
        dateEnd: '',
        status: 'all',
        paymentStatus: 'all'
      };
      renderSalesTable();
    });
  }

  // Filtro de mes Ingreso Neto
  const mFilterNet = document.getElementById('monthFilterNet');
  if (mFilterNet) {
    mFilterNet.addEventListener('change', renderNetIncomeView);
  }

  // Exportar CSV
  const btnCSV = document.getElementById('btnExportCSV');
  if (btnCSV) btnCSV.addEventListener('click', exportToCSV);

  // Respaldo JSON
  const btnExpJson = document.getElementById('btnExportJson');
  if (btnExpJson) btnExpJson.addEventListener('click', exportToJsonBackup);

  const btnImpJson = document.getElementById('btnImportJsonTrigger');
  if (btnImpJson) {
    btnImpJson.addEventListener('click', () => {
      document.getElementById('importJsonInput').click();
    });
  }
  const impInput = document.getElementById('importJsonInput');
  if (impInput) impInput.addEventListener('change', importFromJson);
}

// Iniciar aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', initApp);
