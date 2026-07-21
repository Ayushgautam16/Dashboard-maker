import os
import re
import json
import io
import math
from flask import Flask, render_template, request, jsonify, send_from_directory
import pandas as pd
import numpy as np

app = Flask(__name__, template_folder='templates', static_folder='static')

# Helper: Detect column data type
def detect_column_type(series):
    non_nulls = series.dropna().astype(str).str.strip()
    if len(non_nulls) == 0:
        return 'text'

    total = len(non_nulls)
    
    # Check boolean
    lower_vals = non_nulls.str.lower()
    bool_matches = lower_vals.isin(['true', 'false', 'yes', 'no', '1', '0']).sum()
    if bool_matches / total >= 0.8:
        return 'boolean'

    # Check currency ($100, €50, £10, 100 USD)
    currency_matches = non_nulls.str.contains(r'^[\$€£₹]\s?[\d,]+(\.\d+)?$|^[\d,]+(\.\d+)?\s?[\$€£₹]$', regex=True).sum()
    if currency_matches / total >= 0.7:
        return 'currency'

    # Check percentage (45%, 12.5%)
    perc_matches = non_nulls.str.contains(r'^[\d,]+(\.\d+)?\s?%$', regex=True).sum()
    if perc_matches / total >= 0.7:
        return 'percentage'

    # Check date
    date_matches = 0
    for val in non_nulls.iloc[:50]:
        if len(val) >= 6 and ('/' in val or '-' in val or any(c.isalpha() for c in val)):
            try:
                pd.to_datetime(val)
                date_matches += 1
            except:
                pass
    if date_matches / min(total, 50) >= 0.6:
        return 'date'

    # Check numeric
    numeric_converted = pd.to_numeric(non_nulls.str.replace(r'[\$€£₹,%]', '', regex=True), errors='coerce')
    if numeric_converted.notnull().sum() / total >= 0.8:
        return 'number'

    return 'text'

# Helper: Build dataset summary
def analyze_dataframe(df, filename, file_size=0):
    total_rows = len(df)
    total_cols = len(df.columns)
    
    # Replace NaN with None for JSON serialization
    df_clean = df.where(pd.notnull(df), None)
    
    columns_meta = []
    numeric_count = 0
    categorical_count = 0
    date_count = 0
    missing_values_count = int(df.isnull().sum().sum())
    duplicate_rows_count = int(df.duplicated().sum())

    for col in df.columns:
        col_type = detect_column_type(df[col])
        sample_vals = df[col].dropna().head(5).tolist()
        unique_cnt = int(df[col].nunique())
        null_cnt = int(df[col].isnull().sum())

        col_meta = {
            'name': str(col),
            'type': col_type,
            'sampleValues': sample_vals,
            'uniqueCount': unique_cnt,
            'nullCount': null_cnt
        }

        if col_type in ['number', 'currency', 'percentage']:
            numeric_count += 1
            nums = pd.to_numeric(df[col].astype(str).str.replace(r'[\$€£₹,%]', '', regex=True), errors='coerce').dropna()
            if len(nums) > 0:
                col_meta['min'] = round(float(nums.min()), 2)
                col_meta['max'] = round(float(nums.max()), 2)
                col_meta['avg'] = round(float(nums.mean()), 2)
        elif col_type == 'date':
            date_count += 1
        else:
            categorical_count += 1

        columns_meta.append(col_meta)

    # Convert records to JSON-friendly list of dicts
    records = df_clean.to_dict(orient='records')

    return {
        'id': f"ds-{os.urandom(4).hex()}",
        'name': os.path.splitext(filename)[0],
        'totalRows': total_rows,
        'totalColumns': total_cols,
        'numericColsCount': numeric_count,
        'categoricalColsCount': categorical_count,
        'dateColsCount': date_count,
        'missingValuesCount': missing_values_count,
        'duplicateRowsCount': duplicate_rows_count,
        'fileSizeBytes': file_size,
        'columns': columns_meta,
        'rawData': records
    }

