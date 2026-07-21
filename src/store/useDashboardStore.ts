import { create } from 'zustand';
import { getDemoBikeSalesDataset, getDemoSuperstoreDataset } from '../data/demoDatasets';
import { interpretAiPrompt } from '../services/aiAssistant';
import { generateSmartSuggestions } from '../services/suggestions';
import {
  AiChatMessage,
  AppViewMode,
  DatasetSummary,
  FilterState,
  KpiCardConfig,
  SmartSuggestion,
  WidgetConfig,
} from '../types/dashboard';

interface DashboardStoreState {
  dataset: DatasetSummary | null;
  activeView: AppViewMode;
  widgets: WidgetConfig[];
  kpis: KpiCardConfig[];
  filters: FilterState[];
  suggestions: SmartSuggestion[];
  aiMessages: AiChatMessage[];
  theme: 'dark' | 'light';
  sidebarTab: 'datasets' | 'builder' | 'filters' | 'ai';
  isAiOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setDataset: (summary: DatasetSummary) => void;
  loadDemoDataset: (type: 'bike' | 'superstore') => void;
  clearDataset: () => void;
  setViewMode: (mode: AppViewMode) => void;
  setSidebarTab: (tab: 'datasets' | 'builder' | 'filters' | 'ai') => void;
  toggleTheme: () => void;
  toggleAiOpen: () => void;
  setError: (err: string | null) => void;
  setIsLoading: (loading: boolean) => void;

  // Widgets Actions
  addWidget: (widget: WidgetConfig) => void;
  updateWidget: (id: string, config: Partial<WidgetConfig>) => void;
  deleteWidget: (id: string) => void;
  duplicateWidget: (id: string) => void;
  toggleWidgetCollapse: (id: string) => void;
  reorderWidgets: (startIndex: number, endIndex: number) => void;

  // KPI Actions
  addKpi: (kpi: KpiCardConfig) => void;
  updateKpi: (id: string, config: Partial<KpiCardConfig>) => void;
  deleteKpi: (id: string) => void;

  // Filters Actions
  setFilter: (filter: FilterState) => void;
  clearFilter: (id: string) => void;
  clearAllFilters: () => void;

  // AI Assistant Action
  sendAiPrompt: (prompt: string) => void;
  addSuggestionToDashboard: (suggestion: SmartSuggestion) => void;
}

