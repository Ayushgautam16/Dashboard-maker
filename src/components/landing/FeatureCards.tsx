import React from 'react';
import {
  BarChart2,
  Download,
  Filter,
  Layers,
  Sparkles,
  Smartphone,
} from 'lucide-react';

export const FeatureCards: React.FC = () => {
  const features = [
    {
      icon: Sparkles,
      title: 'Automatic Column Detection',
      description: 'Smart classifier automatically recognizes Text, Numbers, Currency, Percentages, and Dates.',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: BarChart2,
      title: 'Interactive Charts',
      description: '20+ chart types including Line, Area, Bar, Pie, Donut, Stacked, Radar, Heatmaps, and Pivot Tables.',
      color: 'from-brand-500 to-cyan-500',
    },
    {
      icon: Layers,
      title: 'Dynamic KPI Cards',
      description: 'Instantly calculates Total Sales, Averages, Peak Values, Record counts, and Growth indicators.',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Filter,
      title: 'Global Real-time Filters',
      description: 'Multi-select dropdowns, date range selectors, and range sliders update all visuals synchronously.',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      icon: Download,
      title: 'One-Click Export',
      description: 'Download full dashboards as PNG images, formatted PDF reports, or filtered Excel/CSV data.',
      color: 'from-rose-500 to-pink-500',
    },
    {
      icon: Smartphone,
      title: 'Responsive & Fast',
      description: 'Engineered for smooth performance with large datasets up to 100,000 rows without freezing.',
      color: 'from-blue-500 to-violet-500',
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto mt-20">
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
          Everything You Need to Understand Your Data
        </h2>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Power BI & Tableau level capabilities simplified for business analysts, marketers, and researchers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div
              key={idx}
              className="glass-panel p-6 rounded-3xl border border-slate-800/80 hover:border-slate-700 hover-lift group relative overflow-hidden"
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${feat.color} p-0.5 shadow-lg mb-5 group-hover:scale-110 transition-transform`}
              >
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>

              <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
