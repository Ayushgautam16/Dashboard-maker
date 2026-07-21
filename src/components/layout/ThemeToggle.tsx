import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useDashboardStore();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-all border border-slate-700/50 flex items-center justify-center gap-2 text-xs font-medium"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  );
};