export const useDashboardStore = create<DashboardStoreState>((set, get) => ({
  dataset: null,
  activeView: 'landing',
  widgets: [],
  kpis: [],
  filters: [],
  suggestions: [],
  aiMessages: [
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: "👋 Hi! I'm your Dashboard AI Assistant. Ask me anything about your dataset like 'Show average income by occupation' or 'Compare sales over time'.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ],
  theme: 'dark',
  sidebarTab: 'builder',
  isAiOpen: false,
  isLoading: false,
  error: null,

  setDataset: (summary) => {
    const suggestions = generateSmartSuggestions(summary);

    // Auto-create default widgets & KPIs from suggestions
    const initialWidgets: WidgetConfig[] = suggestions.slice(0, 4).map((sug, idx) => ({
      id: `w-auto-${idx}`,
      title: sug.title,
      chartType: sug.chartType,
      xAxis: sug.xAxis,
      yAxis: sug.yAxis,
      groupBy: sug.groupBy,
      aggregation: sug.aggregation,
      colSpan: 2,
    }));

    const numericCols = summary.columns.filter((c) => ['number', 'currency', 'percentage'].includes(c.type));
    const initialKpis: KpiCardConfig[] = numericCols.slice(0, 4).map((col, idx) => {
      const colors: ('blue' | 'emerald' | 'purple' | 'amber' | 'rose')[] = ['emerald', 'blue', 'purple', 'amber'];
      return {
        id: `kpi-auto-${idx}`,
        title: col.name,
        column: col.name,
        aggregation: col.type === 'currency' || col.type === 'number' ? 'sum' : 'avg',
        iconName: col.type === 'currency' ? 'DollarSign' : 'TrendingUp',
        prefix: col.type === 'currency' ? '$' : undefined,
        color: colors[idx % colors.length],
      };
    });

    set({
      dataset: summary,
      widgets: initialWidgets,
      kpis: initialKpis,
      suggestions,
      activeView: 'preview',
      error: null,
    });
  },

  loadDemoDataset: (type) => {
    set({ isLoading: true });
    setTimeout(() => {
      if (type === 'bike') {
        const { summary, widgets, kpis } = getDemoBikeSalesDataset();
        const suggestions = generateSmartSuggestions(summary);
        set({
          dataset: summary,
          widgets,
          kpis,
          suggestions,
          activeView: 'dashboard',
          isLoading: false,
          error: null,
        });
      } else {
        const { summary, widgets, kpis } = getDemoSuperstoreDataset();
        const suggestions = generateSmartSuggestions(summary);
        set({
          dataset: summary,
          widgets,
          kpis,
          suggestions,
          activeView: 'dashboard',
          isLoading: false,
          error: null,
        });
      }
    }, 200);
  },

  clearDataset: () => {
    set({
      dataset: null,
      widgets: [],
      kpis: [],
      filters: [],
      suggestions: [],
      activeView: 'landing',
    });
  },

  setViewMode: (activeView) => set({ activeView }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  toggleAiOpen: () => set((state) => ({ isAiOpen: !state.isAiOpen })),
  setError: (error) => set({ error }),
  setIsLoading: (isLoading) => set({ isLoading }),

  // Widget Actions
  addWidget: (widget) => set((state) => ({ widgets: [...state.widgets, widget] })),

  updateWidget: (id, config) =>
    set((state) => ({
      widgets: state.widgets.map((w) => (w.id === id ? { ...w, ...config } : w)),
    })),

  deleteWidget: (id) =>
    set((state) => ({
      widgets: state.widgets.filter((w) => w.id !== id),
    })),

  duplicateWidget: (id) =>
    set((state) => {
      const target = state.widgets.find((w) => w.id === id);
      if (!target) return state;
      const clone: WidgetConfig = {
        ...target,
        id: `w-copy-${Date.now()}`,
        title: `${target.title} (Copy)`,
      };
      return { widgets: [...state.widgets, clone] };
    }),

  toggleWidgetCollapse: (id) =>
    set((state) => ({
      widgets: state.widgets.map((w) => (w.id === id ? { ...w, collapsed: !w.collapsed } : w)),
    })),

  reorderWidgets: (startIndex, endIndex) =>
    set((state) => {
      const result = Array.from(state.widgets);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return { widgets: result };
    }),

  // KPI Actions
  addKpi: (kpi) => set((state) => ({ kpis: [...state.kpis, kpi] })),
  updateKpi: (id, config) =>
    set((state) => ({
      kpis: state.kpis.map((k) => (k.id === id ? { ...k, ...config } : k)),
    })),
  deleteKpi: (id) => set((state) => ({ kpis: state.kpis.filter((k) => k.id !== id) })),

  // Filter Actions
  setFilter: (filter) =>
    set((state) => {
      const exists = state.filters.some((f) => f.column === filter.column);
      if (exists) {
        return {
          filters: state.filters.map((f) => (f.column === filter.column ? filter : f)),
        };
      }
      return { filters: [...state.filters, filter] };
    }),

  clearFilter: (id) =>
    set((state) => ({
      filters: state.filters.filter((f) => f.id !== id),
    })),

  clearAllFilters: () => set({ filters: [] }),

  // AI Prompt Action
  sendAiPrompt: (promptText) => {
    const dataset = get().dataset;
    if (!dataset) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: AiChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: promptText,
      timestamp: time,
    };

    set((state) => ({ aiMessages: [...state.aiMessages, userMsg] }));

    const { explanation, widget } = interpretAiPrompt(promptText, dataset);

    const aiMsg: AiChatMessage = {
      id: 'msg-' + (Date.now() + 1),
      sender: 'ai',
      text: explanation,
      suggestedWidget: widget,
      timestamp: time,
    };

    set((state) => ({
      aiMessages: [...state.aiMessages, aiMsg],
      widgets: [...state.widgets, widget],
    }));
  },

  addSuggestionToDashboard: (suggestion) => {
    const widget: WidgetConfig = {
      id: 'w-sug-' + Date.now(),
      title: suggestion.title,
      chartType: suggestion.chartType,
      xAxis: suggestion.xAxis,
      yAxis: suggestion.yAxis,
      groupBy: suggestion.groupBy,
      aggregation: suggestion.aggregation,
      colSpan: 2,
    };
    set((state) => ({ widgets: [...state.widgets, widget] }));
  },
}));
