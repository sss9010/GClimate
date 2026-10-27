import React, { useState, useEffect } from 'react';
import { RegionSummary, AiBriefingResponse } from '../types/climate';
import { generateScientificSynthesis } from '../services/climateEngine';
import { Sparkles, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AiBriefingCardProps {
  summary: RegionSummary;
}

export const AiBriefingCard: React.FC<AiBriefingCardProps> = ({ summary }) => {
  const [briefing, setBriefing] = useState<AiBriefingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = React.useRef<Map<string, AiBriefingResponse>>(new Map());

  const fetchBriefing = async (forceRefresh = false) => {
    const locId = summary.locationId;
    if (!forceRefresh && cacheRef.current.has(locId)) {
      setBriefing(cacheRef.current.get(locId)!);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/climate/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regionName: `${summary.name}, ${summary.country}`,
          lat: summary.lat,
          lon: summary.lon,
          climateZone: summary.climateZone,
          metrics: summary.metrics,
          ssp245: summary.scenarios.ssp245,
          ssp585: summary.scenarios.ssp585,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      cacheRef.current.set(locId, data);
      setBriefing(data);
    } catch {
      // Offline / Static hosting fallback (e.g. GitHub Pages without server)
      const staticSynthesis = generateScientificSynthesis(
        summary.name,
        summary.climateZone,
        summary.metrics,
        summary.scenarios.ssp245,
        summary.scenarios.ssp585
      );
      cacheRef.current.set(locId, staticSynthesis);
      setBriefing(staticSynthesis);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing(false);
  }, [summary.locationId]);

  return (
    <div className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-xs text-slate-400">IPCC AR6 & NASA SYNTHESIS · GEMINI 3.8 FLASH</div>
            <h4 className="text-sm font-semibold text-slate-100">Regional Climate Vulnerability Briefing</h4>
          </div>
        </div>

        <button
          onClick={() => fetchBriefing(true)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-md transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Synthesizing...' : 'Refresh Briefing'}</span>
        </button>
      </div>

      {loading && !briefing && (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs font-mono">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Synthesizing multi-model IPCC CMIP6 downscaling for {summary.name}...</span>
        </div>
      )}

      {error && !briefing && (
        <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg text-rose-300 text-xs">
          {error}
        </div>
      )}

      {briefing && (
        <div className="flex flex-col gap-4 text-xs leading-relaxed text-slate-300">
          {/* Executive Summary */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
            <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wide mb-1 flex items-center justify-between">
              <span>Executive Synthesis</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                  briefing.keyRiskRating === 'Severe'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {briefing.keyRiskRating} Risk Level
              </span>
            </div>
            <p className="text-slate-200">{briefing.summary}</p>
          </div>

          {/* Thermal & Water Dual Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-lg">
              <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide mb-1">
                Thermal & Extreme Heat Outlook
              </div>
              <p className="text-slate-300">{briefing.thermalAnalysis}</p>
            </div>

            <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-lg">
              <div className="text-[11px] font-semibold text-sky-400 uppercase tracking-wide mb-1">
                Hydrological & Drought Dynamics
              </div>
              <p className="text-slate-300">{briefing.waterCycleAnalysis}</p>
            </div>
          </div>

          {/* Vulnerability Factors & Adaptation Priorities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Vulnerabilities */}
            <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-lg">
              <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Primary Ecosystem Vulnerabilities</span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {briefing.vulnerabilityFactors.map((factor, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    <span className="text-rose-400 select-none mt-0.5">·</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Adaptation */}
            <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-lg">
              <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Adaptation & Resilience Actions</span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {briefing.adaptationRecommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    <span className="text-emerald-400 select-none mt-0.5">·</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
