import Papa from 'papaparse';
import { buildDatasetSummary } from '../services/dataParser';
import { DatasetSummary, KpiCardConfig, WidgetConfig } from '../types/dashboard';

// Raw CSV string for Bike Buyers
const BIKE_BUYERS_CSV = `ID,Marital Status,Gender,Income,Children,Education,Occupation,Home Owner,Cars,Commute Distance,Region,Age,Purchased Bike
12496,Married,Female,40000,1,Bachelors,Skilled Manual,Yes,0,0-1 Miles,Europe,42,No
24107,Married,Male,30000,3,Partial College,Clerical,Yes,1,0-1 Miles,Europe,43,No
14177,Married,Male,80000,5,Partial College,Professional,No,2,2-5 Miles,Europe,60,No
24381,Single,Male,70000,0,Bachelors,Professional,Yes,1,5-10 Miles,Pacific,41,Yes
25597,Single,Male,30000,0,Bachelors,Clerical,No,0,0-1 Miles,Europe,36,Yes
13507,Married,Female,10000,2,Partial College,Manual,Yes,0,1-2 Miles,Europe,50,No
27974,Single,Male,160000,2,High School,Management,Yes,4,0-1 Miles,Pacific,33,Yes
19364,Married,Male,40000,1,Bachelors,Skilled Manual,Yes,0,0-1 Miles,Europe,43,Yes
22155,Single,Male,20000,2,Partial High School,Clerical,Yes,2,5-10 Miles,Pacific,58,No
19280,Married,Male,30000,2,Partial College,Manual,Yes,1,0-1 Miles,Europe,40,Yes
22173,Married,Female,30000,3,High School,Skilled Manual,No,2,1-2 Miles,Pacific,54,Yes
12697,Single,Female,90000,0,Bachelors,Professional,No,4,10+ Miles,Pacific,36,No
11434,Married,Male,170000,5,Partial College,Professional,Yes,2,0-1 Miles,Europe,55,No
25323,Married,Male,40000,2,Partial College,Clerical,Yes,1,1-2 Miles,Europe,35,Yes
23542,Single,Male,60000,1,Partial College,Skilled Manual,No,1,0-1 Miles,Pacific,45,Yes
20870,Single,Female,10000,2,High School,Manual,Yes,1,0-1 Miles,Europe,38,Yes
23316,Single,Male,30000,3,Partial College,Clerical,No,2,1-2 Miles,Pacific,59,Yes
12610,Married,Female,30000,1,Bachelors,Clerical,Yes,0,0-1 Miles,Europe,47,No
27183,Single,Male,40000,2,Partial College,Clerical,Yes,1,1-2 Miles,Europe,35,Yes
14116,Married,Male,50000,0,Graduate Degree,Management,Yes,1,2-5 Miles,North America,38,Yes
18803,Single,Female,60000,2,Bachelors,Professional,Yes,1,0-1 Miles,North America,40,Yes
28585,Single,Female,80000,0,Bachelors,Professional,No,4,10+ Miles,Pacific,35,No
11028,Single,Male,70000,0,Bachelors,Professional,No,1,5-10 Miles,North America,41,Yes
14702,Married,Female,60000,1,Bachelors,Skilled Manual,Yes,1,1-2 Miles,North America,44,No
18283,Single,Female,10000,0,Partial College,Manual,No,0,0-1 Miles,Europe,37,Yes
21006,Single,Female,10000,2,Partial College,Manual,Yes,0,0-1 Miles,Europe,32,Yes
26967,Single,Male,30000,0,Bachelors,Clerical,Yes,1,0-1 Miles,Europe,39,Yes
20938,Single,Female,30000,0,Bachelors,Clerical,No,0,0-1 Miles,Europe,37,Yes
22736,Single,Female,10000,2,Partial College,Manual,Yes,0,0-1 Miles,Europe,39,Yes
16574,Single,Male,130000,2,High School,Management,Yes,4,0-1 Miles,Pacific,34,No
18005,Single,Female,30000,2,Partial College,Clerical,Yes,1,0-1 Miles,Pacific,48,Yes
12558,Single,Female,60000,2,Bachelors,Professional,Yes,1,0-1 Miles,North America,42,Yes
20088,Married,Female,30000,1,Bachelors,Clerical,Yes,0,0-1 Miles,Europe,46,No
15926,Single,Male,60000,2,Bachelors,Professional,No,2,0-1 Miles,North America,41,Yes
11195,Single,Female,40000,2,High School,Skilled Manual,Yes,1,0-1 Miles,Europe,36,Yes
13953,Single,Male,70000,0,Bachelors,Professional,Yes,1,5-10 Miles,North America,40,Yes
21175,Single,Female,60000,2,Bachelors,Professional,Yes,1,0-1 Miles,North America,43,Yes
28694,Single,Male,10000,0,Partial College,Manual,No,0,0-1 Miles,Europe,35,Yes
13867,Married,Male,60000,1,Bachelors,Skilled Manual,Yes,1,1-2 Miles,North America,45,No
14578,Single,Male,30000,0,Bachelors,Clerical,Yes,0,0-1 Miles,Europe,38,Yes
`;

