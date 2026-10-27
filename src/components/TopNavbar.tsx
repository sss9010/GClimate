import React from 'react';
import { Download } from 'lucide-react';

interface TopNavbarProps {
  onNavClick: (sectionId: string) => void;
  onExportData: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onNavClick, onExportData }) => {
  return (
    <header className="sticky top-0 z-40 w-full flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950/90 border-b border-slate-800/80">
      {/* Zone 1: Single text element wordmark in display face */}
      <a
        href="/"
        className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 font-display"
      >
        GeoClimate Atlas
      </a>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onNavClick('globe-view')}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Observatory
        </button>
        <button
          onClick={() => onNavClick('projections-view')}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Projections
        </button>
        <button
          onClick={() => onNavClick('seasonal-view')}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Seasonal Shift
        </button>
        <button
          onClick={() => onNavClick('briefing-view')}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          IPCC Briefing
        </button>
        <button
          onClick={() => onNavClick('methodology-view')}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Methodology
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onExportData}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Dataset</span>
        </button>
      </div>
    </header>
  );
};
