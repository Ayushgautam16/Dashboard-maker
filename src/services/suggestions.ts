import { DatasetSummary, SmartSuggestion } from '../types/dashboard';

/**
 * Auto-generate smart visual suggestions based on dataset headers and data types
 */
export function generateSmartSuggestions(dataset: DatasetSummary): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];
  const colNames = dataset.columns.map((c) => c.name.toLowerCase());

  const findCol = (terms: string[]) =>
    dataset.columns.find((c) => terms.some((t) => c.name.toLowerCase().includes(t)))?.name;

  const numericCols = dataset.columns.filter((c) => ['number', 'currency', 'percentage'].includes(c.type));
  const categoricalCols = dataset.columns.filter((c) => c.type === 'text' || c.type === 'boolean');
  const dateCols = dataset.columns.filter((c) => c.type === 'date');

  // Check if Bike Buyers dataset specifically
  const isBikeDataset = colNames.includes('purchased bike') || (colNames.includes('income') && colNames.includes('occupation'));

  if (isBikeDataset) {
    const purchasedBike = findCol(['purchased bike', 'purchased']) || 'Purchased Bike';
    const income = findCol(['income']) || 'Income';
    const occupation = findCol(['occupation']) || 'Occupation';
    const age = findCol(['age']) || 'Age';
    const region = findCol(['region']) || 'Region';
    const commute = findCol(['commute distance', 'commute']) || 'Commute Distance';
    const education = findCol(['education']) || 'Education';
    const cars = findCol(['cars']) || 'Cars';
    const marital = findCol(['marital status', 'marital']) || 'Marital Status';
    const gender = findCol(['gender']) || 'Gender';

    return [
      {
        id: 'sug-bike-1',
        title: 'Average Income vs Purchased Bike',
        description: 'Compare average income of customers who purchased bikes vs those who did not.',
        chartType: 'bar',
        xAxis: purchasedBike,
        yAxis: income,
        aggregation: 'avg',
        badge: 'Bike Sales Special',
      },
      {
        id: 'sug-bike-2',
        title: 'Purchased Bike Distribution',
        description: 'Overall distribution of bike buyers across the dataset.',
        chartType: 'donut',
        xAxis: purchasedBike,
        yAxis: purchasedBike,
        aggregation: 'count',
        badge: 'Bike Sales Special',
      },
      {
        id: 'sug-bike-3',
        title: 'Income by Occupation',
        description: 'Compare average salary breakdown across job categories.',
        chartType: 'bar',
        xAxis: occupation,
        yAxis: income,
        groupBy: purchasedBike,
        aggregation: 'avg',
        badge: 'Occupation Analysis',
      },
      {
        id: 'sug-bike-4',
        title: 'Region Analysis',
        description: 'Bike purchases breakdown by geographical region.',
        chartType: 'stacked-bar',
        xAxis: region,
        yAxis: income,
        groupBy: purchasedBike,
        aggregation: 'count',
        badge: 'Geographic',
      },
      {
        id: 'sug-bike-5',
        title: 'Age Distribution by Purchase Status',
        description: 'Customer age patterns comparing bike buyers.',
        chartType: 'horizontal-bar',
        xAxis: occupation,
        yAxis: age,
        aggregation: 'avg',
        badge: 'Demographics',
      },
      {
        id: 'sug-bike-6',
        title: 'Commute Distance & Bike Purchase',
        description: 'Analyze how commute distance impacts bike purchases.',
        chartType: 'pie',
        xAxis: commute,
        yAxis: income,
        aggregation: 'count',
        badge: 'Commute Analysis',
      },
      {
        id: 'sug-bike-7',
        title: 'Gender & Bike Purchase Comparison',
        description: 'Demographic breakdown by gender and bike purchase status.',
        chartType: 'grouped-bar',
        xAxis: gender,
        yAxis: income,
        groupBy: purchasedBike,
        aggregation: 'avg',
        badge: 'Demographics',
      },
      {
        id: 'sug-bike-8',
        title: 'Marital Status Breakdown',
        description: 'Bike buyers segmented by marital status.',
        chartType: 'donut',
        xAxis: marital,
        yAxis: income,
        aggregation: 'count',
        badge: 'Marital Status',
      },
    ];
  }

  // General Dataset Auto Recommendations
  const salesCol = findCol(['sales', 'revenue', 'amount', 'total']);
  const profitCol = findCol(['profit', 'margin', 'gain']);
  const categoryCol = findCol(['category', 'product', 'item', 'segment', 'type']);
  const regionCol = findCol(['region', 'country', 'state', 'city', 'location']);
  const dateCol = findCol(['date', 'time', 'year', 'month', 'created']);
  const customerCol = findCol(['customer', 'client', 'user']);

  if (salesCol && dateCol) {
    suggestions.push({
      id: 'sug-gen-1',
      title: 'Sales over Time',
      description: `Track ${salesCol} trends across ${dateCol}.`,
      chartType: 'area',
      xAxis: dateCol,
      yAxis: salesCol,
      aggregation: 'sum',
      badge: 'Time Trend',
    });
  }

  if (salesCol && regionCol) {
    suggestions.push({
      id: 'sug-gen-2',
      title: 'Revenue by Region',
      description: `Breakdown of ${salesCol} across ${regionCol}.`,
      chartType: 'bar',
      xAxis: regionCol,
      yAxis: salesCol,
      aggregation: 'sum',
      badge: 'Regional',
    });
  }

  if (profitCol && categoryCol) {
    suggestions.push({
      id: 'sug-gen-3',
      title: 'Profit by Category',
      description: `Compare ${profitCol} performance across ${categoryCol}.`,
      chartType: 'horizontal-bar',
      xAxis: categoryCol,
      yAxis: profitCol,
      aggregation: 'sum',
      badge: 'Category Analysis',
    });
  }

  if (categoryCol && salesCol) {
    suggestions.push({
      id: 'sug-gen-4',
      title: 'Top Categories by Revenue',
      description: `Distribution of ${salesCol} by ${categoryCol}.`,
      chartType: 'donut',
      xAxis: categoryCol,
      yAxis: salesCol,
      aggregation: 'sum',
      badge: 'Breakdown',
    });
  }

  if (customerCol && salesCol) {
    suggestions.push({
      id: 'sug-gen-5',
      title: 'Customer Distribution',
      description: `Analyze revenue contribution per customer segment.`,
      chartType: 'pie',
      xAxis: customerCol,
      yAxis: salesCol,
      aggregation: 'count',
      badge: 'Customer Insight',
    });
  }

  // Fallback if no specific column match
  if (suggestions.length === 0 && categoricalCols.length > 0) {
    const firstCat = categoricalCols[0].name;
    const firstNum = numericCols.length > 0 ? numericCols[0].name : firstCat;

    suggestions.push({
      id: 'sug-fallback-1',
      title: `${firstCat} Breakdown`,
      description: `Distribution of records by ${firstCat}.`,
      chartType: 'bar',
      xAxis: firstCat,
      yAxis: firstNum,
      aggregation: numericCols.length > 0 ? 'sum' : 'count',
      badge: 'Auto Recommended',
    });

    if (categoricalCols.length > 1) {
      const secondCat = categoricalCols[1].name;
      suggestions.push({
        id: 'sug-fallback-2',
        title: `${secondCat} Overview`,
        description: `Distribution of ${secondCat}.`,
        chartType: 'donut',
        xAxis: secondCat,
        yAxis: firstNum,
        aggregation: 'count',
        badge: 'Overview',
      });
    }
  }

  return suggestions;
}
