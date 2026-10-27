import React from 'react';
import { RegionSummary } from '../types/climate';

interface HydrologicalCycleCardProps {
  summary: RegionSummary;
  timelineYear: number;
}

export const HydrologicalCycleCard: React.FC<HydrologicalCycleCardProps> = ({ summary, timelineYear }) => {
  const { metrics, scenarios } = summary;

  // Active projection point for the selected year
  const activePoint = scenarios.ssp245.timeSeries.find(p => p.year === timelineYear) || scenarios.ssp245.timeSeries[0];

  // Drought level styling
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Extreme':
      case 'Severe':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'High':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Moderate':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  // Water balance indicator
  const precipDeltaPct = activePoint.precipAnomalyPct;
  const droughtIndex = activePoint.droughtIndex;

  return (
    <div className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <div className="text-xs text-slate-400">HYDROLOGICAL REGIME & WATER BALANCE</div>
          <h4 className="text-sm font-semibold text-slate-100">Drought Index & Precipitation Dynamics</h4>
        </div>
        <div className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md border ${getRiskColor(metrics.currentDroughtRiskLevel)}`}>
          {metrics.currentDroughtRiskLevel.toUpperCase()} RISK
        </div>
      </div>

      {/* 3 Metric Gauge Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Metric 1: Annual Precipitation Volume */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
          <div className="text-[11px] text-slate-400 uppercase tracking-wide">Annual Rainfall ({timelineYear})</div>
          <div className="text-2xl font-mono font-bold text-white mt-1 tabular-nums">
            {activePoint.precipitation} <span className="text-xs font-normal text-slate-400">mm</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-1">
            <span>vs Baseline:</span>
            <span className={precipDeltaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {precipDeltaPct > 0 ? `+${precipDeltaPct}%` : `${precipDeltaPct}%`}
            </span>
          </div>
        </div>

        {/* Metric 2: Drought Stress Indicator (SPI/PDSI equivalent) */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
          <div className="text-[11px] text-slate-400 uppercase tracking-wide">Drought Severity Index</div>
          <div className="text-2xl font-mono font-bold mt-1 tabular-nums">
            <span
              className={
                droughtIndex <= -2
                  ? 'text-rose-400'
                  : droughtIndex <= -0.8
                  ? 'text-amber-400'
                  : droughtIndex >= 1.0
                  ? 'text-cyan-400'
                  : 'text-emerald-400'
              }
            >
              {droughtIndex > 0 ? `+${droughtIndex.toFixed(1)}` : droughtIndex.toFixed(1)}
            </span>
            <span className="text-xs font-normal text-slate-400 ml-1">SPI</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {droughtIndex <= -1.5
              ? 'Severe soil moisture deficit'
              : droughtIndex <= -0.5
              ? 'Moderate drying trend'
              : 'Near-normal moisture regime'}
          </div>
        </div>

        {/* Metric 3: Extreme Heat Days (>35°C) */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
          <div className="text-[11px] text-slate-400 uppercase tracking-wide">Extreme Heat Recurrence</div>
          <div className="text-2xl font-mono font-bold text-amber-400 mt-1 tabular-nums">
            {activePoint.extremeHeatDays} <span className="text-xs font-normal text-slate-400">days/yr</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Baseline: <span className="font-mono text-slate-300">{metrics.baselineExtremeHeatDays} d/yr</span>
          </div>
        </div>
      </div>

      {/* Precipitation Bar Comparisons: Baseline vs Modern vs 2050 */}
      <div className="flex flex-col gap-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800/60">
        <div className="text-xs font-medium text-slate-300">Multi-Decade Hydrological Volatility</div>

        {/* Baseline Bar */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="w-24 text-slate-400 shrink-0">1985–2005:</span>
          <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-slate-400 h-full rounded-full"
              style={{ width: `${Math.min(100, (metrics.baselinePrecipMean / 1800) * 100)}%` }}
            />
          </div>
          <span className="w-16 text-right text-slate-300 tabular-nums">{metrics.baselinePrecipMean} mm</span>
        </div>

        {/* Modern Bar */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="w-24 text-cyan-400 shrink-0">2006–2025:</span>
          <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full"
              style={{ width: `${Math.min(100, (metrics.modernPrecipMean / 1800) * 100)}%` }}
            />
          </div>
          <span className="w-16 text-right text-cyan-300 tabular-nums">{metrics.modernPrecipMean} mm</span>
        </div>

        {/* 2050 Projected (SSP2-4.5) */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="w-24 text-amber-400 shrink-0">2050 (SSP2):</span>
          <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  ((metrics.baselinePrecipMean * (1 + scenarios.ssp245.precipChangeBy2050Pct / 100)) / 1800) * 100
                )}%`,
              }}
            />
          </div>
          <span className="w-16 text-right text-amber-300 tabular-nums">
            {Math.round(metrics.baselinePrecipMean * (1 + scenarios.ssp245.precipChangeBy2050Pct / 100))} mm
          </span>
        </div>
      </div>
    </div>
  );
};
