import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { FilterState } from '../types/dashboard';
import { applyGlobalFilters } from './chartDataProcessor';

/**
 * Export full dashboard element to PNG
 */
export async function exportDashboardToPng(containerId: string, filename = 'dashboard.png') {
  const elem = document.getElementById(containerId);
  if (!elem) throw new Error('Dashboard element not found for export.');

  const canvas = await html2canvas(elem, {
    scale: 2,
    useCORS: true,
    backgroundColor: document.documentElement.classList.contains('dark') ? '#090d16' : '#ffffff',
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Export dashboard to PDF
 */
export async function exportDashboardToPdf(containerId: string, filename = 'dashboard.pdf') {
  const elem = document.getElementById(containerId);
  if (!elem) throw new Error('Dashboard element not found for PDF export.');

  const canvas = await html2canvas(elem, {
    scale: 2,
    useCORS: true,
    backgroundColor: document.documentElement.classList.contains('dark') ? '#090d16' : '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save(filename);
}

/**
 * Export dataset to Excel (.xlsx)
 */
export function exportToExcel(rawData: Record<string, any>[], filters: FilterState[], filename = 'dataset_export.xlsx') {
  const filtered = applyGlobalFilters(rawData, filters);
  const worksheet = XLSX.utils.json_to_sheet(filtered);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Filtered Data');
  XLSX.writeFile(workbook, filename);
}

/**
 * Export dataset to CSV
 */
export function exportToCsv(rawData: Record<string, any>[], filters: FilterState[], filename = 'dataset_export.csv') {
  const filtered = applyGlobalFilters(rawData, filters);
  const csv = Papa.unparse(filtered);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
