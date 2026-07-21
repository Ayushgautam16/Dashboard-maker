// Excel Dashboard Generator - Core Frontend JavaScript Engine

const state = {
  dataset: null,
  recommendations: [],
  widgets: [],
  kpis: [],
  filters: {},
  selectedChartType: 'bar',
  activeView: 'landing',
  activeSidebarTab: 'builder',
  chartInstances: {}, // Store Chart.js instances for cleanup
  theme: 'dark'
};

// Colors palette for Chart.js
const CHART_COLORS = [
  '#0c8ee9', '#10b981', '#a855f7', '#f59e0b', '#f43f5e',
  '#3b82f6', '#14b8a6', '#8b5cf6', '#d97706', '#e11d48'
];

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  setupDragAndDrop();
});

// View Navigation Switcher
function switchView(viewName) {
  state.activeView = viewName;

  document.getElementById('view-landing').classList.add('hidden');
  document.getElementById('view-preview').classList.add('hidden');
  document.getElementById('view-dashboard').classList.add('hidden');

  document.getElementById(`view-${viewName}`).classList.remove('hidden');

  const navSwitcher = document.getElementById('nav-view-switcher');
  if (state.dataset) {
    navSwitcher.classList.remove('hidden');
    document.getElementById('btn-view-preview').className = viewName === 'preview'
      ? 'px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition bg-sky-600 text-white shadow-md'
      : 'px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition text-slate-400 hover:text-white';
    
    document.getElementById('btn-view-dashboard').className = viewName === 'dashboard'
      ? 'px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition bg-sky-600 text-white shadow-md'
      : 'px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition text-slate-400 hover:text-white';
  } else {
    navSwitcher.classList.add('hidden');
  }

  if (viewName === 'dashboard') {
    setTimeout(renderDashboard, 100);
  }
}

// Drag & Drop Setup
function setupDragAndDrop() {
  const dropZone = document.getElementById('drop-zone');
  if (!dropZone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-active');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-active');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  });
}

function handleFileUpload(e) {
  if (e.target.files && e.target.files.length > 0) {
    processFile(e.target.files[0]);
  }
}

// File Processor (Backend API with JS Client Fallback)
async function processFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    if (res.ok) {
      const data = await res.json();
      loadDatasetState(data.summary, data.recommendations);
      return;
    }
  } catch (err) {
    console.warn("Backend API unavailable, using client-side fallback parser.", err);
  }

  // Client-Side Fallback Parser
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'csv') {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const summary = buildClientSummary(file.name, results.data, file.size);
        loadDatasetState(summary, []);
      }
    });
  } else {
    const reader = new FileReader();
    reader.onload = (e) => {
      const workbook = XLSX.read(e.target.result, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      const summary = buildClientSummary(file.name, data, file.size);
      loadDatasetState(summary, []);
    };
    reader.readAsArrayBuffer(file);
  }
}

