import React from 'react';
import { X, ExternalLink, BookOpen } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">Scientific Methodology & Data Provenance</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 text-xs text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-sm font-semibold text-cyan-400">1. Historical Observations (NASA POWER)</h4>
            <p>
              Historical records from 1985 through 2024 are calibrated using NASA’s Prediction of Worldwide Energy
              Resources (POWER) project (v2.0 reanalysis). NASA POWER integrates satellite solar observations and the
              Modern-Era Retrospective analysis for Research and Applications, Version 2 (MERRA-2) assimilation
              model to deliver continuous surface meteorology at 0.5° × 0.625° global grid resolution.
            </p>
          </div>

          {/* Section 2 */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-sm font-semibold text-cyan-400">2. Future Projections (IPCC AR6 CMIP6 Ensembles)</h4>
            <p>
              Future trajectories spanning 2026 to 2100 are derived from downscaled Coupled Model Intercomparison
              Project Phase 6 (CMIP6) multi-model ensembles, representing core scenarios evaluated in the IPCC Sixth
              Assessment Report (AR6):
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1 mt-1 text-slate-300">
              <li>
                <strong className="text-emerald-400">SSP1-2.6 (Paris Mitigation):</strong> Aggressive decarbonization;
                global emissions reach net-zero by mid-century. Global warming peaks near 1.8°C before stabilizing.
              </li>
              <li>
                <strong className="text-sky-400">SSP2-4.5 (Middle-of-the-Road):</strong> Development consistent with
                current global policy commitments. Radiative forcing reaches ~4.5 W/m² by 2100 with ~2.7°C global warming.
              </li>
              <li>
                <strong className="text-rose-400">SSP5-8.5 (High Emissions):</strong> Energy-intensive development
                fueled by unconstrained fossil fuel consumption. Radiative forcing exceeds 8.5 W/m² with severe impacts.
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-sm font-semibold text-cyan-400">3. Polar Amplification & Hydrological Physics</h4>
            <p>
              Regional downscaling incorporates empirical latitude amplification ratios (Arctic and subpolar regions
              experience 2.5× to 3.5× the global mean warming due to albedo feedback and lapse rate effects). Hydrological
              estimates apply Clausius-Clapeyron moisture scaling (~7% increase in atmospheric water capacity per degree
              Celsius of warming), driving intensified episodic precipitation events while expanding summer evaporation
              deficits.
            </p>
          </div>

          {/* External Citation Links */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Authoritative References</span>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://power.larc.nasa.gov/"
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline"
              >
                <span>NASA POWER Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://www.ipcc.ch/report/ar6/wg1/"
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline"
              >
                <span>IPCC AR6 Working Group I</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://wcrp-cmip.org/"
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline"
              >
                <span>WCRP CMIP6 Overview</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex justify-end bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
