import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Image, FileCode } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';
import {
  exportDashboardToPdf,
  exportDashboardToPng,
  exportToCsv,
  exportToExcel,
} from '../../services/exportService';

export const ExportMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { dataset, filters } = useDashboardStore();

  if (!dataset) return null;

  const handleExportPng = async () => {
    setIsOpen(false);
    try {
      await exportDashboardToPng('dashboard-workspace', `${dataset.name}_dashboard.png`);
    } catch (err: any) {
      alert('Export PNG error: ' + err.message);
    }
  };

  const handleExportPdf = async () => {
    setIsOpen(false);
    try {
      await exportDashboardToPdf('dashboard-workspace', `${dataset.name}_dashboard.pdf`);
    } catch (err: any) {
      alert('Export PDF error: ' + err.message);
    }
  };

  const handleExportExcel = () => {
    setIsOpen(false);
    exportToExcel(dataset.rawData, filters, `${dataset.name}_filtered.xlsx`);
  };

  const handleExportCsv = () => {
    setIsOpen(false);
    exportToCsv(dataset.rawData, filters, `${dataset.name}_filtered.csv`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all hover:scale-105 active:scale-95"
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel bg-slate-900/95 border border-slate-700/60 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="text-[11px] font-bold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
            Export Visuals
          </div>

          <button
            onClick={handleExportPng}
            className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800/80 rounded-xl flex items-center gap-2.5 transition"
          >
            <Image className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="font-semibold">Dashboard PNG</div>
              <div className="text-[10px] text-slate-400">High-res image screenshot</div>
            </div>
          </button>

          <button
            onClick={handleExportPdf}
            className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800/80 rounded-xl flex items-center gap-2.5 transition"
          >
            <FileText className="w-4 h-4 text-rose-400" />
            <div>
              <div className="font-semibold">Dashboard PDF</div>
              <div className="text-[10px] text-slate-400">Printable landscape document</div>
            </div>
          </button>

          <div className="my-1.5 border-t border-slate-800" />

          <div className="text-[11px] font-bold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
            Export Filtered Data
          </div>

          <button
            onClick={handleExportExcel}
            className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800/80 rounded-xl flex items-center gap-2.5 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="font-semibold">Excel Workbook (.xlsx)</div>
              <div className="text-[10px] text-slate-400">Formatted spreadsheet file</div>
            </div>
          </button>

          <button
            onClick={handleExportCsv}
            className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800/80 rounded-xl flex items-center gap-2.5 transition"
          >
            <FileCode className="w-4 h-4 text-amber-400" />
            <div>
              <div className="font-semibold">CSV File (.csv)</div>
              <div className="text-[10px] text-slate-400">Comma separated data values</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