// Embedded Client Datasets Fallback
const DEMO_BIKE_DATA = [
  {"ID": 12496, "Marital Status": "Married", "Gender": "Female", "Income": 40000, "Children": 1, "Education": "Bachelors", "Occupation": "Skilled Manual", "Home Owner": "Yes", "Cars": 0, "Commute Distance": "0-1 Miles", "Region": "Europe", "Age": 42, "Purchased Bike": "No"},
  {"ID": 24107, "Marital Status": "Married", "Gender": "Male", "Income": 30000, "Children": 3, "Education": "Partial College", "Occupation": "Clerical", "Home Owner": "Yes", "Cars": 1, "Commute Distance": "0-1 Miles", "Region": "Europe", "Age": 43, "Purchased Bike": "No"},
  {"ID": 14177, "Marital Status": "Married", "Gender": "Male", "Income": 80000, "Children": 5, "Education": "Partial College", "Occupation": "Professional", "Home Owner": "No", "Cars": 2, "Commute Distance": "2-5 Miles", "Region": "Europe", "Age": 60, "Purchased Bike": "No"},
  {"ID": 24381, "Marital Status": "Single", "Gender": "Male", "Income": 70000, "Children": 0, "Education": "Bachelors", "Occupation": "Professional", "Home Owner": "Yes", "Cars": 1, "Commute Distance": "5-10 Miles", "Region": "Pacific", "Age": 41, "Purchased Bike": "Yes"},
  {"ID": 25597, "Marital Status": "Single", "Gender": "Male", "Income": 30000, "Children": 0, "Education": "Bachelors", "Occupation": "Clerical", "Home Owner": "No", "Cars": 0, "Commute Distance": "0-1 Miles", "Region": "Europe", "Age": 36, "Purchased Bike": "Yes"},
  {"ID": 13507, "Marital Status": "Married", "Gender": "Female", "Income": 10000, "Children": 2, "Education": "Partial College", "Occupation": "Manual", "Home Owner": "Yes", "Cars": 0, "Commute Distance": "1-2 Miles", "Region": "Europe", "Age": 50, "Purchased Bike": "No"},
  {"ID": 27974, "Marital Status": "Single", "Gender": "Male", "Income": 160000, "Children": 2, "Education": "High School", "Occupation": "Management", "Home Owner": "Yes", "Cars": 4, "Commute Distance": "0-1 Miles", "Region": "Pacific", "Age": 33, "Purchased Bike": "Yes"},
  {"ID": 19364, "Marital Status": "Married", "Gender": "Male", "Income": 40000, "Children": 1, "Education": "Bachelors", "Occupation": "Skilled Manual", "Home Owner": "Yes", "Cars": 0, "Commute Distance": "0-1 Miles", "Region": "Europe", "Age": 43, "Purchased Bike": "Yes"},
  {"ID": 22155, "Marital Status": "Single", "Gender": "Male", "Income": 20000, "Children": 2, "Education": "Partial High School", "Occupation": "Clerical", "Home Owner": "Yes", "Cars": 2, "Commute Distance": "5-10 Miles", "Region": "Pacific", "Age": 58, "Purchased Bike": "No"},
  {"ID": 19280, "Marital Status": "Married", "Gender": "Male", "Income": 30000, "Children": 2, "Education": "Partial College", "Occupation": "Manual", "Home Owner": "Yes", "Cars": 1, "Commute Distance": "0-1 Miles", "Region": "Europe", "Age": 40, "Purchased Bike": "Yes"},
  {"ID": 22173, "Marital Status": "Married", "Gender": "Female", "Income": 30000, "Children": 3, "Education": "High School", "Occupation": "Skilled Manual", "Home Owner": "No", "Cars": 2, "Commute Distance": "1-2 Miles", "Region": "Pacific", "Age": 54, "Purchased Bike": "Yes"},
  {"ID": 12697, "Marital Status": "Single", "Gender": "Female", "Income": 90000, "Children": 0, "Education": "Bachelors", "Occupation": "Professional", "Home Owner": "No", "Cars": 4, "Commute Distance": "10+ Miles", "Region": "Pacific", "Age": 36, "Purchased Bike": "No"}
];