# Smart Recommendation Engine
def get_recommendations(summary):
    cols = [c['name'] for c in summary['columns']]
    cols_lower = [c.lower() for c in cols]

    def find_col(terms):
        for c in summary['columns']:
            if any(t in c['name'].lower() for t in terms):
                return c['name']
        return None

    is_bike = 'purchased bike' in cols_lower or ('income' in cols_lower and 'occupation' in cols_lower)

    if is_bike:
        purchased_bike = find_col(['purchased bike', 'purchased']) or 'Purchased Bike'
        income = find_col(['income']) or 'Income'
        occupation = find_col(['occupation']) or 'Occupation'
        age = find_col(['age']) or 'Age'
        region = find_col(['region']) or 'Region'
        gender = find_col(['gender']) or 'Gender'

        return [
            {
                'id': 'sug-1',
                'title': 'Average Income vs Purchased Bike',
                'description': 'Compare income levels for bike purchasers vs non-purchasers.',
                'chartType': 'bar',
                'xAxis': purchased_bike,
                'yAxis': income,
                'aggregation': 'avg',
                'badge': 'Bike Special'
            },
            {
                'id': 'sug-2',
                'title': 'Purchased Bike Distribution',
                'description': 'Overall share of bike buyers.',
                'chartType': 'donut',
                'xAxis': purchased_bike,
                'yAxis': purchased_bike,
                'aggregation': 'count',
                'badge': 'Distribution'
            },
            {
                'id': 'sug-3',
                'title': 'Income by Occupation',
                'description': 'Average salary split by job category and bike purchase.',
                'chartType': 'grouped-bar',
                'xAxis': occupation,
                'yAxis': income,
                'groupBy': purchased_bike,
                'aggregation': 'avg',
                'badge': 'Occupation'
            },
            {
                'id': 'sug-4',
                'title': 'Region Breakdown',
                'description': 'Geographical distribution of customers.',
                'chartType': 'stacked-bar',
                'xAxis': region,
                'yAxis': income,
                'groupBy': purchased_bike,
                'aggregation': 'count',
                'badge': 'Regional'
            }
        ]

    # General datasets
    sales_col = find_col(['sales', 'revenue', 'amount'])
    profit_col = find_col(['profit', 'margin'])
    cat_col = find_col(['category', 'product', 'type', 'segment'])
    date_col = find_col(['date', 'time', 'year'])
    region_col = find_col(['region', 'country', 'state'])

    sugs = []
    if sales_col and date_col:
        sugs.append({
            'id': 'gen-1',
            'title': 'Sales over Time',
            'description': f'Trend of {sales_col} over {date_col}.',
            'chartType': 'area',
            'xAxis': date_col,
            'yAxis': sales_col,
            'aggregation': 'sum',
            'badge': 'Time Series'
        })
    if sales_col and region_col:
        sugs.append({
            'id': 'gen-2',
            'title': 'Revenue by Region',
            'description': f'Breakdown of {sales_col} by {region_col}.',
            'chartType': 'bar',
            'xAxis': region_col,
            'yAxis': sales_col,
            'aggregation': 'sum',
            'badge': 'Regional'
        })
    if profit_col and cat_col:
        sugs.append({
            'id': 'gen-3',
            'title': 'Profit by Category',
            'description': f'Compare {profit_col} across {cat_col}.',
            'chartType': 'horizontal-bar',
            'xAxis': cat_col,
            'yAxis': profit_col,
            'aggregation': 'sum',
            'badge': 'Category'
        })

    if len(sugs) == 0:
        first_cat = find_col(['text', 'name', 'id']) or cols[0]
        num_cols = [c['name'] for c in summary['columns'] if c['type'] in ['number', 'currency']]
        first_num = num_cols[0] if len(num_cols) > 0 else first_cat
        sugs.append({
            'id': 'gen-default',
            'title': f'{first_cat} Overview',
            'description': f'Distribution of records by {first_cat}.',
            'chartType': 'bar',
            'xAxis': first_cat,
            'yAxis': first_num,
            'aggregation': 'sum' if len(num_cols) > 0 else 'count',
            'badge': 'Auto Generated'
        })

    return sugs

