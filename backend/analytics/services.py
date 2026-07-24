from pathlib import Path
from decimal import Decimal
from datetime import date, datetime

import numpy as np
import pandas as pd

from django.conf import settings

from .models import Dataset, DatasetRecord


def native_value(value):
    if value is None:
        return None
    if isinstance(value, (pd.Timestamp, datetime, date)):
        return value.isoformat()
    if pd.isna(value):
        return None
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, np.generic):
        return value.item()
    if hasattr(value, 'item'):
        try:
            return value.item()
        except Exception:
            pass
    return value


def clean_dataframe(df):
    return df.map(native_value)


def detect_column_type(series):
    non_nulls = series.dropna().astype(str).str.strip()
    if non_nulls.empty:
        return 'text'

    total = len(non_nulls)
    lower_vals = non_nulls.str.lower()
    bool_matches = lower_vals.isin(['true', 'false', 'yes', 'no', '1', '0']).sum()
    if bool_matches / total >= 0.8:
        return 'boolean'

    currency_matches = non_nulls.str.contains(r'^[\$€£₹]\s?[\d,]+(\.\d+)?$|^[\d,]+(\.\d+)?\s?[\$€£₹]$', regex=True).sum()
    if currency_matches / total >= 0.7:
        return 'currency'

    percentage_matches = non_nulls.str.contains(r'^[\d,]+(\.\d+)?\s?%$', regex=True).sum()
    if percentage_matches / total >= 0.7:
        return 'percentage'

    date_matches = 0
    sample_count = min(total, 50)
    for value in non_nulls.iloc[:sample_count]:
        try:
            pd.to_datetime(value)
            date_matches += 1
        except Exception:
            continue
    if sample_count and date_matches / sample_count >= 0.6:
        return 'date'

    numeric_values = pd.to_numeric(non_nulls.str.replace(r'[\$€£₹,%]', '', regex=True), errors='coerce')
    if numeric_values.notna().sum() / total >= 0.8:
        return 'number'

    return 'text'


def build_chart_payloads(df):
    charts = []
    clean = clean_dataframe(df)
    categorical_cols = [column for column in clean.columns if detect_column_type(clean[column]) in ['text', 'boolean']]
    numeric_cols = [column for column in clean.columns if detect_column_type(clean[column]) in ['number', 'currency', 'percentage']]
    date_cols = [column for column in clean.columns if detect_column_type(clean[column]) == 'date']

    if categorical_cols and numeric_cols:
        category = categorical_cols[0]
        measure = numeric_cols[0]
        grouped = (
            clean.groupby(category, dropna=False)[measure]
            .sum(numeric_only=True)
            .reset_index()
            .sort_values(measure, ascending=False)
            .head(10)
        )
        charts.append({
            'id': 'category-bar',
            'title': f'{measure} by {category}',
            'type': 'bar',
            'xKey': category,
            'yKey': measure,
            'data': grouped.to_dict(orient='records'),
        })

        pie_values = clean[category].fillna('Unknown').value_counts().head(8).reset_index()
        pie_values.columns = ['name', 'value']
        charts.append({
            'id': 'category-pie',
            'title': f'{category} distribution',
            'type': 'pie',
            'data': pie_values.to_dict(orient='records'),
        })

    if date_cols and numeric_cols:
        date_column = date_cols[0]
        measure = numeric_cols[0]
        timeline = clean[[date_column, measure]].copy()
        timeline[date_column] = pd.to_datetime(timeline[date_column], errors='coerce')
        timeline = timeline.dropna(subset=[date_column])
        if not timeline.empty:
            timeline['bucket'] = timeline[date_column].dt.to_period('M').astype(str)
            grouped = timeline.groupby('bucket', as_index=False)[measure].sum()
            charts.append({
                'id': 'timeline-line',
                'title': f'{measure} over time',
                'type': 'line',
                'xKey': 'bucket',
                'yKey': measure,
                'data': grouped.to_dict(orient='records'),
            })

    return charts[:3]


def build_dataset_summary(df, name, source_name='', file_size=0):
    clean = clean_dataframe(df)
    columns_meta = []
    numeric_count = 0
    categorical_count = 0
    date_count = 0

    for column in clean.columns:
        detected_type = detect_column_type(clean[column])
        sample_values = [native_value(value) for value in clean[column].dropna().head(5).tolist()]
        meta = {
            'name': str(column),
            'type': detected_type,
            'sampleValues': sample_values,
            'uniqueCount': int(clean[column].nunique(dropna=True)),
            'nullCount': int(clean[column].isna().sum()),
        }

        if detected_type in ['number', 'currency', 'percentage']:
            numeric_count += 1
            numeric_values = pd.to_numeric(clean[column].astype(str).str.replace(r'[\$€£₹,%]', '', regex=True), errors='coerce').dropna()
            if not numeric_values.empty:
                meta['min'] = round(float(numeric_values.min()), 2)
                meta['max'] = round(float(numeric_values.max()), 2)
                meta['avg'] = round(float(numeric_values.mean()), 2)
        elif detected_type == 'date':
            date_count += 1
        else:
            categorical_count += 1

        columns_meta.append(meta)

    return {
        'name': name,
        'sourceName': source_name,
        'totalRows': int(len(clean)),
        'totalColumns': int(len(clean.columns)),
        'numericColsCount': numeric_count,
        'categoricalColsCount': categorical_count,
        'dateColsCount': date_count,
        'missingValuesCount': int(df.isna().sum().sum()),
        'duplicateRowsCount': int(df.duplicated().sum()),
        'fileSizeBytes': int(file_size),
        'columns': columns_meta,
        'sampleRows': clean.head(20).to_dict(orient='records'),
    }


