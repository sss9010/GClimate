import React, { useState, useMemo } from 'react';
import { ClimatePoint, RegionSummary, ScenarioProjection } from '../types/climate';

interface ClimateAnomalyChartProps {
  summary: RegionSummary;
  activeScenarioId: 'ssp126' | 'ssp245' | 'ssp585';
  activeMetric: 'temperature' | 'precipitation' | 'extremes';
  timelineYear: number;
  onYearChange: (year: number) => void;
  showAllScenarios: boolean;
  onToggleShowAllScenarios: () => void;
}

export const ClimateAnomalyChart: React.FC<ClimateAnomalyChartProps> = ({
  summary,
  activeScenarioId,
  activeMetric,
  timelineYear,
  onYearChange,
  showAllScenarios,
  onToggleShowAllScenarios,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<ClimatePoint | null>(null);

  const activeScenario = summary.scenarios[activeScenarioId];
  const allScenarios = summary.scenarios;

  // Determine min/max scales for the active metric across 1985-2100
  const chartData = useMemo(() => {
    const points = activeScenario.timeSeries;
    let vals: number[] = [];

    if (activeMetric === 'temperature') {
      vals = points.flatMap(p => [
        p.tempAnomaly,
        p.tempMinBound ? p.tempMinBound - summary.metrics.baselineTempMean : p.tempAnomaly,
        p.tempMaxBound ? p.tempMaxBound - summary.metrics.baselineTempMean : p.tempAnomaly,
      ]);
      if (showAllScenarios) {
        vals.push(...allScenarios.ssp585.timeSeries.map(p => p.tempAnomaly));
        vals.push(...allScenarios.ssp126.timeSeries.map(p => p.tempAnomaly));
      }
    } else if (activeMetric === 'precipitation') {
      vals = points.map(p => p.precipAnomalyPct);
    } else {
      vals = points.map(p => p.extremeHeatDays);
    }

    const minVal = Math.floor(Math.min(...vals, 0));
    const maxVal = Math.ceil(Math.max(...vals, 1));
    return { points, minVal, maxVal };
  }, [activeScenario, allScenarios, activeMetric, showAllScenarios, summary.metrics.baselineTempMean]);

  // Chart dimensions & scaling
  const width = 800;
  const height = 300;
  const padding = { top: 25, right: 30, bottom: 40, left: 60 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const minYear = 1985;
  const maxYear = 2100;

  const getX = (year: number) => padding.left + ((year - minYear) / (maxYear - minYear)) * innerWidth;
  const getY = (val: number) => {
    const range = chartData.maxVal - chartData.minVal || 1;
    return padding.top + innerHeight - ((val - chartData.minVal) / range) * innerHeight;
  };

  // Helper to build SVG polyline / path strings
  const buildPath = (pts: ClimatePoint[], valueExtractor: (p: ClimatePoint) => number) => {
    return pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.year).toFixed(1)} ${getY(valueExtractor(p)).toFixed(1)}`)
      .join(' ');
  };

  // Build confidence ribbon path for active scenario
  const confidenceBandPath = useMemo(() => {
    if (activeMetric !== 'temperature') return '';
    const futurePoints = activeScenario.timeSeries.filter(p => p.isProjected);
    if (!futurePoints.length) return '';

    const upper = futurePoints.map(p => {
      const bound = (p.tempMaxBound ?? p.tempMean) - summary.metrics.baselineTempMean;
      return `${getX(p.year).toFixed(1)},${getY(bound).toFixed(1)}`;
    });

    const lower = [...futurePoints].reverse().map(p => {
      const bound = (p.tempMinBound ?? p.tempMean) - summary.metrics.baselineTempMean;
      return `${getX(p.year).toFixed(1)},${getY(bound).toFixed(1)}`;
    });

    return `M ${upper.join(' L ')} L ${lower.join(' L ')} Z`;
  }, [activeScenario, activeMetric, summary.metrics.baselineTempMean, chartData]);

  // Value extractor based on active metric
  const getMetricValue = (p: ClimatePoint) => {
    if (activeMetric === 'temperature') return p.tempAnomaly;
    if (activeMetric === 'precipitation') return p.precipAnomalyPct;
    return p.extremeHeatDays;
  };

  // Zero-line Y coordinate
  const zeroY = getY(0);

  // SVG Mouse interaction
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const clampedX = Math.max(padding.left, Math.min(width - padding.right, (mouseX / rect.width) * width));
    const yearFraction = minYear + ((clampedX - padding.left) / innerWidth) * (maxYear - minYear);
    const closestYear = Math.max(minYear, Math.min(maxYear, Math.round(yearFraction)));

    const pt = activeScenario.timeSeries.find(p => p.year === closestYear);
    if (pt) {
      setHoveredPoint(pt);
    }
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const clampedX = Math.max(padding.left, Math.min(width - padding.right, (mouseX / rect.width) * width));
    const yearFraction = minYear + ((clampedX - padding.left) / innerWidth) * (maxYear - minYear);
    const closestYear = Math.max(minYear, Math.min(maxYear, Math.round(yearFraction)));
    onYearChange(closestYear);
  };

  const currentDisplayPoint = hoveredPoint || activeScenario.timeSeries.find(p => p.year === timelineYear) || activeScenario.timeSeries[0];

  return (
    <div className="w-full flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      {/* Chart Header & Metric Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>NASA POWER (1985–2025)</span>
            <span>·</span>
            <span>IPCC CMIP6 ENSEMBLES (2026–2100)</span>
          </div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 mt-0.5">
            {activeMetric === 'temperature' && 'Surface Air Temperature Anomaly (Δ°C vs 1985–2005 Baseline)'}
            {activeMetric === 'precipitation' && 'Annual Precipitation Shift (% Variance vs Baseline)'}
            {activeMetric === 'extremes' && 'Extreme Heat Recurrence (Days/Year with Max Temp > 35°C)'}
          </h3>
        </div>

        {/* Multi-Scenario Overlay Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleShowAllScenarios}
            className={`px-3 py-1 text-xs font-mono rounded transition-colors border ${
              showAllScenarios
                ? 'bg-slate-800 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {showAllScenarios ? 'Hide CMIP6 Scenarios' : 'Compare All Scenarios'}
          </button>
        </div>
      </div>

      {/* Synchronized Hover Telemetry Ribbon */}
      <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800/80 rounded-lg px-4 py-2 mb-2 text-xs font-mono">
        <div className="flex items-center gap-4">
          <span className="text-slate-400">
            YEAR: <strong className="text-white text-sm">{currentDisplayPoint.year}</strong>{' '}
            <span className="text-[11px] text-slate-500">
              {currentDisplayPoint.isProjected ? '(CMIP6 Projection)' : '(NASA Observation)'}
            </span>
          </span>
          <span>·</span>
          <span className="text-slate-400">
            ANOMALY:{' '}
            <strong
              className={`text-sm tabular-nums ${
                currentDisplayPoint.tempAnomaly > 1.5
                  ? 'text-rose-400'
                  : currentDisplayPoint.tempAnomaly > 0.8
                  ? 'text-amber-400'
                  : 'text-cyan-400'
              }`}
            >
              {currentDisplayPoint.tempAnomaly > 0 ? `+${currentDisplayPoint.tempAnomaly}°C` : `${currentDisplayPoint.tempAnomaly}°C`}
            </strong>
          </span>
          <span>·</span>
          <span className="text-slate-400">
            MEAN TEMP: <strong className="text-slate-200 tabular-nums">{currentDisplayPoint.tempMean}°C</strong>
          </span>
          <span>·</span>
          <span className="text-slate-400">
            PRECIP:{' '}
            <strong className="text-slate-200 tabular-nums">
              {currentDisplayPoint.precipitation} mm ({currentDisplayPoint.precipAnomalyPct > 0 ? '+' : ''}
              {currentDisplayPoint.precipAnomalyPct}%)
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-500 text-[11px]">
          <span>SCENARIO: <span className="text-cyan-400 font-semibold">{activeScenario.shortLabel}</span></span>
        </div>
      </div>

      {/* SVG Canvas Stage */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
          onClick={handleSvgClick}
        >
          <defs>
            {/* Historical Gradient Fill */}
            <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>

            {/* Scenario Fill Gradients */}
            <linearGradient id="ssp126Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="ssp245Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="ssp585Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[chartData.minVal, 0, Math.round((chartData.maxVal + chartData.minVal) / 2), chartData.maxVal].map((val, idx) => {
            const y = getY(val);
            return (
              <g key={`grid-y-${idx}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray={val === 0 ? 'none' : '3 3'}
                  strokeWidth={val === 0 ? 1.5 : 1}
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill={val === 0 ? '#94a3b8' : '#64748b'}
                  className="text-[11px] font-mono tabular-nums"
                >
                  {val > 0 ? `+${val}` : val}
                  {activeMetric === 'temperature' ? '°C' : activeMetric === 'precipitation' ? '%' : 'd'}
                </text>
              </g>
            );
          })}

          {/* Year Grid Vertical lines */}
          {[1990, 2010, 2025, 2050, 2075, 2100].map(yr => {
            const x = getX(yr);
            return (
              <g key={`grid-x-${yr}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke={yr === 2025 ? 'rgba(56,189,248,0.35)' : 'rgba(255,255,255,0.06)'}
                  strokeDasharray={yr === 2025 ? 'none' : '2 2'}
                  strokeWidth={yr === 2025 ? 1.5 : 1}
                />
                <text
                  x={x}
                  y={height - padding.bottom + 16}
                  textAnchor="middle"
                  fill={yr === 2025 ? '#38bdf8' : '#64748b'}
                  className="text-[11px] font-mono"
                >
                  {yr}
                </text>
              </g>
            );
          })}

          {/* Dividing Marker: 2025 Present Boundary */}
          <line
            x1={getX(2025)}
            y1={padding.top}
            x2={getX(2025)}
            y2={height - padding.bottom}
            stroke="#38bdf8"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
          <text
            x={getX(2025) - 6}
            y={padding.top + 14}
            textAnchor="end"
            fill="#38bdf8"
            className="text-[10px] font-mono font-medium"
          >
            OBSERVED ◀
          </text>
          <text
            x={getX(2025) + 6}
            y={padding.top + 14}
            textAnchor="start"
            fill="#38bdf8"
            className="text-[10px] font-mono font-medium"
          >
            ▶ CMIP6 PROJECTIONS
          </text>

          {/* Uncertainty Spread Band for Active Scenario */}
          {confidenceBandPath && (
            <path
              d={confidenceBandPath}
              fill={
                activeScenarioId === 'ssp585'
                  ? 'rgba(239, 68, 68, 0.12)'
                  : activeScenarioId === 'ssp126'
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(56, 189, 248, 0.12)'
              }
            />
          )}

          {/* Optional Multi-Scenario Curves */}
          {showAllScenarios && (
            <>
              {/* SSP1-2.6 Line */}
              <path
                d={buildPath(allScenarios.ssp126.timeSeries.filter(p => p.isProjected), getMetricValue)}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.75"
                strokeDasharray="4 2"
                opacity="0.85"
              />
              {/* SSP5-8.5 Line */}
              <path
                d={buildPath(allScenarios.ssp585.timeSeries.filter(p => p.isProjected), getMetricValue)}
                fill="none"
                stroke="#ef4444"
                strokeWidth="1.75"
                strokeDasharray="4 2"
                opacity="0.85"
              />
            </>
          )}

          {/* Historical Observed Curve (1985-2025) */}
          <path
            d={buildPath(activeScenario.timeSeries.filter(p => !p.isProjected), getMetricValue)}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.5"
          />

          {/* Future Projection Curve (2025-2100) */}
          <path
            d={buildPath(activeScenario.timeSeries.filter(p => p.year >= 2025), getMetricValue)}
            fill="none"
            stroke={
              activeScenarioId === 'ssp585' ? '#ef4444' : activeScenarioId === 'ssp126' ? '#10b981' : '#38bdf8'
            }
            strokeWidth="2.5"
          />

          {/* Selected Timeline Year Indicator Line */}
          <line
            x1={getX(timelineYear)}
            y1={padding.top}
            x2={getX(timelineYear)}
            y2={height - padding.bottom}
            stroke="#f59e0b"
            strokeWidth="1.5"
          />
          <circle
            cx={getX(timelineYear)}
            cy={getY(getMetricValue(activeScenario.timeSeries.find(p => p.year === timelineYear) || activeScenario.timeSeries[0]))}
            r="4.5"
            fill="#f59e0b"
            stroke="#07090e"
            strokeWidth="1.5"
          />

          {/* Hover Crosshair Marker */}
          {hoveredPoint && (
            <g>
              <line
                x1={getX(hoveredPoint.year)}
                y1={padding.top}
                x2={getX(hoveredPoint.year)}
                y2={height - padding.bottom}
                stroke="#ffffff"
                strokeDasharray="2 2"
                strokeWidth="1"
                opacity="0.75"
              />
              <circle
                cx={getX(hoveredPoint.year)}
                cy={getY(getMetricValue(hoveredPoint))}
                r="5"
                fill="#ffffff"
                stroke="#0284c7"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 mt-2 border-t border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
            <span>NASA POWER Observed (1985–2025)</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <span
              className={`w-3 h-0.5 inline-block ${
                activeScenarioId === 'ssp585' ? 'bg-rose-500' : activeScenarioId === 'ssp126' ? 'bg-emerald-500' : 'bg-sky-400'
              }`}
            />
            <span>{activeScenario.name} Projection</span>
          </div>

          {showAllScenarios && (
            <>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-0.5 bg-emerald-500 inline-block stroke-dash" />
                <span>SSP1-2.6 (Mitigation)</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-400">
                <span className="w-3 h-0.5 bg-rose-500 inline-block stroke-dash" />
                <span>SSP5-8.5 (High Emissions)</span>
              </div>
            </>
          )}
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          CLICK CHART TO JUMP TIMELINE · HOVER TO INSPECT ANOMALIES
        </div>
      </div>
    </div>
  );
};