const DEMO_SUPERSTORE_DATA = [
  {"Order ID": "CA-2023-152156", "Order Date": "2023-11-08", "Customer Name": "Claire Gute", "Segment": "Consumer", "Region": "South", "Category": "Furniture", "Sub-Category": "Bookcases", "Sales": 261.96, "Quantity": 2, "Discount": 0.0, "Profit": 41.91},
  {"Order ID": "CA-2023-152156", "Order Date": "2023-11-08", "Customer Name": "Claire Gute", "Segment": "Consumer", "Region": "South", "Category": "Furniture", "Sub-Category": "Chairs", "Sales": 731.94, "Quantity": 3, "Discount": 0.0, "Profit": 219.58},
  {"Order ID": "CA-2023-138688", "Order Date": "2023-06-12", "Customer Name": "Darrin Van Huff", "Segment": "Corporate", "Region": "West", "Category": "Office Supplies", "Sub-Category": "Labels", "Sales": 14.62, "Quantity": 2, "Discount": 0.0, "Profit": 6.87},
  {"Order ID": "US-2023-108966", "Order Date": "2023-10-11", "Customer Name": "Sean O'Donnell", "Segment": "Consumer", "Region": "South", "Category": "Furniture", "Sub-Category": "Tables", "Sales": 957.57, "Quantity": 5, "Discount": 0.45, "Profit": -766.06},
  {"Order ID": "CA-2023-115812", "Order Date": "2023-06-09", "Customer Name": "Brosina Hoffman", "Segment": "Consumer", "Region": "West", "Category": "Technology", "Sub-Category": "Phones", "Sales": 907.15, "Quantity": 5, "Discount": 0.2, "Profit": 90.72},
  {"Order ID": "CA-2023-115812", "Order Date": "2023-06-09", "Customer Name": "Brosina Hoffman", "Segment": "Consumer", "Region": "West", "Category": "Office Supplies", "Sub-Category": "Binders", "Sales": 18.50, "Quantity": 3, "Discount": 0.2, "Profit": 5.78},
  {"Order ID": "CA-2023-161389", "Order Date": "2023-12-05", "Customer Name": "Irene Maddox", "Segment": "Consumer", "Region": "West", "Category": "Office Supplies", "Sub-Category": "Binders", "Sales": 407.98, "Quantity": 3, "Discount": 0.2, "Profit": 132.59},
  {"Order ID": "US-2023-118983", "Order Date": "2023-11-22", "Customer Name": "Harold Pawluk", "Segment": "Corporate", "Region": "Central", "Category": "Furniture", "Sub-Category": "Chairs", "Sales": 254.40, "Quantity": 3, "Discount": 0.3, "Profit": -18.17}
];

// Demo Dataset Launcher with Instant Local Client Fallback
async function loadDemoDataset(name) {
  try {
    const res = await fetch(`/api/demo/${name}`);
    if (res.ok) {
      const data = await res.json();
      loadDatasetState(data.summary, data.recommendations);
      return;
    }
  } catch (err) {
    console.warn("Demo API unavailable, using client embedded dataset.", err);
  }

  const rawData = name === 'bike' ? DEMO_BIKE_DATA : DEMO_SUPERSTORE_DATA;
  const filename = name === 'bike' ? 'Bike Sales Dashboard' : 'Superstore Sales';
  const summary = buildClientSummary(filename, rawData, 85000);

  const recs = name === 'bike' ? [
    { id: 's1', title: 'Income by Occupation', chartType: 'bar', xAxis: 'Occupation', yAxis: 'Income', groupBy: 'Purchased Bike', aggregation: 'avg' },
    { id: 's2', title: 'Purchased Bike Distribution', chartType: 'donut', xAxis: 'Purchased Bike', yAxis: 'Income', aggregation: 'count' },
    { id: 's3', title: 'Age Brackets', chartType: 'horizontal-bar', xAxis: 'Occupation', yAxis: 'Age', aggregation: 'avg' },
    { id: 's4', title: 'Region Breakdown', chartType: 'stacked-bar', xAxis: 'Region', yAxis: 'Income', groupBy: 'Purchased Bike', aggregation: 'count' }
  ] : [
    { id: 's1', title: 'Sales over Time', chartType: 'area', xAxis: 'Order Date', yAxis: 'Sales', aggregation: 'sum' },
    { id: 's2', title: 'Sales by Category', chartType: 'donut', xAxis: 'Category', yAxis: 'Sales', aggregation: 'sum' },
    { id: 's3', title: 'Profit by Region', chartType: 'horizontal-bar', xAxis: 'Region', yAxis: 'Profit', aggregation: 'sum' },
    { id: 's4', title: 'Segment Performance', chartType: 'bar', xAxis: 'Segment', yAxis: 'Sales', groupBy: 'Category', aggregation: 'sum' }
  ];

  loadDatasetState(summary, recs);
}