# AI Prompt Interpreter
def interpret_ai_prompt(prompt, summary):
    p = prompt.lower().strip()
    cols = [c['name'] for c in summary['columns']]
    num_cols = [c['name'] for c in summary['columns'] if c['type'] in ['number', 'currency', 'percentage']]
    cat_cols = [c['name'] for c in summary['columns'] if c['type'] in ['text', 'boolean']]

    # Aggregation
    agg = 'sum'
    if 'avg' in p or 'average' in p or 'mean' in p:
        agg = 'avg'
    elif 'count' in p or 'number of' in p or 'distribution' in p:
        agg = 'count'
    elif 'max' in p or 'highest' in p:
        agg = 'max'
    elif 'min' in p or 'lowest' in p:
        agg = 'min'

    # Chart Type
    chart_type = 'bar'
    if 'trend' in p or 'over time' in p or 'monthly' in p:
        chart_type = 'line' if not 'area' in p else 'area'
    elif 'pie' in p or 'donut' in p or 'share' in p:
        chart_type = 'donut' if 'donut' in p else 'pie'
    elif 'horizontal' in p:
        chart_type = 'horizontal-bar'
    elif 'stacked' in p:
        chart_type = 'stacked-bar'

    # Match X & Y
    matched_x = None
    for c in cols:
        if c.lower() in p:
            matched_x = c
            break

    x_axis = matched_x or (cat_cols[0] if len(cat_cols) > 0 else cols[0])
    y_axis = num_cols[0] if len(num_cols) > 0 else x_axis

    for c in num_cols:
        if c.lower() in p and c != x_axis:
            y_axis = c
            break

    group_by = None
    if 'gender' in p:
        group_by = next((c for c in cols if 'gender' in c.lower()), None)
    elif 'purchased' in p or 'bike' in p:
        group_by = next((c for c in cols if 'purchased' in c.lower()), None)

    widget = {
        'id': f"w-ai-{os.urandom(4).hex()}",
        'title': f"{agg.upper()} of {y_axis} by {x_axis}",
        'chartType': chart_type,
        'xAxis': x_axis,
        'yAxis': y_axis,
        'groupBy': group_by,
        'aggregation': agg,
        'colSpan': 2
    }

    explanation = f"Generated a {chart_type.upper()} chart plotting {y_axis} ({agg.upper()}) against {x_axis}"
    if group_by:
        explanation += f" grouped by {group_by}."
    else:
        explanation += "."

    return {'explanation': explanation, 'widget': widget}

# API Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded.'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename.'}), 400

    ext = file.filename.split('.')[-1].lower()
    if ext not in ['csv', 'xlsx', 'xls']:
        return jsonify({'error': 'Invalid file format. Please upload .xlsx, .xls, or .csv'}), 400

    try:
        file_bytes = file.read()
        file_size = len(file_bytes)

        if ext == 'csv':
            df = pd.read_csv(io.BytesIO(file_bytes))
        else:
            df = pd.read_excel(io.BytesIO(file_bytes))

        if df.empty:
            return jsonify({'error': 'Dataset is empty.'}), 400

        summary = analyze_dataframe(df, file.filename, file_size)
        recommendations = get_recommendations(summary)

        return jsonify({'summary': summary, 'recommendations': recommendations})

    except Exception as e:
        return jsonify({'error': f"Failed to parse dataset: {str(e)}"}), 500

