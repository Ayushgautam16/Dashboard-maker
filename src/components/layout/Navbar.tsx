import React from 'react';
import {
  BarChart3,
  Bot,
  Database,
  Grid,
  Sparkles,
  Table,
  UploadCloud,
} from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { ExportMenu } from './ExportMenu';
import { ThemeToggle } from './ThemeToggle';

export const Navbar: React.FC = () => {
  const {
    dataset,
    activeView,
    setViewMode,
    clearDataset,
    loadDemoDataset,
    toggleAiOpen,
    isAiOpen,
  } = useDashboardStore();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => setViewMode(dataset ? 'dashboard' : 'landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-brand-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                Excel Dashboard
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-brand-500/20 text-brand-400 border border-brand-500/30 uppercase tracking-widest">
                AI Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Zero-code interactive analytics platform
            </p>
          </div>
        </div>

        {/* View Switcher / Navigation */}
        {dataset ? (
          <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeView === 'preview'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Dataset Preview</span>
            </button>

            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeView === 'dashboard'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          </div>
        ) : null}

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Datasets */}
          <div className="relative group">
            <button className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-2 border border-slate-800 transition">
              <Database className="w-3.5 h-3.5 text-brand-400" />
              <span className="hidden md:inline">Demo Datasets</span>
            </button>

            <div className="absolute right-0 mt-2 w-52 rounded-2xl glass-panel bg-slate-900/95 border border-slate-700/60 shadow-2xl p-2 hidden group-hover:block z-50">
              <div className="text-[11px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
                Load Preset
              </div>
              <button
                onClick={() => loadDemoDataset('bike')}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800/80 rounded-xl flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div>
                  <div className="font-semibold">Bike Sales Dashboard</div>
                  <div className="text-[10px] text-slate-400">1,000 rows • 13 metrics</div>
                </div>
              </button>
              <button
                onClick={() => loadDemoDataset('superstore')}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800/80 rounded-xl flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
                <div>
                  <div className="font-semibold">Superstore Sales</div>
                  <div className="text-[10px] text-slate-400">E-commerce sales analytics</div>
                </div>
              </button>
            </div>
          </div>

          {/* AI Assistant Button */}
          {dataset && (
            <button
              onClick={toggleAiOpen}
              className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border transition ${
                isAiOpen
                  ? 'bg-purple-600/30 border-purple-500 text-purple-200 shadow-lg shadow-purple-500/20'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-purple-500/50 hover:text-purple-300'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="hidden lg:inline">Ask AI</span>
            </button>
          )}

          {/* Upload Button */}
          {dataset ? (
            <button
              onClick={clearDataset}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-2 border border-slate-800 transition"
              title="Upload New File"
            >
              <UploadCloud className="w-4 h-4 text-slate-400" />
              <span className="hidden md:inline">Upload New</span>
            </button>
          ) : null}

          {/* Export Menu */}
          <ExportMenu />

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
