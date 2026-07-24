import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { api } from './lib/api';

const COLORS = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6'];

// Custom inline SVG Icons
const Icons = {
  Upload: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  Database: ({ className = "" }) => (
    <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4m0 5c0 2.21-3.58 4-8 4s-8-1.79-8-4" />
    </svg>
  ),
  Dataset: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 2v-6m-9 3h9m2 3h2a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h2" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  Filter: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 13.293A1 1 0 013 12.586V4z" />
    </svg>
  )
};

export default function App() {
  const [dbConnected, setDbConnected] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [currentDataset, setCurrentDataset] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Dashboard configuration states
  const [visuals, setVisuals] = useState([]);
  const [selectedVisualId, setSelectedVisualId] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});
  const [sidebarTab, setSidebarTab] = useState('fields'); // 'fields' | 'visuals'

  // Visual Form state
  const [formVisualType, setFormVisualType] = useState('bar');
  const [formXAxis, setFormXAxis] = useState('');
  const [formYAxis, setFormYAxis] = useState('');
  const [formAggregation, setFormAggregation] = useState('sum');
  const [formGroupBy, setFormGroupBy] = useState('');
  const [formTitle, setFormTitle] = useState('');

  // Slicer suggestion columns (low cardinality text/boolean columns)
  const slicerColumns = useMemo(() => {
    if (!currentDataset?.summary?.columns) return [];
    return currentDataset.summary.columns.filter(
      col => (col.type === 'text' || col.type === 'boolean') && col.uniqueCount > 1 && col.uniqueCount <= 10
    );
  }, [currentDataset]);

  // Load datasets and connection state on mount
  useEffect(() => {
    checkDatabaseConnection();
    loadDashboardData();
  }, []);

  const checkDatabaseConnection = async () => {
    try {
      await api.fetchDashboard();
      setDbConnected(true);
    } catch (err) {
      setDbConnected(false);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchDashboard();
      setDatasets(data.datasets || []);
      if (data.dataset) {
        setCurrentDataset(data.dataset);
        await loadDatasetRecords(data.dataset.id);
        setupDefaultVisuals(data.dataset);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadDatasetRecords = async (datasetId) => {
    try {
      const res = await api.fetchDatasetRecords(datasetId);
      setRecords(res.records || []);
      setActiveFilters({});
    } catch (err) {
      setError('Could not retrieve full dataset records.');
    }
  };

  const setupDefaultVisuals = (dataset) => {
    const summary = dataset.summary;
    if (!summary?.columns) return;

    // Filter type columns
    const numericCols = summary.columns.filter(c => ['number', 'currency', 'percentage'].includes(c.type));
    const categoricalCols = summary.columns.filter(c => ['text', 'boolean'].includes(c.type));
    const dateCols = summary.columns.filter(c => c.type === 'date');

    const defaultVisuals = [];

    // KPI Cards
    if (numericCols.length > 0) {
      defaultVisuals.push({
        id: 'kpi-1',
        title: `Total ${numericCols[0].name}`,
        type: 'card',
        xAxis: '',
        yAxis: numericCols[0].name,
        aggregation: 'sum',
        span: 'span-4'
      });
      
      defaultVisuals.push({
        id: 'kpi-2',
        title: `Average ${numericCols[0].name}`,
        type: 'card',
        xAxis: '',
        yAxis: numericCols[0].name,
        aggregation: 'avg',
        span: 'span-4'
      });
    }

    defaultVisuals.push({
      id: 'kpi-count',
      title: 'Total Records',
      type: 'card',
      xAxis: '',
      yAxis: '',
      aggregation: 'count',
      span: 'span-4'
    });

    // 1st Suggestion: Category sum or count
    if (categoricalCols.length > 0) {
      const category = categoricalCols[0].name;
      const measure = numericCols.length > 0 ? numericCols[0].name : category;
      const agg = numericCols.length > 0 ? 'sum' : 'count';
      defaultVisuals.push({
        id: 'viz-default-1',
        title: `${measure} (${agg.toUpperCase()}) by ${category}`,
        type: 'bar',
        xAxis: category,
        yAxis: measure,
        aggregation: agg,
        groupBy: '',
        span: 'span-6'
      });

      // 2nd Suggestion: Pie Distribution
      defaultVisuals.push({
        id: 'viz-default-2',
        title: `${category} Distribution`,
        type: 'pie',
        xAxis: category,
        yAxis: category,
        aggregation: 'count',
        groupBy: '',
        span: 'span-6'
      });
    }

    // 3rd Suggestion: Time Series Line
    if (dateCols.length > 0 && numericCols.length > 0) {
      defaultVisuals.push({
        id: 'viz-default-3',
        title: `${numericCols[0].name} sum over ${dateCols[0].name}`,
        type: 'line',
        xAxis: dateCols[0].name,
        yAxis: numericCols[0].name,
        aggregation: 'sum',
        groupBy: '',
        span: 'span-12'
      });
    } else if (categoricalCols.length > 1 && numericCols.length > 0) {
      // Stacked Bar suggestion
      defaultVisuals.push({
        id: 'viz-default-3',
        title: `${numericCols[0].name} by ${categoricalCols[0].name} and ${categoricalCols[1].name}`,
        type: 'bar',
        xAxis: categoricalCols[0].name,
        yAxis: numericCols[0].name,
        aggregation: 'sum',
        groupBy: categoricalCols[1].name,
        span: 'span-12'
      });
    }

    setVisuals(defaultVisuals);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await api.uploadDataset(file);
      const dataset = res.dataset;
      setDatasets(prev => [dataset, ...prev]);
      setCurrentDataset(dataset);
      await loadDatasetRecords(dataset.id);
      setupDefaultVisuals(dataset);
    } catch (err) {
      setError(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDemoLoad = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.loadDemoDataset();
      const dataset = res.dataset;
      setDatasets(prev => [dataset, ...prev]);
      setCurrentDataset(dataset);
      await loadDatasetRecords(dataset.id);
      setupDefaultVisuals(dataset);
    } catch (err) {
      setError('Could not load demo dataset');
    } finally {
      setLoading(false);
    }
  };

  const selectDataset = async (dataset) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.fetchDatasetRecords(dataset.id);
      setRecords(res.records || []);
      setCurrentDataset(dataset);
      setActiveFilters({});
      setupDefaultVisuals(dataset);
    } catch (err) {
      setError('Error switching dataset');
    } finally {
      setLoading(false);
    }
  };

  // Filter Handling (Slicers)
  const toggleSlicerValue = (column, value) => {
    setActiveFilters(prev => {
      const current = prev[column] || [];
      let updated;
      if (current.includes(value)) {
        updated = current.filter(v => v !== value);
      } else {
        updated = [...current, value];
      }
      return {
        ...prev,
        [column]: updated
      };
    });
  };

  const clearSlicerFilters = (column) => {
    setActiveFilters(prev => {
      const copy = { ...prev };
      delete copy[column];
      return copy;
    });
  };

  // Filters raw records to obtain the subset for visuals
  const filteredRecords = useMemo(() => {
    return records.filter(row => {
      for (const [col, selectedVals] of Object.entries(activeFilters)) {
        if (selectedVals && selectedVals.length > 0) {
          const rowValue = String(row[col] ?? 'Blank');
          if (!selectedVals.includes(rowValue)) {
            return false;
          }
        }
      }
      return true;
    });
  }, [records, activeFilters]);

  // Client-Side Aggregation Helper
  const getAggregatedData = (visual) => {
    const { xAxis, yAxis, aggregation, groupBy } = visual;
    if (!xAxis) return [];

    const groups = {};
    filteredRecords.forEach(row => {
      const xVal = String(row[xAxis] ?? 'Blank');
      const groupKey = groupBy ? String(row[groupBy] ?? 'Blank') : '_all';

      if (!groups[xVal]) {
        groups[xVal] = {};
      }
      if (!groups[xVal][groupKey]) {
        groups[xVal][groupKey] = [];
      }
      groups[xVal][groupKey].push(row);
    });

    const getAggValue = (rows, col, type) => {
      if (type === 'count') return rows.length;
      if (!col) return rows.length;

      const values = rows
        .map(r => {
          const val = r[col];
          if (val === null || val === undefined) return NaN;
          if (typeof val === 'number') return val;
          const cleanStr = String(val).replace(/[\$€£₹,%]/g, '').trim();
          const num = parseFloat(cleanStr);
          return isNaN(num) ? NaN : num;
        })
        .filter(v => !isNaN(v));

      if (values.length === 0) return 0;

      switch (type) {
        case 'sum':
          return values.reduce((sum, v) => sum + v, 0);
        case 'avg':
        case 'average':
          return values.reduce((sum, v) => sum + v, 0) / values.length;
        case 'min':
          return Math.min(...values);
        case 'max':
          return Math.max(...values);
        case 'distinct':
        case 'count_distinct':
          return new Set(values).size;
        default:
          return values.reduce((sum, v) => sum + v, 0);
      }
    };

    return Object.entries(groups).map(([xKey, valGroup]) => {
      const item = { name: xKey };
      if (groupBy) {
        Object.entries(valGroup).forEach(([gKey, rows]) => {
          item[gKey] = Math.round(getAggValue(rows, yAxis, aggregation) * 100) / 100;
        });
      } else {
        item.value = Math.round(getAggValue(valGroup._all, yAxis, aggregation) * 100) / 100;
      }
      return item;
    });
  };

  // KPI aggregation computation helper
  const getKpiValue = (visual) => {
    const { yAxis, aggregation } = visual;
    if (filteredRecords.length === 0) return 0;
    if (aggregation === 'count') return filteredRecords.length;

    const values = filteredRecords
      .map(r => {
        const val = r[yAxis];
        if (val === null || val === undefined) return NaN;
        if (typeof val === 'number') return val;
        const cleanStr = String(val).replace(/[\$€£₹,%]/g, '').trim();
        const num = parseFloat(cleanStr);
        return isNaN(num) ? NaN : num;
      })
      .filter(v => !isNaN(v));

    if (values.length === 0) return 0;

    let res = 0;
    switch (aggregation) {
      case 'sum':
        res = values.reduce((sum, v) => sum + v, 0);
        break;
      case 'avg':
      case 'average':
        res = values.reduce((sum, v) => sum + v, 0) / values.length;
        break;
      case 'min':
        res = Math.min(...values);
        break;
      case 'max':
        res = Math.max(...values);
        break;
      case 'distinct':
      case 'count_distinct':
        res = new Set(values).size;
        break;
      default:
        res = 0;
    }

    if (res >= 1e6) {
      return (res / 1e6).toFixed(2) + 'M';
    }
    if (res >= 1e3) {
      return (res / 1e3).toFixed(1) + 'K';
    }
    return Math.round(res * 100) / 100;
  };

  // Add a new visual
  const addNewVisual = () => {
    const defaultX = currentDataset?.summary?.columns?.find(c => ['text', 'boolean'].includes(c.type))?.name || '';
    const defaultY = currentDataset?.summary?.columns?.find(c => ['number', 'currency'].includes(c.type))?.name || '';

    const newVisual = {
      id: `custom-${Date.now()}`,
      title: 'New Custom Visual',
      type: 'bar',
      xAxis: defaultX,
      yAxis: defaultY || defaultX,
      aggregation: defaultY ? 'sum' : 'count',
      groupBy: '',
      span: 'span-6'
    };

    setVisuals(prev => [...prev, newVisual]);
    setSelectedVisualId(newVisual.id);
    setSidebarTab('visuals');
    
    // Set form fields
    setFormVisualType(newVisual.type);
    setFormXAxis(newVisual.xAxis);
    setFormYAxis(newVisual.yAxis);
    setFormAggregation(newVisual.aggregation);
    setFormGroupBy(newVisual.groupBy);
    setFormTitle(newVisual.title);
  };

  // Select field to modify visual
  const selectVisual = (visual) => {
    setSelectedVisualId(visual.id);
    setSidebarTab('visuals');
    setFormVisualType(visual.type);
    setFormXAxis(visual.xAxis);
    setFormYAxis(visual.yAxis);
    setFormAggregation(visual.aggregation);
    setFormGroupBy(visual.groupBy);
    setFormTitle(visual.title);
  };

  // Save selected visual updates
  const saveVisualChanges = () => {
    setVisuals(prev =>
      prev.map(v =>
        v.id === selectedVisualId
          ? {
              ...v,
              type: formVisualType,
              xAxis: formXAxis,
              yAxis: formYAxis,
              aggregation: formAggregation,
              groupBy: formGroupBy,
              title: formTitle || `${formAggregation.toUpperCase()} of ${formYAxis || 'Records'} by ${formXAxis || 'Dimension'}`
            }
          : v
      )
    );
  };

  // Effect to automatically save changes as you edit the fields panel
  useEffect(() => {
    if (selectedVisualId) {
      saveVisualChanges();
    }
  }, [formVisualType, formXAxis, formYAxis, formAggregation, formGroupBy, formTitle]);

  const deleteVisual = (id, e) => {
    e.stopPropagation();
    setVisuals(prev => prev.filter(v => v.id !== id));
    if (selectedVisualId === id) {
      setSelectedVisualId(null);
      setSidebarTab('fields');
    }
  };

  const getLegendKeys = (chartData, xAxisKey) => {
    const keys = new Set();
    chartData.forEach(item => {
      Object.keys(item).forEach(k => {
        if (k !== 'name' && k !== xAxisKey && k !== 'value') {
          keys.add(k);
        }
      });
    });
    return Array.from(keys);
  };

  // Render Visual content
  const renderVisualContent = (visual) => {
    if (visual.type === 'card') {
      return (
        <div className="kpi-value-container flex-col">
          <div className="kpi-value">{getKpiValue(visual)}</div>
          <div className="kpi-subtext">
            {visual.aggregation.toUpperCase()} {visual.yAxis ? `of ${visual.yAxis}` : 'of Total Rows'}
          </div>
        </div>
      );
    }

    if (!visual.xAxis) {
      return (
        <div className="visual-empty-state">
          <div className="visual-empty-icon">📊</div>
          <div>Please select X-Axis (Dimension) in sidebar to begin.</div>
        </div>
      );
    }

    const chartData = getAggregatedData(visual);

    if (chartData.length === 0) {
      return (
        <div className="visual-empty-state">
          <div className="visual-empty-icon">📭</div>
          <div>No data available. Adjust slicer filters.</div>
        </div>
      );
    }

    if (visual.type === 'table') {
      const headers = Object.keys(chartData[0]);
      return (
        <div className="pivot-table-container">
          <table className="pivot-table">
            <thead>
              <tr>
                {headers.map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.map((row, i) => (
                <tr key={i}>
                  {headers.map(h => (
                    <td key={h}>{String(row[h] ?? '-')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    const legendKeys = getLegendKeys(chartData, visual.xAxis);

    const handleChartClick = (dataPoint) => {
      if (dataPoint && dataPoint.activeLabel) {
        // Toggle cross filter on the canvas
        const label = dataPoint.activeLabel;
        toggleSlicerValue(visual.xAxis, label);
      }
    };

    return (
      <div className="visual-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          {visual.type === 'bar' && (
            <BarChart data={chartData} onClick={handleChartClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
              {legendKeys.length > 0 ? (
                <>
                  <Legend />
                  {legendKeys.map((key, index) => (
                    <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
                  ))}
                </>
              ) : (
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => {
                    const isSelected = activeFilters[visual.xAxis]?.includes(entry.name);
                    return <Cell key={`cell-${index}`} fill={isSelected ? '#a855f7' : '#6366f1'} />;
                  })}
                </Bar>
              )}
            </BarChart>
          )}

          {visual.type === 'line' && (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
              {legendKeys.length > 0 ? (
                <>
                  <Legend />
                  {legendKeys.map((key, index) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} strokeWidth={2.5} activeDot={{ r: 6 }} />
                  ))}
                </>
              ) : (
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 8 }} />
              )}
            </LineChart>
          )}

          {visual.type === 'area' && (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
              {legendKeys.length > 0 ? (
                <>
                  <Legend />
                  {legendKeys.map((key, index) => (
                    <Area key={key} type="monotone" dataKey={key} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} fillOpacity={0.15} />
                  ))}
                </>
              ) : (
                <Area type="monotone" dataKey="value" stroke="#6366f1" fillOpacity={1} fill="url(#colorArea)" strokeWidth={2.5} />
              )}
            </AreaChart>
          )}

          {(visual.type === 'pie' || visual.type === 'donut') && (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={visual.type === 'donut' ? 60 : 0}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Upload State or Workspace State */}
      {!currentDataset ? (
        <div className="upload-screen">
          <div className="upload-card">
            <h1 className="upload-title">Atlas Data Studio</h1>
            <p className="upload-subtitle">
              Upload Excel (.xlsx, .xls) or CSV files, extract dimensions, select columns, and build fully interactive BI visualization reports.
            </p>

            {error && (
              <div className="error-banner">
                <span>{error}</span>
                <button className="close-btn" onClick={() => setError(null)}>×</button>
              </div>
            )}

            <label className="dropzone">
              <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} className="file-input" />
              <div className="upload-icon">
                <Icons.Upload />
              </div>
              <div className="dropzone-text">
                {uploading ? 'Processing Data...' : 'Choose or Drag File Here'}
              </div>
              <div className="dropzone-subtext">Excel spreadsheets or CSV sheets (up to 10MB)</div>
            </label>

            <div className="or-divider">Or build immediately with</div>

            <div className="demo-btn-group">
              <button className="btn btn-secondary flex-1" onClick={handleDemoLoad} disabled={loading || uploading}>
                {loading ? <div className="spinner btn-sm"></div> : 'Load Bike Buyers Demo Dataset'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="workspace-layout">
          {/* Left Sidebar - Datasets navigator */}
          <aside className="left-sidebar">
            <div className="sidebar-header">
              <div className="logo-icon">A</div>
              <div className="logo-text">Atlas BI Studio</div>
            </div>

            <div className="sidebar-section">
              <button
                className="btn btn-primary btn-sm flex w-full justify-center"
                onClick={() => {
                  setCurrentDataset(null);
                  setRecords([]);
                  setVisuals([]);
                }}
              >
                <Icons.Plus /> New Dataset
              </button>
            </div>

            <div className="sidebar-title" style={{ paddingLeft: '24px', paddingBottom: '8px' }}>
              Datasets ({datasets.length})
            </div>

            <div className="dataset-list">
              {datasets.map(ds => (
                <button
                  key={ds.id}
                  className={`dataset-item ${currentDataset.id === ds.id ? 'active' : ''}`}
                  onClick={() => selectDataset(ds)}
                >
                  <span className="dataset-item-icon">
                    <Icons.Dataset />
                  </span>
                  <div className="dataset-item-info">
                    <div className="dataset-item-name">{ds.name}</div>
                    <div className="dataset-item-meta">{ds.row_count} rows • {ds.file_type.toUpperCase()}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="sidebar-footer">
              <div className="db-status">
                <div className={`status-indicator ${dbConnected ? 'connected' : ''}`}></div>
                <span>Database: {dbConnected ? 'SQLite Connected' : 'Disconnected'}</span>
              </div>
              <div>Rows: {records.length}</div>
            </div>
          </aside>

          {/* Main Visualization Canvas */}
          <main className="main-canvas">
            <header className="canvas-header">
              <div className="header-title-container">
                <h2 className="header-title">{currentDataset.name} Dashboard</h2>
                <p className="header-subtitle">
                  {currentDataset.source_name} • {records.length} records loaded into PostgreSQL
                </p>
              </div>

              <div className="header-actions">
                {Object.keys(activeFilters).length > 0 && (
                  <button
                    className="btn btn-secondary btn-sm text-xs btn-danger"
                    onClick={() => setActiveFilters({})}
                  >
                    Clear All Filters ({Object.keys(activeFilters).length})
                  </button>
                )}
                <button className="btn btn-primary btn-sm" onClick={addNewVisual}>
                  <Icons.Plus /> Add Visual
                </button>
              </div>
            </header>

            <div className="grid-workspace">
              {error && (
                <div className="error-banner">
                  <span>{error}</span>
                  <button className="close-btn" onClick={() => setError(null)}>×</button>
                </div>
              )}

              {/* Slicers Panel (Filters) */}
              {slicerColumns.length > 0 && (
                <div className="slicers-container">
                  <div className="w-full flex items-center gap-2 mb-2" style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>
                    <Icons.Filter />
                    <span>DASHBOARD SLICERS (FILTERS)</span>
                  </div>
                  {slicerColumns.map(col => {
                    const uniqueValues = Array.from(new Set(records.map(r => String(r[col.name] ?? 'Blank')))).sort();
                    const activeVals = activeFilters[col.name] || [];
                    return (
                      <div key={col.name} className="slicer-card">
                        <div className="slicer-title">
                          <span>{col.name}</span>
                          {activeVals.length > 0 && (
                            <span className="slicer-reset" onClick={() => clearSlicerFilters(col.name)}>
                              Reset
                            </span>
                          )}
                        </div>
                        <div className="slicer-options">
                          {uniqueValues.map(val => {
                            const isActive = activeVals.includes(val);
                            return (
                              <div
                                key={val}
                                className={`slicer-option ${isActive ? 'active' : ''}`}
                                onClick={() => toggleSlicerValue(col.name, val)}
                              >
                                <div className="slicer-checkbox">
                                  {isActive && <div className="field-checkbox-inner" />}
                                </div>
                                <span>{val}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Active Filter Chips */}
              {Object.keys(activeFilters).length > 0 && (
                <div className="active-filters-bar">
                  <span style={{ color: '#64748b', marginRight: '6px' }}>Active Filters:</span>
                  {Object.entries(activeFilters).map(([col, vals]) =>
                    vals.map(val => (
                      <div key={`${col}-${val}`} className="filter-chip">
                        <span>
                          {col}: {val}
                        </span>
                        <div className="filter-chip-remove" onClick={() => toggleSlicerValue(col, val)}>
                          ×
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Grid Canvas containing Visual Cards */}
              <div className="dashboard-grid">
                {visuals.map(visual => (
                  <div
                    key={visual.id}
                    onClick={() => selectVisual(visual)}
                    className={`visual-card ${visual.span || 'span-6'} ${
                      selectedVisualId === visual.id ? 'selected-visual' : ''
                    } ${visual.type === 'card' ? 'kpi-card' : ''}`}
                  >
                    <div className="visual-header">
                      <div className="visual-title-container">
                        <h3 className="visual-title">{visual.title}</h3>
                        <p className="visual-subtitle">
                          {visual.type !== 'card' &&
                            `${visual.aggregation.toUpperCase()} of ${visual.yAxis} grouped by ${visual.xAxis}`}
                        </p>
                      </div>
                      <div className="visual-actions">
                        <button
                          className="visual-action-btn delete"
                          onClick={(e) => deleteVisual(visual.id, e)}
                          title="Delete Visual"
                        >
                          <Icons.Trash />
                        </button>
                      </div>
                    </div>
                    {renderVisualContent(visual)}
                  </div>
                ))}
              </div>
            </div>
          </main>

          {/* Right Sidebar - Fields and Visualizations panels */}
          <aside className="config-sidebar">
            <div className="config-tab-header">
              <button
                className={`config-tab-btn ${sidebarTab === 'fields' ? 'active' : ''}`}
                onClick={() => setSidebarTab('fields')}
              >
                Fields
              </button>
              <button
                className={`config-tab-btn ${sidebarTab === 'visuals' ? 'active' : ''}`}
                onClick={() => setSidebarTab('visuals')}
                disabled={!selectedVisualId}
              >
                Visualizations
              </button>
            </div>

            {sidebarTab === 'fields' && currentDataset.summary?.columns && (
              <div className="config-section">
                <div className="config-section-title">
                  <span>Available Fields</span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Check to toggle</span>
                </div>
                <div className="field-list">
                  {currentDataset.summary.columns.map(col => {
                    const isSelected = formXAxis === col.name || formYAxis === col.name || formGroupBy === col.name;
                    return (
                      <div
                        key={col.name}
                        onClick={() => {
                          if (selectedVisualId) {
                            if (formXAxis === col.name) {
                              setFormXAxis('');
                            } else if (!formXAxis) {
                              setFormXAxis(col.name);
                            } else if (formYAxis === col.name) {
                              setFormYAxis('');
                            } else if (!formYAxis) {
                              setFormYAxis(col.name);
                            } else {
                              setFormGroupBy(col.name);
                            }
                          }
                        }}
                        className={`field-item ${isSelected ? 'selected' : ''}`}
                      >
                        <div className={`field-type-badge ${col.type}`}>
                          {col.type === 'number' && '#'}
                          {col.type === 'currency' && '$'}
                          {col.type === 'text' && 'A'}
                          {col.type === 'date' && 'D'}
                          {col.type === 'boolean' && 'Y'}
                        </div>
                        <div className="field-name" title={col.name}>
                          {col.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {selectedVisualId ? (
                  <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '16px', lineHeight: '1.4' }}>
                    💡 Select a chart and click a field to map it to Axis slots.
                  </p>
                ) : (
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '16px', lineHeight: '1.4' }}>
                    💡 Select a visual on the canvas to configure or map its fields.
                  </p>
                )}
              </div>
            )}

            {sidebarTab === 'visuals' && selectedVisualId && (
              <>
                <div className="config-section">
                  <div className="config-section-title">Visual Type</div>
                  <div className="viz-grid">
                    {[
                      { type: 'bar', icon: '📊', name: 'Bar' },
                      { type: 'line', icon: '📈', name: 'Line' },
                      { type: 'area', icon: '📉', name: 'Area' },
                      { type: 'pie', icon: '🍕', name: 'Pie' },
                      { type: 'donut', icon: '🍩', name: 'Donut' },
                      { type: 'card', icon: '📇', name: 'Card' },
                      { type: 'table', icon: '📋', name: 'Table' }
                    ].map(v => (
                      <button
                        key={v.type}
                        className={`viz-type-btn ${formVisualType === v.type ? 'active' : ''}`}
                        onClick={() => setFormVisualType(v.type)}
                      >
                        <span className="viz-type-icon">{v.icon}</span>
                        <span className="viz-type-name">{v.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="config-section">
                  <div className="config-section-title">Configure Fields</div>
                  <div className="well-group">
                    {/* Visual Title */}
                    <div className="well-slot">
                      <label className="well-label">Visual Title</label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="well-select"
                        placeholder="Automatic Title"
                      />
                    </div>

                    {/* Size Span */}
                    <div className="well-slot">
                      <label className="well-label">Visual Width (Span)</label>
                      <select
                        value={visuals.find(v => v.id === selectedVisualId)?.span || 'span-6'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVisuals(prev => prev.map(v => (v.id === selectedVisualId ? { ...v, span: val } : v)));
                        }}
                        className="well-select"
                      >
                        <option value="span-3">1/4 Width (3 Cols)</option>
                        <option value="span-4">1/3 Width (4 Cols)</option>
                        <option value="span-6">1/2 Width (6 Cols)</option>
                        <option value="span-8">2/3 Width (8 Cols)</option>
                        <option value="span-12">Full Width (12 Cols)</option>
                      </select>
                    </div>

                    {formVisualType !== 'card' && (
                      <div className="well-slot">
                        <label className="well-label">Axis / Dimension (X-Axis)</label>
                        <select
                          value={formXAxis}
                          onChange={(e) => setFormXAxis(e.target.value)}
                          className="well-select"
                        >
                          <option value="">-- Select Column --</option>
                          {currentDataset.summary?.columns.map(c => (
                            <option key={c.name} value={c.name}>
                              {c.name} ({c.type.toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="well-slot">
                      <label className="well-label">Measure (Y-Axis / Value)</label>
                      <select
                        value={formYAxis}
                        onChange={(e) => setFormYAxis(e.target.value)}
                        className="well-select"
                      >
                        <option value="">-- Total Rows Count --</option>
                        {currentDataset.summary?.columns.map(c => (
                          <option key={c.name} value={c.name}>
                            {c.name} ({c.type.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="well-slot">
                      <label className="well-label">Aggregation Function</label>
                      <select
                        value={formAggregation}
                        onChange={(e) => setFormAggregation(e.target.value)}
                        className="well-select"
                      >
                        <option value="sum">SUM</option>
                        <option value="avg">AVERAGE</option>
                        <option value="min">MIN</option>
                        <option value="max">MAX</option>
                        <option value="count">COUNT</option>
                        <option value="distinct">DISTINCT COUNT</option>
                      </select>
                    </div>

                    {['bar', 'line', 'area'].includes(formVisualType) && (
                      <div className="well-slot">
                        <label className="well-label">Group By / Legend</label>
                        <select
                          value={formGroupBy}
                          onChange={(e) => setFormGroupBy(e.target.value)}
                          className="well-select"
                        >
                          <option value="">-- None --</option>
                          {currentDataset.summary?.columns
                            .filter(c => ['text', 'boolean'].includes(c.type) && c.name !== formXAxis)
                            .map(c => (
                              <option key={c.name} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