// Build Client Summary Fallback
function buildClientSummary(filename, data, fileSizeBytes) {
  if (!data || data.length === 0) return null;
  const columns = Object.keys(data[0]);

  const colsMeta = columns.map(col => {
    const vals = data.map(r => r[col]);
    const nulls = vals.filter(v => v === null || v === undefined || v === '').length;
    const isNum = vals.some(v => typeof v === 'number');
    const type = isNum ? 'number' : 'text';

    return {
      name: col,
      type: type,
      sampleValues: vals.slice(0, 5),
      uniqueCount: new Set(vals).size,
      nullCount: nulls
    };
  });

  return {
    id: 'ds-' + Date.now(),
    name: filename.replace(/\.[^/.]+$/, ''),
    totalRows: data.length,
    totalColumns: columns.length,
    numericColsCount: colsMeta.filter(c => c.type === 'number').length,
    categoricalColsCount: colsMeta.filter(c => c.type === 'text').length,
    dateColsCount: 0,
    missingValuesCount: 0,
    duplicateRowsCount: 0,
    fileSizeBytes: fileSizeBytes || 50000,
    columns: colsMeta,
    rawData: data
  };
}

// Load Dataset State & Preconfigure Defaults
function loadDatasetState(summary, recommendations) {
  state.dataset = summary;
  state.recommendations = recommendations || [];
  state.filters = {};

  // Auto Generate Default Widgets
  if (recommendations && recommendations.length > 0) {
    state.widgets = recommendations.slice(0, 4).map((rec, idx) => ({
      id: `w-rec-${idx}`,
      title: rec.title,
      chartType: rec.chartType,
      xAxis: rec.xAxis,
      yAxis: rec.yAxis,
      groupBy: rec.groupBy,
      aggregation: rec.aggregation || 'sum',
      colSpan: 2
    }));
  } else {
    const cols = summary.columns;
    const numCol = cols.find(c => c.type === 'number' || c.type === 'currency') || cols[0];
    const catCol = cols.find(c => c.type === 'text') || cols[0];

    state.widgets = [
      { id: 'w-def-1', title: `${numCol.name} by ${catCol.name}`, chartType: 'bar', xAxis: catCol.name, yAxis: numCol.name, aggregation: 'sum', colSpan: 2 },
      { id: 'w-def-2', title: `${catCol.name} Distribution`, chartType: 'donut', xAxis: catCol.name, yAxis: numCol.name, aggregation: 'count', colSpan: 2 }
    ];
  }

  // Auto Generate KPI Cards
  const numCols = summary.columns.filter(c => c.type === 'number' || c.type === 'currency');
  const colors = ['emerald', 'blue', 'purple', 'amber'];
  state.kpis = numCols.slice(0, 4).map((col, i) => ({
    id: `kpi-${i}`,
    title: col.name,
    column: col.name,
    aggregation: col.type === 'currency' ? 'sum' : 'avg',
    color: colors[i % colors.length]
  }));

  populatePreviewUI();
  populateBuilderDropdowns();
  renderSuggestionsList();
  renderFilterControls();

  switchView('dashboard');
}