def dataframe_from_uploaded_file(uploaded_file):
    file_name = uploaded_file.name.lower()
    if file_name.endswith('.csv'):
        return pd.read_csv(uploaded_file)
    if file_name.endswith('.xls') or file_name.endswith('.xlsx'):
        return pd.read_excel(uploaded_file)
    raise ValueError('Only CSV, XLS, and XLSX files are supported.')


def dataframe_from_dataset(dataset):
    rows = list(dataset.records.values_list('data', flat=True))
    if not rows:
        return pd.DataFrame()
    return pd.DataFrame(rows)


def persist_dataframe(df, name, source_name='', file_type='', file_size=0):
    summary = build_dataset_summary(df, name=name, source_name=source_name, file_size=file_size)
    chart_config = build_chart_payloads(df)
    dataset = Dataset.objects.create(
        name=name,
        source_name=source_name,
        file_type=file_type,
        row_count=summary['totalRows'],
        column_count=summary['totalColumns'],
        summary=summary,
        chart_config=chart_config,
    )

    clean = clean_dataframe(df)
    records = [
        DatasetRecord(dataset=dataset, row_number=index + 1, data={key: native_value(value) for key, value in row.items()})
        for index, row in enumerate(clean.to_dict(orient='records'))
    ]
    DatasetRecord.objects.bulk_create(records, batch_size=500)
    return dataset


def create_dataset_from_uploaded_file(uploaded_file):
    dataframe = dataframe_from_uploaded_file(uploaded_file)
    file_type = Path(uploaded_file.name).suffix.lower().lstrip('.')
    dataset_name = Path(uploaded_file.name).stem.replace('_', ' ').replace('-', ' ').title()
    return persist_dataframe(
        dataframe,
        name=dataset_name,
        source_name=uploaded_file.name,
        file_type=file_type,
        file_size=getattr(uploaded_file, 'size', 0),
    )


def create_demo_dataset_from_csv():
    demo_path = settings.BASE_DIR.parent / 'bike_buyers_clean.csv'
    dataframe = pd.read_csv(demo_path)
    return persist_dataframe(
        dataframe,
        name='Bike Buyers Demo',
        source_name='bike_buyers_clean.csv',
        file_type='csv',
        file_size=demo_path.stat().st_size,
    )


def query_dataset(dataset, x_axis, y_axis, aggregation='sum', filters=None, group_by=None):
    df = dataframe_from_dataset(dataset)
    if df.empty:
        return []

    # Apply filters
    if filters:
        for col, values in filters.items():
            if col in df.columns and values is not None:
                if isinstance(values, list):
                    df = df[df[col].astype(str).isin([str(v) for v in values])]
                else:
                    df = df[df[col].astype(str) == str(values)]

    if x_axis not in df.columns:
        return []

    # Aggregation mapping
    agg_func = 'sum'
    agg = aggregation.lower()
    if agg in ['avg', 'average', 'mean']:
        agg_func = 'mean'
    elif agg == 'min':
        agg_func = 'min'
    elif agg == 'max':
        agg_func = 'max'
    elif agg in ['count', 'size']:
        agg_func = 'count'
    elif agg in ['distinct', 'distinct_count', 'count_distinct']:
        agg_func = 'nunique'

    # Prepare visual measure column (Y-axis)
    if y_axis and y_axis in df.columns and y_axis != x_axis:
        if agg_func != 'count':
            # Strip currency/special characters to convert to numeric safely
            cleaned_series = df[y_axis].astype(str).str.replace(r'[\$€£₹,%]', '', regex=True)
            df[y_axis] = pd.to_numeric(cleaned_series, errors='coerce')
    else:
        y_axis = x_axis
        agg_func = 'count'

    group_cols = [x_axis]
    if group_by and group_by in df.columns and group_by != x_axis:
        group_cols.append(group_by)

    # Aggregate
    if agg_func == 'count':
        agg_result = df.groupby(group_cols).size().reset_index(name='value')
    else:
        agg_result = df.groupby(group_cols)[y_axis].agg(agg_func).reset_index()
        agg_result.rename(columns={y_axis: 'value'}, inplace=True)

    agg_result = clean_dataframe(agg_result)
    return agg_result.to_dict(orient='records')

