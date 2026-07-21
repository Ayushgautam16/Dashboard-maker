import React from 'react';
import { ArrowRight, BarChart3, Database, Sparkles } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { FeatureCards } from './FeatureCards';
import { UploadZone } from './UploadZone';

export const LandingHero: React.FC = () => {
  const { loadDemoDataset } = useDashboardStore();

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 relative overflow-hidden">
      {/* Glow background circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Top Tag Banner */}
        <div className="flex justify-center mb-6">
          <div className="px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-2 shadow-lg backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>AI-Powered Analytics Platform</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
            <span className="text-slate-400">No Code Required</span>
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.15] mb-6">
            Turn Any Spreadsheet Into a{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-indigo-400 to-purple-400">
              Live Interactive Dashboard
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Upload your Excel file and instantly create interactive dashboards with AI assistance, smart recommendations, customizable widgets, and export options.
          </p>
        </div>

        {/* Upload Zone */}
        <UploadZone />

        {/* Instant Demo Launchers */}
        <div className="mt-12 text-center max-w-xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-center gap-2">
            <Database className="w-3.5 h-3.5 text-brand-400" /> Or explore with 1-click Demo Datasets
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => loadDemoDataset('bike')}
              className="p-4 rounded-2xl glass-panel border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/80 text-left transition-all hover-lift group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Bike Sales Dashboard
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
              </div>
              <p className="text-xs text-slate-400">
                1,000 customers, Income vs Bike Purchase, Occupation & Region analysis.
              </p>
            </button>

            <button
              onClick={() => loadDemoDataset('superstore')}
              className="p-4 rounded-2xl glass-panel border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/80 text-left transition-all hover-lift group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                  Superstore Sales
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
              </div>
              <p className="text-xs text-slate-400">
                Sales over time, Profit margins, Product categories, Shipping modes.
              </p>
            </button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <FeatureCards />
      </div>
    </div>
  );
};
