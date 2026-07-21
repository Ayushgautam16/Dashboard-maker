import { AggregationType, ChartType, DatasetSummary, WidgetConfig } from '../types/dashboard';

/**
 * Interpret user natural language prompt and convert it to a chart widget configuration
 */
export function interpretAiPrompt(
  prompt: string,
  dataset: DatasetSummary
): { explanation: string; widget: WidgetConfig } {
  const p = prompt.toLowerCase().trim();
  const columns = dataset.columns;

  // Helper to find matching column name from text
  const findColumn = (query: string): string | undefined => {
    return columns.find((col) => query.includes(col.name.toLowerCase()))?.name;
  };

  // Determine Aggregation
  let aggregation: AggregationType = 'sum';
  if (p.includes('avg') || p.includes('average') || p.includes('mean')) {
    aggregation = 'avg';
  } else if (p.includes('count') || p.includes('number of') || p.includes('how many') || p.includes('distribution')) {
    aggregation = 'count';
  } else if (p.includes('max') || p.includes('highest') || p.includes('peak')) {
    aggregation = 'max';
  } else if (p.includes('min') || p.includes('lowest')) {
    aggregation = 'min';
  }

  // Determine Chart Type
  let chartType: ChartType = 'bar';
  if (p.includes('trend') || p.includes('over time') || p.includes('monthly') || p.includes('daily') || p.includes('timeline')) {
    chartType = p.includes('area') ? 'area' : 'line';
  } else if (p.includes('pie') || p.includes('donut') || p.includes('share') || p.includes('proportion')) {
    chartType = p.includes('donut') ? 'donut' : 'pie';
  } else if (p.includes('horizontal') || p.includes('ranking')) {
    chartType = 'horizontal-bar';
  } else if (p.includes('stacked')) {
    chartType = 'stacked-bar';
  } else if (p.includes('scatter') || p.includes('correlation')) {
    chartType = 'scatter';
  }

  // Specific query handlers for Bike Buyers Dataset
  const isBikeDataset = columns.some((c) => c.name.toLowerCase().includes('purchased bike') || c.name.toLowerCase().includes('income'));

  if (isBikeDataset) {
    if (p.includes('income') && p.includes('occupation')) {
      const widget: WidgetConfig = {
        id: 'ai-widget-' + Date.now(),
        title: 'Average Income by Occupation',
        chartType: 'bar',
        xAxis: 'Occupation',
        yAxis: 'Income',
        groupBy: 'Purchased Bike',
        aggregation: 'avg',
        colSpan: 2,
      };
      return {
        explanation: 'Generated a grouped Bar Chart showing Average Income categorized by Occupation and segmented by Bike Purchase status.',
        widget,
      };
    }

    if (p.includes('male') || p.includes('female') || p.includes('gender')) {
      const widget: WidgetConfig = {
        id: 'ai-widget-' + Date.now(),
        title: 'Income & Bike Purchase Comparison by Gender',
        chartType: 'grouped-bar',
        xAxis: 'Gender',
        yAxis: 'Income',
        groupBy: 'Purchased Bike',
        aggregation: 'avg',
        colSpan: 2,
      };
      return {
        explanation: 'Generated a Grouped Bar Chart comparing average income between Males and Females split by Purchased Bike status.',
        widget,
      };
    }

    if (p.includes('age') || p.includes('bracket')) {
      const widget: WidgetConfig = {
        id: 'ai-widget-' + Date.now(),
        title: 'Customer Age Distribution',
        chartType: 'horizontal-bar',
        xAxis: 'Occupation',
        yAxis: 'Age',
        aggregation: 'avg',
        colSpan: 2,
      };
      return {
        explanation: 'Generated a Horizontal Bar Chart displaying average customer Age by Occupation.',
        widget,
      };
    }

    if (p.includes('region') || p.includes('location')) {
      const widget: WidgetConfig = {
        id: 'ai-widget-' + Date.now(),
        title: 'Bike Purchases by Region',
        chartType: 'stacked-bar',
        xAxis: 'Region',
        yAxis: 'Income',
        groupBy: 'Purchased Bike',
        aggregation: 'count',
        colSpan: 2,
      };
      return {
        explanation: 'Generated a Stacked Bar Chart showing bike purchase breakdown across geographical Regions.',
        widget,
      };
    }
  }

  // General Column Extractor Logic
  const matchedX = findColumn(p);

  // Pick numeric column for Y axis
  const numericCols = columns.filter((c) => ['number', 'currency', 'percentage'].includes(c.type));
  const categoricalCols = columns.filter((c) => c.type === 'text' || c.type === 'boolean');
  const dateCols = columns.filter((c) => c.type === 'date');

  let xAxis = matchedX || (dateCols.length > 0 ? dateCols[0].name : categoricalCols[0]?.name || columns[0].name);
  let yAxis = numericCols.length > 0 ? numericCols[0].name : xAxis;

  // Look if user mentioned a specific numeric column in prompt
  for (const numCol of numericCols) {
    if (p.includes(numCol.name.toLowerCase())) {
      yAxis = numCol.name;
      break;
    }
  }

  const widgetTitle = `${aggregation.toUpperCase()} of ${yAxis} by ${xAxis}`;

  const widget: WidgetConfig = {
    id: 'ai-widget-' + Date.now(),
    title: widgetTitle,
    chartType,
    xAxis,
    yAxis,
    aggregation,
    colSpan: 2,
  };

  return {
    explanation: `Created a ${chartType.toUpperCase()} chart plotting ${yAxis} aggregated as ${aggregation.toUpperCase()} against ${xAxis}.`,
    widget,
  };
}
