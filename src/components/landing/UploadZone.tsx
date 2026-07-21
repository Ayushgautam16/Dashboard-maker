import React, { useRef, useState } from 'react';
import { AlertCircle, FileSpreadsheet, Loader2, UploadCloud, CheckCircle2 } from 'lucide-react';
import { parseDatasetFile } from '../../services/dataParser';
import { useDashboardStore } from '../../store/useDashboardStore';

export const UploadZone: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { setDataset, setError, error } = useDashboardStore();

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    setParsing(true);
    setError(null);

    try {
      const summary = await parseDatasetFile(file);
      setDataset(summary);
    } catch (err: any) {
      setError(err.message || 'Error parsing file.');
    } finally {
      setParsing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-3xl p-8 transition-all duration-300 text-center glass-panel border-2 ${
          isDragging
            ? 'border-brand-500 bg-brand-500/10 scale-[1.02] glow-brand'
            : 'border-slate-800 hover:border-brand-500/50 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, .xlsx, .xls"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-600 p-0.5 shadow-xl shadow-brand-500/20 group-hover:scale-110 transition-transform duration-300 mb-5">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
              {parsing ? (
                <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
              ) : (
                <UploadCloud className="w-10 h-10 text-brand-400 group-hover:text-brand-300 transition-colors" />
              )}
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            {parsing ? 'Parsing Dataset...' : 'Upload your Excel or CSV Dataset'}
          </h3>

          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            Drag & drop your file here, or click to browse. Supports{' '}
            <span className="text-brand-400 font-semibold">.xlsx</span>,{' '}
            <span className="text-brand-400 font-semibold">.xls</span>, and{' '}
            <span className="text-brand-400 font-semibold">.csv</span> formats up to 100,000+ rows.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Excel (.xlsx / .xls)
            </span>
            <span className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" /> Auto Type Detection
            </span>
            <span className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> 100% Client-Side Privacy
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <div className="font-semibold">Upload Failed</div>
            <div className="text-xs text-rose-300/80">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
};