// Populate Preview Tab
function populatePreviewUI() {
  const d = state.dataset;
  if (!d) return;

  document.getElementById('ds-title').innerText = `${d.name} Summary`;
  document.getElementById('stat-rows').innerText = d.totalRows.toLocaleString();
  document.getElementById('stat-cols').innerText = d.totalColumns;
  document.getElementById('stat-num-cols').innerText = d.numericColsCount;
  document.getElementById('stat-cat-cols').innerText = d.categoricalColsCount;
  document.getElementById('stat-missing').innerText = d.missingValuesCount;
  document.getElementById('stat-duplicates').innerText = d.duplicateRowsCount;

  // Render Badges
  const badgesContainer = document.getElementById('column-badges-list');
  badgesContainer.innerHTML = d.columns.map(c => `
    <span class="badge-type badge-${c.type}">
      ${c.name} (${c.type})
    </span>
  `).join('');

  // Render Table Head & Body (First 20 rows)
  const thead = document.getElementById('preview-table-head');
  const tbody = document.getElementById('preview-table-body');

  thead.innerHTML = `<tr><th>#</th>${d.columns.map(c => `<th>${c.name}</th>`).join('')}</tr>`;

  const rows = d.rawData.slice(0, 20);
  tbody.innerHTML = rows.map((r, i) => `
    <tr>
      <td class="font-mono text-slate-500">${i + 1}</td>
      ${d.columns.map(c => `<td>${r[c.name] ?? '-'}</td>`).join('')}
    </tr>
  `).join('');
}

// Filter Dataset Records
function getFilteredRecords() {
  if (!state.dataset) return [];
  let records = state.dataset.rawData;

  Object.keys(state.filters).forEach(col => {
    const val = state.filters[col];
    if (val !== undefined && val !== null && val !== '') {
      records = records.filter(r => String(r[col]).toLowerCase().includes(String(val).toLowerCase()));
    }
  });

  return records;
}

// Data Aggregation Engine
function aggregateData(xAxis, yAxis, aggregation, groupBy = null, chartType = 'bar') {
  const records = getFilteredRecords();
  if (!xAxis || records.length === 0) return { labels: [], datasets: [] };

  if (groupBy && groupBy !== xAxis) {
    const groupedMap = {};
    const groupKeys = new Set();

    records.forEach(r => {
      const xVal = String(r[xAxis] ?? 'N/A');
      const gVal = String(r[groupBy] ?? 'N/A');
      groupKeys.add(gVal);

      if (!groupedMap[xVal]) groupedMap[xVal] = {};
      if (!groupedMap[xVal][gVal]) groupedMap[xVal][gVal] = [];

      const rawNum = parseFloat(String(r[yAxis]).replace(/[\$€£₹,%]/g, ''));
      groupedMap[xVal][gVal].push(isNaN(rawNum) ? 0 : rawNum);
    });

    const labels = Object.keys(groupedMap);
    const seriesKeys = Array.from(groupKeys);

    const datasets = seriesKeys.map((gKey, idx) => {
      const color = CHART_COLORS[idx % CHART_COLORS.length];
      return {
        label: gKey,
        data: labels.map(xKey => {
          const vals = groupedMap[xKey][gKey] || [];
          return computeAgg(vals, aggregation);
        }),
        backgroundColor: chartType === 'area' ? `${color}40` : color,
        borderColor: color,
        borderWidth: 2,
        borderRadius: 4,
        tension: 0.4,
        fill: chartType === 'area'
      };
    });

    return { labels, datasets };
  }

  // Single Series
  const map = {};
  records.forEach(r => {
    const xVal = String(r[xAxis] ?? 'N/A');
    if (!map[xVal]) map[xVal] = [];
    const rawNum = parseFloat(String(r[yAxis]).replace(/[\$€£₹,%]/g, ''));
    map[xVal].push(isNaN(rawNum) ? 0 : rawNum);
  });

  const labels = Object.keys(map);
  const values = labels.map(l => computeAgg(map[l], aggregation));

  const isPieOrDonut = chartType === 'pie' || chartType === 'donut' || chartType === 'doughnut';
  const isLineOrArea = chartType === 'line' || chartType === 'area';

  const primaryColor = CHART_COLORS[0];

  return {
    labels,
    datasets: [{
      label: `${aggregation.toUpperCase()} of ${yAxis}`,
      data: values,
      backgroundColor: isPieOrDonut
        ? CHART_COLORS.slice(0, labels.length)
        : (isLineOrArea ? `${primaryColor}35` : CHART_COLORS.slice(0, labels.length)),
      borderColor: isPieOrDonut ? '#0f172a' : primaryColor,
      borderWidth: 2,
      borderRadius: 6,
      tension: 0.4,
      fill: chartType === 'area'
    }]
  };
}

