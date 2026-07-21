export type ColumnDataType = 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'boolean';

export interface ColumnMetadata {
  name: string;
  type: ColumnDataType;
  sampleValues: any[];
  uniqueCount: number;
  nullCount: number;
  min?: number;
  max?: number;
  avg?: number;
}

export interface DatasetSummary {
  id: string;
  name: string;
  totalRows: number;
  totalColumns: number;
  numericColsCount: number;
  categoricalColsCount: number;
  dateColsCount: number;
  missingValuesCount: number;
  duplicateRowsCount: number;
  fileSizeBytes: number;
  columns: ColumnMetadata[];
  rawData: Record<string, any>[];
  uploadedAt: string;
}

export type ChartType =
  | 'line'
  | 'area'
  | 'bar'
  | 'horizontal-bar'
  | 'stacked-bar'
  | 'grouped-bar'
  | 'pie'
  | 'donut'
  | 'radar'
  | 'scatter'
  | 'heatmap'
  | 'histogram'
  | 'box-plot'
  | 'waterfall'
  | 'funnel'
  | 'gauge'
  | 'timeline'
  | 'mixed'
  | 'table'
  | 'pivot-table';

export type AggregationType =
  | 'sum'
  | 'avg'
  | 'count'
  | 'median'
  | 'max'
  | 'min'
  | 'distinct'
  | 'auto';

export interface WidgetConfig {
  id: string;
  title: string;
  chartType: ChartType;
  xAxis: string;
  yAxis: string;
  secondaryYAxis?: string;
  category?: string;
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  aggregation: AggregationType;
  colorScheme?: string;
  // Grid Layout
  colSpan?: 1 | 2 | 3 | 4; // Out of 4 columns grid
  rowSpan?: 1 | 2;
  collapsed?: boolean;
}

export interface KpiCardConfig {
  id: string;
  title: string;
  column: string;
  aggregation: AggregationType;
  iconName: string;
  prefix?: string;
  suffix?: string;
  color: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'indigo' | 'cyan';
}

export type FilterType = 'date' | 'category' | 'range' | 'search' | 'checkbox' | 'dropdown' | 'multi-select';

export interface FilterState {
  id: string;
  column: string;
  type: FilterType;
  value: any;
}

export interface SmartSuggestion {
  id: string;
  title: string;
  description: string;
  chartType: ChartType;
  xAxis: string;
  yAxis: string;
  aggregation: AggregationType;
  groupBy?: string;
  badge?: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  suggestedWidget?: WidgetConfig;
  timestamp: string;
}

export type AppViewMode = 'landing' | 'preview' | 'dashboard';
