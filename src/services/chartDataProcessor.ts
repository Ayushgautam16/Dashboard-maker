import { AggregationType, FilterState, WidgetConfig } from '../types/dashboard';
import { parseNumericValue } from './dataParser';

/**
 * Filter raw dataset by global filters
 */
export function applyGlobalFilters(
  rawData: Record<string, any>[],
  filters: FilterState[]
): Record<string, any>[] {
  if (!filters || filters.length === 0) return rawData;

  return rawData.filter((row) => {
    return filters.every((filter) => {
      if (!filter.column || filter.value === undefined || filter.value === null || filter.value === '') {
        return true;
      }

      const rawVal = row[filter.column];

      switch (filter.type) {
        case 'search': {
          if (!rawVal) return false;
          return String(rawVal).toLowerCase().includes(String(filter.value).toLowerCase());
        }
        case 'category':
        case 'dropdown': {
          if (Array.isArray(filter.value)) {
            if (filter.value.length === 0) return true;
            return filter.value.includes(String(rawVal));
          }
          return String(rawVal) === String(filter.value);
        }
        case 'multi-select':
        case 'checkbox': {
          if (Array.isArray(filter.value) && filter.value.length > 0) {
            return filter.value.includes(String(rawVal));
          }
          return true;
        }
        case 'range': {
          const numVal = parseNumericValue(rawVal);
          if (numVal === null) return false;
          const [min, max] = filter.value as [number, number];
          if (min !== undefined && numVal < min) return false;
          if (max !== undefined && numVal > max) return false;
          return true;
        }
        case 'date': {
          if (!rawVal) return false;
          const dateVal = new Date(rawVal).getTime();
          if (isNaN(dateVal)) return false;
          const { start, end } = filter.value || {};
          if (start && dateVal < new Date(start).getTime()) return false;
          if (end && dateVal > new Date(end).getTime()) return false;
          return true;
        }
        default:
          return true;
      }
    });
  });
}

/**
 * Compute single aggregated metric
 */
export function calculateAggregation(
  values: any[],
  aggType: AggregationType
): number {
  if (!values || values.length === 0) return 0;

  if (aggType === 'count') return values.length;

  if (aggType === 'distinct') {
    const set = new Set(values.filter((v) => v !== null && v !== undefined && String(v) !== ''));
    return set.size;
  }

  const nums = values.map((v) => parseNumericValue(v)).filter((n): n is number => n !== null);
  if (nums.length === 0) return 0;

  switch (aggType) {
    case 'sum':
    case 'auto':
      return nums.reduce((acc, curr) => acc + curr, 0);
    case 'avg':
      return nums.reduce((acc, curr) => acc + curr, 0) / nums.length;
    case 'min':
      return Math.min(...nums);
    case 'max':
      return Math.max(...nums);
    case 'median': {
      const sorted = [...nums].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    default:
      return nums.reduce((acc, curr) => acc + curr, 0);
  }
}

/**
 * Process raw dataset into chart data formatted for Recharts
 */
export function processChartData(
  rawData: Record<string, any>[],
  widget: WidgetConfig,
  filters: FilterState[] = []
): { data: any[]; seriesKeys: string[] } {
  const filteredData = applyGlobalFilters(rawData, filters);

  const xAxis = widget.xAxis;
  const yAxis = widget.yAxis;
  const groupBy = widget.groupBy;

  if (!xAxis) {
    return { data: [], seriesKeys: [yAxis || 'value'] };
  }

  // 1. If GroupBy is specified (e.g. Stacked Bar or Grouped Bar or Multi-series Line)
  if (groupBy && groupBy !== xAxis) {
    const groupedMap = new Map<string, Map<string, any[]>>();
    const groupKeys = new Set<string>();

    for (const row of filteredData) {
      const xVal = String(row[xAxis] ?? 'N/A');
      const gVal = String(row[groupBy] ?? 'N/A');
      groupKeys.add(gVal);

      if (!groupedMap.has(xVal)) {
        groupedMap.set(xVal, new Map());
      }
      const xMap = groupedMap.get(xVal)!;
      if (!xMap.has(gVal)) {
        xMap.set(gVal, []);
      }
      xMap.get(gVal)!.push(row[yAxis]);
    }

    const seriesKeys = Array.from(groupKeys);
    const resultData: any[] = [];

    groupedMap.forEach((xMap, xKey) => {
      const item: Record<string, any> = { [xAxis]: xKey };
      seriesKeys.forEach((gKey) => {
        const vals = xMap.get(gKey) || [];
        item[gKey] = Math.round(calculateAggregation(vals, widget.aggregation) * 100) / 100;
      });
      resultData.push(item);
    });

    // Sort
    sortChartData(resultData, widget);
    return { data: resultData, seriesKeys };
  }

  // 2. Standard single-series grouping (X-Axis -> Aggregated Y-Axis)
  const categoryMap = new Map<string, any[]>();
  const secondaryMap = new Map<string, any[]>();

  for (const row of filteredData) {
    const xVal = String(row[xAxis] ?? 'N/A');
    if (!categoryMap.has(xVal)) {
      categoryMap.set(xVal, []);
    }
    categoryMap.get(xVal)!.push(row[yAxis]);

    if (widget.secondaryYAxis) {
      if (!secondaryMap.has(xVal)) {
        secondaryMap.set(xVal, []);
      }
      secondaryMap.get(xVal)!.push(row[widget.secondaryYAxis]);
    }
  }

  const resultData: any[] = [];

  categoryMap.forEach((vals, xKey) => {
    const yVal = Math.round(calculateAggregation(vals, widget.aggregation) * 100) / 100;
    const item: Record<string, any> = {
      [xAxis]: xKey,
      [yAxis || 'value']: yVal,
    };

    if (widget.secondaryYAxis) {
      const secVal = Math.round(calculateAggregation(secondaryMap.get(xKey) || [], widget.aggregation) * 100) / 100;
      item[widget.secondaryYAxis] = secVal;
    }

    resultData.push(item);
  });

  // Sort
  sortChartData(resultData, widget);

  const series = [yAxis || 'value'];
  if (widget.secondaryYAxis) series.push(widget.secondaryYAxis);

  return { data: resultData, seriesKeys: series };
}

function sortChartData(data: any[], widget: WidgetConfig) {
  const sortBy = widget.sortBy || widget.xAxis;
  const isDesc = widget.sortOrder === 'desc';

  data.sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];

    if (typeof valA === 'number' && typeof valB === 'number') {
      return isDesc ? valB - valA : valA - valB;
    }

    return isDesc
      ? String(valB).localeCompare(String(valA))
      : String(valA).localeCompare(String(valB));
  });
}
