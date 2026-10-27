import React, { useState } from 'react';
import { MonthlyProfile } from '../types/climate';

interface SeasonalShiftRadarProps {
  profiles: MonthlyProfile[];
  regionName: string;
}

export const SeasonalShiftRadar: React.FC<SeasonalShiftRadarProps> = ({ profiles, regionName }) => {
  const [activeCycle, setActiveCycle] = useState<'temperature' | 'precipitation'>('temperature');

  // SVG Radial Geometry
  const size = 320;
  const center = size / 2;
  const radius = 110;

  // Compute min/max for radial scaling
  const temps = profiles.flatMap(p => [p.baselineTemp, p.modernTemp, p.futureTemp2050]);
  const precips = profiles.flatMap(p => [p.baselinePrecip, p.modernPrecip, p.futurePrecip2050]);

  const minTemp = Math.floor(Math.min(...temps));
  const maxTemp = Math.ceil(Math.max(...temps));
  const maxPrecip = Math.ceil(Math.max(...precips, 50));

  const getRadius = (val: number) => {
    if (activeCycle === 'temperature') {
      const clamped = Math.max(minTemp, Math.min(maxTemp, val));
      const normalized = (clamped - minTemp) / (maxTemp - minTemp || 1);
      return 25 + normalized * (radius - 25);
    } else {
      const normalized = Math.max(0, Math.min(1, val / maxPrecip));
      return 25 + normalized * (radius - 25);
    }
  };

  // Convert month index & value to (x, y)
  const getCoordinates = (monthIdx: number, val: number): [number, number] => {
    const angle = (monthIdx / 12) * 2 * Math.PI - Math.PI / 2;
    const r = getRadius(val);
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return [x, y];
  };

  const getPolygonPath = (extractor: (p: MonthlyProfile) => number) => {
    const pts = profiles.map((p, i) => {
      const [x, y] = getCoordinates(i, extractor(p));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${pts.join(' L ')} Z`;
  };

  const baselinePath = getPolygonPath(p =>
    activeCycle === 'temperature' ? p.baselineTemp : p.baselinePrecip
  );
  const modernPath = getPolygonPath(p =>
    activeCycle === 'temperature' ? p.modernTemp : p.modernPrecip
  );
  const futurePath = getPolygonPath(p =>
    activeCycle === 'temperature' ? p.futureTemp2050 : p.futurePrecip2050
  );

  return (
    <div className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      {/* Header and Cycle Toggle */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-xs text-slate-400">12-MONTH CLIMATOLOGY ENVELOPE</div>
          <h4 className="text-sm font-semibold text-slate-100">Seasonal Amplitude & Peak Shifts</h4>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveCycle('temperature')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeCycle === 'temperature' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Temperature
          </button>
          <button
            onClick={() => setActiveCycle('precipitation')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeCycle === 'precipitation' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Precipitation
          </button>
        </div>
      </div>

      {/* Radar SVG */}
      <div className="flex items-center justify-center relative py-2">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-64 h-64 select-none">
          {/* Concentric scale rings */}
          {[0.33, 0.66, 1.0].map((frac, idx) => {
            const r = 25 + frac * (radius - 25);
            return (
              <circle
                key={`ring-${idx}`}
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="2 2"
              />
            );
          })}

          {/* 12 Month Spokes */}
          {profiles.map((p, i) => {
            const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
            const x2 = center + radius * Math.cos(angle);
            const y2 = center + radius * Math.sin(angle);
            const labelX = center + (radius + 18) * Math.cos(angle);
            const labelY = center + (radius + 18) * Math.sin(angle) + 4;

            return (
              <g key={`spoke-${p.month}`}>
                <line
                  x1={center}
                  y1={center}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  fill="#94a3b8"
                  className="text-[10px] font-mono"
                >
                  {p.month}
                </text>
              </g>
            );
          })}

          {/* 1985-2005 Baseline Polygon */}
          <path
            d={baselinePath}
            fill="rgba(148, 163, 184, 0.12)"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />

          {/* 2006-2025 Modern Polygon */}
          <path
            d={modernPath}
            fill="rgba(6, 182, 212, 0.2)"
            stroke="#06b6d4"
            strokeWidth="2"
          />

          {/* 2050 Projected Polygon */}
          <path
            d={futurePath}
            fill="rgba(245, 158, 11, 0.15)"
            stroke="#f59e0b"
            strokeWidth="2"
          />

          {/* Center reference point */}
          <circle cx={center} cy={center} r="2" fill="#64748b" />
        </svg>
      </div>

      {/* Legend & Key Observations */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-0.5 bg-slate-400 inline-block stroke-dash" />
            <span>1985–2005 Baseline</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" />
            <span>2006–2025 Modern</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-0.5 bg-amber-400 inline-block" />
            <span>2050 (SSP2-4.5)</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 mt-1">
          {activeCycle === 'temperature' ? (
            <span>
              Peak warming concentrates in summer maximums, with warmer winter baselines compressing snowfall
              duration.
            </span>
          ) : (
            <span>
              Hydrological cycle exhibits seasonal polarization: intensified wet season peaks contrasting against
              deepened summer dry deficits.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