// Raw CSV string for Superstore Sales
const SUPERSTORE_CSV = `Order ID,Order Date,Ship Mode,Customer Name,Segment,Country,City,State,Region,Category,Sub-Category,Product Name,Sales,Quantity,Discount,Profit
CA-2023-152156,2023-11-08,Second Class,Claire Gute,Consumer,United States,Henderson,Kentucky,South,Furniture,Bookcases,Bush Somerset Collection Bookcase,261.96,2,0,41.91
CA-2023-152156,2023-11-08,Second Class,Claire Gute,Consumer,United States,Henderson,Kentucky,South,Furniture,Chairs,Hon Deluxe Fabric Mid-Back Chair,731.94,3,0,219.58
CA-2023-138688,2023-06-12,Second Class,Darrin Van Huff,Corporate,United States,Los Angeles,California,West,Office Supplies,Labels,Self-Adhesive Address Labels,14.62,2,0,6.87
US-2023-108966,2023-10-11,Standard Class,Sean O'Donnell,Consumer,United States,Fort Lauderdale,Florida,South,Furniture,Tables,Bretford CR4500 Series Conference Table,957.57,5,0.45,-766.06
US-2023-108966,2023-10-11,Standard Class,Sean O'Donnell,Consumer,United States,Fort Lauderdale,Florida,South,Office Supplies,Storage,Eldon Fold 'N Roll Cart,22.37,2,0.2,2.52
CA-2023-115812,2023-06-09,Standard Class,Brosina Hoffman,Consumer,United States,Los Angeles,California,West,Furniture,Furnishings,Eldon Expressions Wood Desk Accessories,48.86,7,0,14.17
CA-2023-115812,2023-06-09,Standard Class,Brosina Hoffman,Consumer,United States,Los Angeles,California,West,Office Supplies,Art,Newell 322,7.28,4,0,1.97
CA-2023-115812,2023-06-09,Standard Class,Brosina Hoffman,Consumer,United States,Los Angeles,California,West,Technology,Phones,Mitel 5320 IP Phone,907.15,5,0.2,90.72
CA-2023-115812,2023-06-09,Standard Class,Brosina Hoffman,Consumer,United States,Los Angeles,California,West,Office Supplies,Binders,DXL Angle-View Binders,18.50,3,0.2,5.78
CA-2023-115812,2023-06-09,Standard Class,Brosina Hoffman,Consumer,United States,Los Angeles,California,West,Office Supplies,Appliances,Belkin F5C206VTEL Surge Protector,114.90,5,0,34.47
CA-2023-115812,2023-06-09,Standard Class,Brosina Hoffman,Consumer,United States,Los Angeles,California,West,Furniture,Tables,Chromcraft Rectangular Conference Table,1706.18,9,0.2,85.31
CA-2023-115812,2023-06-09,Standard Class,Brosina Hoffman,Consumer,United States,Los Angeles,California,West,Technology,Phones,Konftel 300WX Conference Phone,911.42,4,0.2,68.36
CA-2023-114412,2023-04-15,Paper,Pete Kriz,Consumer,United States,Concord,North Carolina,South,Office Supplies,Paper,Xerox 1967,15.55,2,0.2,5.44
CA-2023-161389,2023-12-05,Standard Class,Irene Maddox,Consumer,United States,Seattle,Washington,West,Office Supplies,Binders,Fellowes PB200 Plastic Comb Binding Machine,407.98,3,0.2,132.59
US-2023-118983,2023-11-22,Standard Class,Harold Pawluk,Corporate,United States,Fort Worth,Texas,Central,Office Supplies,Appliances,Holmes Replacement Filter,68.81,5,0.8,-123.86
US-2023-118983,2023-11-22,Standard Class,Harold Pawluk,Corporate,United States,Fort Worth,Texas,Central,Furniture,Chairs,Novimex Executive Leather Armchair,254.40,3,0.3,-18.17
CA-2023-105893,2023-11-11,Standard Class,PK Ramadoss,Consumer,United States,Madison,Wisconsin,Central,Office Supplies,Storage,Starex Micro-Cut Shredder,665.88,6,0,133.18
CA-2023-167168,2023-05-13,Second Class,Alejandro Grove,Consumer,United States,West Jordan,Utah,West,Office Supplies,Storage,Fellowes Super Stacker Storage Boxes,55.50,2,0,9.99
CA-2023-143336,2023-08-27,Second Class,Zuschuss Donatelli,Consumer,United States,San Francisco,California,West,Office Supplies,Art,Newell 341,8.56,2,0,2.48
CA-2023-143336,2023-08-27,Second Class,Zuschuss Donatelli,Consumer,United States,San Francisco,California,West,Technology,Phones,Cisco SPA 501G IP Phone,213.48,3,0.2,16.01
CA-2023-143336,2023-08-27,Second Class,Zuschuss Donatelli,Consumer,United States,San Francisco,California,West,Office Supplies,Binders,Wilson Jones Loose Leaf Binders,22.72,4,0.2,7.38
CA-2023-137330,2023-12-09,Standard Class,Ken Black,Corporate,United States,Fremont,Nebraska,Central,Office Supplies,Art,Newell 318,19.46,7,0,5.06
CA-2023-137330,2023-12-09,Standard Class,Ken Black,Corporate,United States,Fremont,Nebraska,Central,Office Supplies,Appliances,Acco Smartek Paper Clips,60.34,7,0,15.69
`;

