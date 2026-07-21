import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ColumnDataType, ColumnMetadata, DatasetSummary } from '../types/dashboard';

/**
 * Detect column data type based on sample values
 */
export function detectColumnType(values: any[]): ColumnDataType {
  const nonNullValues = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== '');

  if (nonNullValues.length === 0) return 'text';

  let booleanCount = 0;
  let numberCount = 0;
  let currencyCount = 0;
  let percentageCount = 0;
  let dateCount = 0;

  const total = nonNullValues.length;

  for (const rawVal of nonNullValues) {
    const val = String(rawVal).trim();

    // Check Boolean
    if (['true', 'false', 'yes', 'no'].includes(val.toLowerCase())) {
      booleanCount++;
      continue;
    }

    // Check Currency (e.g. $100, €50, £10, 100 USD)
    if (/^[\$€£₹]\s?[\d,]+(\.\d+)?$/.test(val) || /^[\d,]+(\.\d+)?\s?[\$€£₹]$/.test(val)) {
      currencyCount++;
      continue;
    }

    // Check Percentage (e.g. 45%, 12.5%)
    if (/^[\d,]+(\.\d+)?\s?%$/.test(val)) {
      percentageCount++;
      continue;
    }

    // Check Date (ISO, US Date format, e.g. 2023-01-15, 01/15/2023, Jan 15 2023)
    if (val.length >= 6 && !isNaN(Date.parse(val)) && (val.includes('/') || val.includes('-') || /[a-zA-Z]/.test(val))) {
      dateCount++;
      continue;
    }

    // Check Plain Number
    const cleanedNum = val.replace(/,/g, '');
    if (!isNaN(Number(cleanedNum)) && cleanedNum !== '') {
      numberCount++;
      continue;
    }
  }

  const threshold = 0.7; // 70% threshold to classify

  if (booleanCount / total >= threshold) return 'boolean';
  if (currencyCount / total >= threshold) return 'currency';
  if (percentageCount / total >= threshold) return 'percentage';
  if (dateCount / total >= threshold) return 'date';
  if (numberCount / total >= threshold) return 'number';

  return 'text';
}

/**
 * Clean numeric string into actual float
 */
export function parseNumericValue(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;

  let str = String(val).trim();
  // Strip currency symbols and percentage
  str = str.replace(/[\$€£₹,%]/g, '');

  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

/**
 * Generate comprehensive summary stats for dataset
 */
export function buildDatasetSummary(
  name: string,
  data: Record<string, any>[],
  fileSizeBytes: number
): DatasetSummary {
  if (!data || data.length === 0) {
    throw new Error('The uploaded dataset is empty.');
  }

  const columnNames = Object.keys(data[0]);
  let totalMissing = 0;

  // Calculate missing values & column metadata
  const columns: ColumnMetadata[] = columnNames.map((col) => {
    const values = data.map((row) => row[col]);
    const nulls = values.filter(
      (v) => v === null || v === undefined || String(v).trim() === '' || String(v) === 'NaN'
    ).length;

    totalMissing += nulls;

    const uniqueSet = new Set(
      values.filter((v) => v !== null && v !== undefined && String(v).trim() !== '').map((v) => String(v))
    );

    const type = detectColumnType(values);

    let min: number | undefined;
    let max: number | undefined;
    let avg: number | undefined;

    if (type === 'number' || type === 'currency' || type === 'percentage') {
      const nums = values.map((v) => parseNumericValue(v)).filter((n): n is number => n !== null);
      if (nums.length > 0) {
        min = Math.min(...nums);
        max = Math.max(...nums);
        avg = nums.reduce((acc, curr) => acc + curr, 0) / nums.length;
      }
    }

    return {
      name: col,
      type,
      sampleValues: values.slice(0, 5),
      uniqueCount: uniqueSet.size,
      nullCount: nulls,
      min: min !== undefined ? Math.round(min * 100) / 100 : undefined,
      max: max !== undefined ? Math.round(max * 100) / 100 : undefined,
      avg: avg !== undefined ? Math.round(avg * 100) / 100 : undefined,
    };
  });

  // Calculate duplicate rows (sample check for performance)
  const rowStrings = data.slice(0, 1000).map((r) => JSON.stringify(r));
  const uniqueRows = new Set(rowStrings);
  const duplicateRowsCount = data.length > 1000 
    ? Math.round(((rowStrings.length - uniqueRows.size) / rowStrings.length) * data.length)
    : rowStrings.length - uniqueRows.size;

  const numericColsCount = columns.filter((c) => ['number', 'currency', 'percentage'].includes(c.type)).length;
  const categoricalColsCount = columns.filter((c) => c.type === 'text' || c.type === 'boolean').length;
  const dateColsCount = columns.filter((c) => c.type === 'date').length;

  return {
    id: 'ds-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    name: name.replace(/\.[^/.]+$/, ''),
    totalRows: data.length,
    totalColumns: columns.length,
    numericColsCount,
    categoricalColsCount,
    dateColsCount,
    missingValuesCount: totalMissing,
    duplicateRowsCount,
    fileSizeBytes,
    columns,
    rawData: data,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Parse File object (.csv, .xlsx, .xls)
 */
export async function parseDatasetFile(file: File): Promise<DatasetSummary> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (!['csv', 'xlsx', 'xls'].includes(extension || '')) {
    throw new Error('Unsupported file format. Please upload a .csv, .xlsx, or .xls file.');
  }

  if (extension === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            if (results.errors && results.errors.length > 0 && results.data.length === 0) {
              return reject(new Error('Failed to parse CSV file: ' + results.errors[0].message));
            }

            const data = results.data as Record<string, any>[];
            const summary = buildDatasetSummary(file.name, data, file.size);
            resolve(summary);
          } catch (err: any) {
            reject(err);
          }
        },
        error: (err) => {
          reject(new Error('CSV parse error: ' + err.message));
        },
      });
    });
  } else {
    // Excel parse (.xlsx, .xls)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const buffer = e.target?.result;
          if (!buffer) return reject(new Error('File reading failed. Buffer is empty.'));

          const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
          const firstSheetName = workbook.SheetNames[0];

          if (!firstSheetName) {
            return reject(new Error('Excel file contains no sheets.'));
          }

          const worksheet = workbook.Sheets[firstSheetName];
          const data = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

          if (data.length === 0) {
            return reject(new Error('Excel sheet is empty.'));
          }

          const summary = buildDatasetSummary(file.name, data, file.size);
          resolve(summary);
        } catch (err: any) {
          reject(new Error('Excel parse error: ' + (err.message || 'Corrupted file.')));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file from disk.'));
      };

      reader.readAsArrayBuffer(file);
    });
  }
}
