import React, { useState, useEffect } from 'react';
import { Play, Pause, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface ControlDockProps {
  activeScenarioId: 'ssp126' | 'ssp245' | 'ssp585';
  onScenarioChange: (scenario: 'ssp126' | 'ssp245' | 'ssp585') => void;
  activeMetric: 'temperature' | 'precipitation' | 'extremes';
  onMetricChange: (metric: 'temperature' | 'precipitation' | 'extremes') => void;
  timelineYear: number;
  onYearChange: (year: number) => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  activeScenarioId,
  onScenarioChange,
  activeMetric,
  onMetricChange,
  timelineYear,
  onYearChange,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Animation loop when playing
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (timelineYear >= 2100) {
        setIsPlaying(false);
      } else {
        onYearChange(timelineYear + 1);
      }
    }, 180);

    return () => clearInterval(interval);
  }, [isPlaying, timelineYear, onYearChange]);

  // Keyboard shortcut 'H' to toggle collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h' && !(e.target instanceof HTMLInputElement)) {
        setIsCollapsed(c => !c);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-4 transition-transform duration-300 ease-out ${
        isCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
      }`}
    >
      <div className="relative bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl p-4 flex flex-col gap-3.5">
        {/* Collapse / Expand Toggle Button anchored to top */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -top-7 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 border border-slate-700/80 rounded-t-lg text-[11px] font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Show Controls (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Hide Controls (H)</span>
            </>
          )}
        </button>

        {/* Top Control Strip: Scenarios + Metrics */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Scenario Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 px-2 select-none">SCENARIO:</span>
            <button
              onClick={() => onScenarioChange('ssp126')}
              className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap ${
                activeScenarioId === 'ssp126'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SSP1-2.6 (Mitigation)
            </button>
            <button
              onClick={() => onScenarioChange('ssp245')}
              className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap ${
                activeScenarioId === 'ssp245'
                  ? 'bg-sky-950/80 text-sky-300 border border-sky-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SSP2-4.5 (Current Policy)
            </button>
            <button
              onClick={() => onScenarioChange('ssp585')}
              className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap ${
                activeScenarioId === 'ssp585'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SSP5-8.5 (High Emissions)
            </button>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-[11px] font-mono text-slate-400 px-2 select-none">METRIC:</span>
            <button
              onClick={() => onMetricChange('temperature')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                activeMetric === 'temperature' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Temperature (Δ°C)
            </button>
            <button
              onClick={() => onMetricChange('precipitation')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                activeMetric === 'precipitation' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Precipitation (%)
            </button>
            <button
              onClick={() => onMetricChange('extremes')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                activeMetric === 'extremes' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Extremes (&gt;35°C)
            </button>
          </div>
        </div>

        {/* Bottom Strip: Timeline Scrubber with Play/Pause & Preset Jumps */}
        <div className="flex items-center gap-4 pt-1">
          {/* Play / Pause Button */}
          <button
            onClick={() => {
              if (timelineYear >= 2100) onYearChange(1985);
              setIsPlaying(!isPlaying);
            }}
            className="w-8 h-8 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center shrink-0 transition-colors shadow-sm cursor-pointer"
            title={isPlaying ? 'Pause timeline animation' : 'Play timeline animation'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Reset button */}
          <button
            onClick={() => {
              setIsPlaying(false);
              onYearChange(2025);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
            title="Reset timeline to present (2025)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Year Display */}
          <div className="flex items-center gap-1.5 shrink-0 min-w-[70px]">
            <span className="font-mono text-base font-bold text-white tabular-nums">{timelineYear}</span>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              {timelineYear <= 2025 ? 'Obs.' : 'Proj.'}
            </span>
          </div>

          {/* Range Slider */}
          <div className="flex-1 flex flex-col gap-1">
            <input
              type="range"
              min={1985}
              max={2100}
              value={timelineYear}
              onChange={e => {
                setIsPlaying(false);
                onYearChange(parseInt(e.target.value, 10));
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            {/* Quick jump ticks */}
            <div className="flex justify-between text-[10px] font-mono text-slate-400 px-0.5">
              <button onClick={() => onYearChange(1985)} className="hover:text-cyan-300">1985</button>
              <button onClick={() => onYearChange(2005)} className="hover:text-cyan-300">2005 (Baseline)</button>
              <button onClick={() => onYearChange(2025)} className="hover:text-cyan-300 text-cyan-400 font-semibold">2025 (Present)</button>
              <button onClick={() => onYearChange(2050)} className="hover:text-cyan-300">2050 (Mid-Century)</button>
              <button onClick={() => onYearChange(2100)} className="hover:text-cyan-300">2100</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