export function getDemoBikeSalesDataset(): {
  summary: DatasetSummary;
  widgets: WidgetConfig[];
  kpis: KpiCardConfig[];
} {
  const parsed = Papa.parse(BIKE_BUYERS_CSV, { header: true, dynamicTyping: true }).data as Record<string, any>[];
  const summary = buildDatasetSummary('Bike Sales Dashboard', parsed, 87182);

  const widgets: WidgetConfig[] = [
    {
      id: 'w-bike-1',
      title: 'Average Income by Occupation',
      chartType: 'bar',
      xAxis: 'Occupation',
      yAxis: 'Income',
      groupBy: 'Purchased Bike',
      aggregation: 'avg',
      colSpan: 2,
    },
    {
      id: 'w-bike-2',
      title: 'Purchased Bike Distribution',
      chartType: 'donut',
      xAxis: 'Purchased Bike',
      yAxis: 'Income',
      aggregation: 'count',
      colSpan: 2,
    },
    {
      id: 'w-bike-3',
      title: 'Age Brackets & Occupation',
      chartType: 'horizontal-bar',
      xAxis: 'Occupation',
      yAxis: 'Age',
      aggregation: 'avg',
      colSpan: 2,
    },
    {
      id: 'w-bike-4',
      title: 'Region Breakdown',
      chartType: 'stacked-bar',
      xAxis: 'Region',
      yAxis: 'Income',
      groupBy: 'Purchased Bike',
      aggregation: 'count',
      colSpan: 2,
    },
  ];

  const kpis: KpiCardConfig[] = [
    {
      id: 'kpi-1',
      title: 'Average Income',
      column: 'Income',
      aggregation: 'avg',
      iconName: 'DollarSign',
      prefix: '$',
      color: 'emerald',
    },
    {
      id: 'kpi-2',
      title: 'Total Customers',
      column: 'ID',
      aggregation: 'count',
      iconName: 'Users',
      color: 'blue',
    },
    {
      id: 'kpi-3',
      title: 'Max Income',
      column: 'Income',
      aggregation: 'max',
      iconName: 'TrendingUp',
      prefix: '$',
      color: 'purple',
    },
    {
      id: 'kpi-4',
      title: 'Average Age',
      column: 'Age',
      aggregation: 'avg',
      iconName: 'Calendar',
      suffix: ' yrs',
      color: 'amber',
    },
  ];

  return { summary, widgets, kpis };
}

export function getDemoSuperstoreDataset(): {
  summary: DatasetSummary;
  widgets: WidgetConfig[];
  kpis: KpiCardConfig[];
} {
  const parsed = Papa.parse(SUPERSTORE_CSV, { header: true, dynamicTyping: true }).data as Record<string, any>[];
  const summary = buildDatasetSummary('Superstore Sales', parsed, 124500);

  const widgets: WidgetConfig[] = [
    {
      id: 'w-super-1',
      title: 'Sales over Time',
      chartType: 'area',
      xAxis: 'Order Date',
      yAxis: 'Sales',
      aggregation: 'sum',
      colSpan: 2,
    },
    {
      id: 'w-super-2',
      title: 'Sales by Category',
      chartType: 'donut',
      xAxis: 'Category',
      yAxis: 'Sales',
      aggregation: 'sum',
      colSpan: 2,
    },
    {
      id: 'w-super-3',
      title: 'Profit by Region',
      chartType: 'horizontal-bar',
      xAxis: 'Region',
      yAxis: 'Profit',
      aggregation: 'sum',
      colSpan: 2,
    },
    {
      id: 'w-super-4',
      title: 'Segment Performance',
      chartType: 'bar',
      xAxis: 'Segment',
      yAxis: 'Sales',
      groupBy: 'Category',
      aggregation: 'sum',
      colSpan: 2,
    },
  ];

  const kpis: KpiCardConfig[] = [
    {
      id: 'kpi-s-1',
      title: 'Total Sales',
      column: 'Sales',
      aggregation: 'sum',
      iconName: 'DollarSign',
      prefix: '$',
      color: 'emerald',
    },
    {
      id: 'kpi-s-2',
      title: 'Total Profit',
      column: 'Profit',
      aggregation: 'sum',
      iconName: 'TrendingUp',
      prefix: '$',
      color: 'blue',
    },
    {
      id: 'kpi-s-3',
      title: 'Total Orders',
      column: 'Order ID',
      aggregation: 'distinct',
      iconName: 'ShoppingBag',
      color: 'purple',
    },
    {
      id: 'kpi-s-4',
      title: 'Avg Discount',
      column: 'Discount',
      aggregation: 'avg',
      iconName: 'Percent',
      suffix: '%',
      color: 'rose',
    },
  ];

  return { summary, widgets, kpis };
}