@app.route('/api/demo/<name>')
def get_demo(name):
    try:
        if name == 'bike':
            bike_path = os.path.join(os.path.dirname(__file__), 'bike_buyers.csv')
            if os.path.exists(bike_path):
                df = pd.read_csv(bike_path)
            else:
                return jsonify({'error': 'bike_buyers.csv not found locally.'}), 404
            
            summary = analyze_dataframe(df, 'Bike Sales Dashboard.csv', os.path.getsize(bike_path))
            recommendations = get_recommendations(summary)
            return jsonify({'summary': summary, 'recommendations': recommendations})
        
        elif name == 'superstore':
            data = [
                {"Order ID": "CA-2023-152156", "Order Date": "2023-11-08", "Customer Name": "Claire Gute", "Segment": "Consumer", "Region": "South", "Category": "Furniture", "Sub-Category": "Bookcases", "Sales": 261.96, "Quantity": 2, "Discount": 0.0, "Profit": 41.91},
                {"Order ID": "CA-2023-152156", "Order Date": "2023-11-08", "Customer Name": "Claire Gute", "Segment": "Consumer", "Region": "South", "Category": "Furniture", "Sub-Category": "Chairs", "Sales": 731.94, "Quantity": 3, "Discount": 0.0, "Profit": 219.58},
                {"Order ID": "CA-2023-138688", "Order Date": "2023-06-12", "Customer Name": "Darrin Van Huff", "Segment": "Corporate", "Region": "West", "Category": "Office Supplies", "Sub-Category": "Labels", "Sales": 14.62, "Quantity": 2, "Discount": 0.0, "Profit": 6.87},
                {"Order ID": "US-2023-108966", "Order Date": "2023-10-11", "Customer Name": "Sean O'Donnell", "Segment": "Consumer", "Region": "South", "Category": "Furniture", "Sub-Category": "Tables", "Sales": 957.57, "Quantity": 5, "Discount": 0.45, "Profit": -766.06},
                {"Order ID": "CA-2023-115812", "Order Date": "2023-06-09", "Customer Name": "Brosina Hoffman", "Segment": "Consumer", "Region": "West", "Category": "Technology", "Sub-Category": "Phones", "Sales": 907.15, "Quantity": 5, "Discount": 0.2, "Profit": 90.72},
                {"Order ID": "CA-2023-115812", "Order Date": "2023-06-09", "Customer Name": "Brosina Hoffman", "Segment": "Consumer", "Region": "West", "Category": "Office Supplies", "Sub-Category": "Binders", "Sales": 18.50, "Quantity": 3, "Discount": 0.2, "Profit": 5.78},
                {"Order ID": "CA-2023-161389", "Order Date": "2023-12-05", "Customer Name": "Irene Maddox", "Segment": "Consumer", "Region": "West", "Category": "Office Supplies", "Sub-Category": "Binders", "Sales": 407.98, "Quantity": 3, "Discount": 0.2, "Profit": 132.59},
                {"Order ID": "US-2023-118983", "Order Date": "2023-11-22", "Customer Name": "Harold Pawluk", "Segment": "Corporate", "Region": "Central", "Category": "Furniture", "Sub-Category": "Chairs", "Sales": 254.40, "Quantity": 3, "Discount": 0.3, "Profit": -18.17}
            ]
            df = pd.DataFrame(data)
            summary = analyze_dataframe(df, 'Superstore Sales.csv', 12000)
            recommendations = get_recommendations(summary)
            return jsonify({'summary': summary, 'recommendations': recommendations})

        return jsonify({'error': 'Unknown demo dataset.'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai', methods=['POST'])
def ai_prompt():
    data = request.json or {}
    prompt = data.get('prompt', '')
    summary = data.get('summary')

    if not prompt or not summary:
        return jsonify({'error': 'Prompt and dataset summary are required.'}), 400

    result = interpret_ai_prompt(prompt, summary)
    return jsonify(result)

if __name__ == '__main__':
    print("🚀 Starting Excel Dashboard Generator Python Server on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