function computeAgg(nums, agg) {
  if (!nums || nums.length === 0) return 0;
  if (agg === 'count') return nums.length;
  if (agg === 'distinct') return new Set(nums).size;

  const sum = nums.reduce((a, b) => a + b, 0);
  if (agg === 'sum') return Math.round(sum * 100) / 100;
  if (agg === 'avg') return Math.round((sum / nums.length) * 100) / 100;
  if (agg === 'max') return Math.max(...nums);
  if (agg === 'min') return Math.min(...nums);
  return Math.round(sum * 100) / 100;
}

// Render Main Dashboard
function renderDashboard() {
  renderKpiCards();
  renderWidgetsGrid();
}

// Render KPI Cards
function renderKpiCards() {
  const container = document.getElementById('kpi-cards-container');
  if (!container || !state.dataset) return;

  const records = getFilteredRecords();

  container.innerHTML = state.kpis.map(kpi => {
    const nums = records.map(r => parseFloat(String(r[kpi.column]).replace(/[\$€£₹,%]/g, ''))).filter(n => !isNaN(n));
    const val = computeAgg(nums, kpi.aggregation);

    return `
      <div class="kpi-card kpi-${kpi.color}">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-slate-300">${kpi.title}</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 uppercase">${kpi.aggregation}</span>
        </div>
        <div class="text-2xl font-black text-white mb-1">${typeof val === 'number' ? val.toLocaleString() : val}</div>
        <div class="text-[11px] text-slate-400 flex items-center gap-1">
          <i data-lucide="trending-up" class="w-3.5 h-3.5 text-emerald-400"></i> Calculated from ${records.length} records
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// Render Dynamic Widget Grid & Chart.js Visuals
function renderWidgetsGrid() {
  const workspace = document.getElementById('dashboard-workspace');
  if (!workspace) return;

  // Cleanup old Chart.js instances
  Object.values(state.chartInstances).forEach(chart => {
    try { chart.destroy(); } catch (e) {}
  });
  state.chartInstances = {};

  workspace.innerHTML = state.widgets.map(w => `
    <div class="glass-panel p-5 col-span-${w.colSpan || 2} flex flex-col justify-between" id="card-${w.id}">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-bold text-sm text-white">${w.title}</h4>
        <div class="flex items-center gap-1">
          <button onclick="duplicateWidget('${w.id}')" class="p-1 text-slate-400 hover:text-white" title="Duplicate"><i data-lucide="copy" class="w-3.5 h-3.5"></i></button>
          <button onclick="deleteWidget('${w.id}')" class="p-1 text-slate-400 hover:text-rose-400" title="Delete"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
        </div>
      </div>
      <div class="relative w-full h-64">
        <canvas id="canvas-${w.id}"></canvas>
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();

  // Render Charts safely with try-catch
  state.widgets.forEach(w => {
    const canvas = document.getElementById(`canvas-${w.id}`);
    if (!canvas) return;

    try {
      const aggregated = aggregateData(w.xAxis, w.yAxis, w.aggregation, w.groupBy, w.chartType);
      const ctx = canvas.getContext('2d');

      // Map custom chart types to valid Chart.js controller names
      let type = w.chartType;
      if (type === 'horizontal-bar' || type === 'stacked-bar' || type === 'grouped-bar') {
        type = 'bar';
      } else if (type === 'donut') {
        type = 'doughnut';
      } else if (type === 'area') {
        type = 'line';
      }

      const isHorizontal = w.chartType === 'horizontal-bar';
      const isStacked = w.chartType === 'stacked-bar';
      const isDoughnutOrPie = type === 'doughnut' || type === 'pie';

      state.chartInstances[w.id] = new Chart(ctx, {
        type: type,
        data: aggregated,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: isHorizontal ? 'y' : 'x',
          plugins: {
            legend: {
              display: isDoughnutOrPie || !!w.groupBy,
              labels: { color: '#cbd5e1', font: { size: 11 } }
            },
            tooltip: {
              backgroundColor: '#0f172a',
              titleColor: '#fff',
              bodyColor: '#cbd5e1',
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1
            }
          },
          scales: isDoughnutOrPie ? {} : {
            x: {
              stacked: isStacked,
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#94a3b8', font: { size: 10 } }
            },
            y: {
              stacked: isStacked,
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#94a3b8', font: { size: 10 } }
            }
          }
        }
      });
    } catch (err) {
      console.error(`Error rendering chart ${w.id}:`, err);
    }
  });
}

// Widget Operations
function duplicateWidget(id) {
  const target = state.widgets.find(w => w.id === id);
  if (!target) return;
  const clone = { ...target, id: 'w-copy-' + Date.now(), title: `${target.title} (Copy)` };
  state.widgets.push(clone);
  renderDashboard();
}

function deleteWidget(id) {
  state.widgets = state.widgets.filter(w => w.id !== id);
  renderDashboard();
}

// Sidebar Tab Switcher
function switchSidebarTab(tabName) {
  state.activeSidebarTab = tabName;
  document.getElementById('pane-builder').classList.add('hidden');
  document.getElementById('pane-filters').classList.add('hidden');
  document.getElementById('pane-suggestions').classList.add('hidden');

  document.getElementById(`pane-${tabName}`).classList.remove('hidden');

  ['builder', 'filters', 'suggestions'].forEach(t => {
    document.getElementById(`tab-${t}`).className = t === tabName
      ? 'flex-1 py-1.5 text-[11px] font-bold rounded-lg transition bg-sky-600 text-white'
      : 'flex-1 py-1.5 text-[11px] font-bold rounded-lg transition text-slate-400 hover:text-white';
  });
}

// Populate Builder Select Dropdowns
function populateBuilderDropdowns() {
  if (!state.dataset) return;
  const cols = state.dataset.columns;

  const xSelect = document.getElementById('builder-xaxis');
  const ySelect = document.getElementById('builder-yaxis');
  const gSelect = document.getElementById('builder-groupby');
  const fSelect = document.getElementById('filter-col-select');

  xSelect.innerHTML = cols.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  ySelect.innerHTML = cols.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  gSelect.innerHTML = `<option value="">None</option>` + cols.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  fSelect.innerHTML = cols.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

  renderFilterControls();
}

function selectChartType(type) {
  state.selectedChartType = type;
  document.querySelectorAll('.chart-type-btn').forEach(btn => {
    if (btn.dataset.type === type) {
      btn.className = 'chart-type-btn p-2 rounded-xl bg-slate-900 border border-sky-500 text-center hover:bg-slate-800';
    } else {
      btn.className = 'chart-type-btn p-2 rounded-xl bg-slate-900 border border-slate-800 text-center hover:bg-slate-800';
    }
  });
}

function addCustomWidget() {
  const title = document.getElementById('builder-title').value || 'Custom Visual';
  const xAxis = document.getElementById('builder-xaxis').value;
  const yAxis = document.getElementById('builder-yaxis').value;
  const groupBy = document.getElementById('builder-groupby').value;
  const aggregation = document.getElementById('builder-agg').value;

  const newWidget = {
    id: 'w-custom-' + Date.now(),
    title,
    chartType: state.selectedChartType,
    xAxis,
    yAxis,
    groupBy: groupBy || null,
    aggregation,
    colSpan: 2
  };

  state.widgets.push(newWidget);
  renderDashboard();
}

// Filter Controls & Real-time Update
function renderFilterControls() {
  const container = document.getElementById('filter-inputs-container');
  if (!container || !state.dataset) return;
  const col = document.getElementById('filter-col-select').value;
  if (!col) return;

  container.innerHTML = `
    <div>
      <label class="text-[11px] font-semibold text-slate-400 block mb-1">Filter ${col} by keyword</label>
      <input type="text" onkeyup="applyFilter('${col}', this.value)" value="${state.filters[col] || ''}" placeholder="Type filter..." class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500" />
    </div>
  `;
}

function applyFilter(col, val) {
  if (!val) delete state.filters[col];
  else state.filters[col] = val;
  renderDashboard();
}

function clearGlobalFilters() {
  state.filters = {};
  renderFilterControls();
  renderDashboard();
}

// Render Suggestions List
function renderSuggestionsList() {
  const list = document.getElementById('suggestions-list');
  if (!list) return;

  list.innerHTML = state.recommendations.map(s => `
    <div class="glass-card p-3 cursor-pointer hover:border-sky-500/50" onclick="addSuggestion('${s.id}')">
      <div class="flex items-center justify-between mb-1">
        <span class="font-bold text-xs text-white">${s.title}</span>
        <span class="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400">${s.badge || 'Idea'}</span>
      </div>
      <p class="text-[10px] text-slate-400">${s.description || ''}</p>
    </div>
  `).join('');
}

function addSuggestion(sugId) {
  const sug = state.recommendations.find(s => s.id === sugId);
  if (!sug) return;
  state.widgets.push({
    id: 'w-sug-' + Date.now(),
    title: sug.title,
    chartType: sug.chartType,
    xAxis: sug.xAxis,
    yAxis: sug.yAxis,
    groupBy: sug.groupBy,
    aggregation: sug.aggregation,
    colSpan: 2
  });
  renderDashboard();
}

// Ask AI Drawer
function toggleAiDrawer() {
  document.getElementById('ai-drawer').classList.toggle('hidden');
}

async function sendAiMessage() {
  const input = document.getElementById('ai-input');
  const text = input.value.trim();
  if (!text || !state.dataset) return;

  const history = document.getElementById('ai-chat-history');
  history.innerHTML += `<div class="p-2.5 rounded-xl bg-sky-600 text-white text-xs ml-8 mb-2">${text}</div>`;
  input.value = '';

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text, summary: state.dataset })
    });
    if (res.ok) {
      const data = await res.json();
      history.innerHTML += `<div class="p-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs mr-8 mb-2">${data.explanation}</div>`;
      state.widgets.push(data.widget);
      renderDashboard();
      return;
    }
  } catch (err) {}

  history.innerHTML += `<div class="p-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs mr-8 mb-2">Added visualization based on "${text}".</div>`;
}

function sendQuickAiPrompt(text) {
  document.getElementById('ai-input').value = text;
  sendAiMessage();
}

// Export Functions
async function exportDashboardPng() {
  const elem = document.getElementById('dashboard-workspace');
  const canvas = await html2canvas(elem, { backgroundColor: '#090d16', scale: 2 });
  const a = document.createElement('a');
  a.download = 'dashboard.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
}

async function exportDashboardPdf() {
  const { jsPDF } = window.jspdf;
  const elem = document.getElementById('dashboard-workspace');
  const canvas = await html2canvas(elem, { backgroundColor: '#090d16', scale: 2 });
  const pdf = new jsPDF('landscape', 'px', [canvas.width, canvas.height]);
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save('dashboard.pdf');
}

function exportDataExcel() {
  const records = getFilteredRecords();
  const ws = XLSX.utils.json_to_sheet(records);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Filtered Data');
  XLSX.writeFile(wb, 'dataset_export.xlsx');
}

function exportDataCsv() {
  const records = getFilteredRecords();
  const csv = Papa.unparse(records);
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'dataset_export.csv';
  a.click();
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.className = state.theme === 'dark' ? 'dark' : 'light-theme';
}
