import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TopNavbar } from './components/TopNavbar';
import { LocationBar } from './components/LocationBar';
import { EarthGlobe } from './components/EarthGlobe';
import { ClimateAnomalyChart } from './components/ClimateAnomalyChart';
import { SeasonalShiftRadar } from './components/SeasonalShiftRadar';
import { HydrologicalCycleCard } from './components/HydrologicalCycleCard';
import { AiBriefingCard } from './components/AiBriefingCard';
import { ControlDock } from './components/ControlDock';
import { MethodologyModal } from './components/MethodologyModal';
import { WORLD_CITIES, WorldCity } from './data/worldLocations';
import { RegionSummary } from './types/climate';
import { buildCompleteRegionSummary } from './services/climateEngine';
import { Thermometer, Droplets, Sun, Globe2, ShieldAlert } from 'lucide-react';

export default function App() {
  // Region state (default: Athens, Greece)
  const [currentCity, setCurrentCity] = useState<WorldCity>(WORLD_CITIES[0]);
  const [summary, setSummary] = useState<RegionSummary>(() =>
    buildCompleteRegionSummary(
      WORLD_CITIES[0].lat,
      WORLD_CITIES[0].lon,
      WORLD_CITIES[0].name,
      WORLD_CITIES[0].continent,
      WORLD_CITIES[0].country,
      WORLD_CITIES[0].elevation,
      WORLD_CITIES[0].climateZone
    )
  );

  const [isLoading, setIsLoading] = useState(false);

  // Control Dock states
  const [activeScenarioId, setActiveScenarioId] = useState<'ssp126' | 'ssp245' | 'ssp585'>('ssp245');
  const [activeMetric, setActiveMetric] = useState<'temperature' | 'precipitation' | 'extremes'>('temperature');
  const [timelineYear, setTimelineYear] = useState<number>(2025);
  const [showAllScenarios, setShowAllScenarios] = useState(false);

  // Modal
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Fetch or calculate regional climate data
  const loadClimateData = useCallback(async (lat: number, lon: number, name: string, region = '', country = '') => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/climate/data?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}&region=${encodeURIComponent(
          region
        )}&country=${encodeURIComponent(country)}`
      );
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      } else {
        const localSummary = buildCompleteRegionSummary(lat, lon, name, region, country);
        setSummary(localSummary);
      }
    } catch (err) {
      console.warn('API error, using client-side downscaling engine:', err);
      const localSummary = buildCompleteRegionSummary(lat, lon, name, region, country);
      setSummary(localSummary);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle City selection
  const handleSelectCity = (city: WorldCity) => {
    setCurrentCity(city);
    loadClimateData(city.lat, city.lon, city.name, city.continent, city.country);
  };

  // Handle Custom coordinates from search or globe click
  const handleCustomCoordinate = (lat: number, lon: number, name: string) => {
    loadClimateData(lat, lon, name);
  };

  // Export JSON dataset
  const handleExportData = () => {
    const jsonStr = JSON.stringify(summary, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GeoClimate_${summary.name.replace(/\s+/g, '_')}_${timelineYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNavClick = (sectionId: string) => {
    if (sectionId === 'methodology-view') {
      setIsMethodologyOpen(true);
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const { metrics, scenarios } = summary;

  // Active projection point for the selected timeline year
  const activeTimelinePoint = useMemo(() => {
    const activeScenario = scenarios[activeScenarioId];
    return activeScenario.timeSeries.find(p => p.year === timelineYear) || activeScenario.timeSeries[0];
  }, [scenarios, activeScenarioId, timelineYear]);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans pb-28">
      {/* Top Bar (3-Zone Contract) */}
      <TopNavbar onNavClick={handleNavClick} onExportData={handleExportData} />

      {/* Location Search, Catalog & Hotspot Selector */}
      <LocationBar
        summary={summary}
        onSelectCity={handleSelectCity}
        onCustomCoordinate={handleCustomCoordinate}
        isLoading={isLoading}
      />

      {/* Main Observatory Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Row 1: Split 3D Earth Globe + Key Telemetry Cards */}
        <section id="globe-view" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: 3D Earth Canvas */}
          <div className="lg:col-span-7 h-[500px]">
            <EarthGlobe
              selectedLat={summary.lat}
              selectedLon={summary.lon}
              selectedName={summary.name}
              anomalyDelta={activeTimelinePoint.tempAnomaly}
              precipDeltaPct={activeTimelinePoint.precipAnomalyPct}
              extremeHeatDays={activeTimelinePoint.extremeHeatDays}
              activeMetric={activeMetric}
              onSelectLocation={loc => handleCustomCoordinate(loc.lat, loc.lon, loc.name)}
              timelineYear={timelineYear}
            />
          </div>

          {/* Right: Regional Overview & Key Metric Tiles */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            {/* Region Title Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-1">
                <span>{summary.dataSource.historical}</span>
                <span className="font-mono text-cyan-400">{summary.climateZone}</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{summary.name}</h2>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>{summary.region ? `${summary.region}, ` : ''}{summary.country}</span>
                <span>·</span>
                <span className="font-mono text-slate-300">Elevation: {summary.elevationMeters}m</span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300 leading-relaxed">
                {currentCity?.description ||
                  `Regional climate analysis modeling historical thermal trends and hydrological vulnerability under IPCC CMIP6 projection pathways.`}
              </div>
            </div>

            {/* 4 Core Quantitative Metrics (Tabular Figures) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Metric 1: Observed / Projected Warming Delta */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                  <span>Warming Anomaly ({timelineYear})</span>
                </div>
                <div className="text-2xl font-mono font-bold mt-1 tabular-nums text-rose-400">
                  {activeTimelinePoint.tempAnomaly > 0
                    ? `+${activeTimelinePoint.tempAnomaly.toFixed(2)}`
                    : activeTimelinePoint.tempAnomaly.toFixed(2)}
                  °C
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  vs 1985–2005 Baseline ({metrics.baselineTempMean.toFixed(1)}°C)
                </div>
              </div>

              {/* Metric 2: Mean Temp */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Annual Mean Temp</span>
                </div>
                <div className="text-2xl font-mono font-bold mt-1 tabular-nums text-slate-100">
                  {activeTimelinePoint.tempMean.toFixed(1)}°C
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Modern Obs: {metrics.modernTempMean.toFixed(1)}°C
                </div>
              </div>

              {/* Metric 3: Precipitation Anomaly */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Precipitation Delta</span>
                </div>
                <div
                  className={`text-2xl font-mono font-bold mt-1 tabular-nums ${
                    activeTimelinePoint.precipAnomalyPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {activeTimelinePoint.precipAnomalyPct > 0
                    ? `+${activeTimelinePoint.precipAnomalyPct}%`
                    : `${activeTimelinePoint.precipAnomalyPct}%`}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {activeTimelinePoint.precipitation} mm vs {metrics.baselinePrecipMean} mm
                </div>
              </div>

              {/* Metric 4: Extreme Heat Days */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Extreme Heat Recurrence</span>
                </div>
                <div className="text-2xl font-mono font-bold mt-1 tabular-nums text-amber-400">
                  {activeTimelinePoint.extremeHeatDays}{' '}
                  <span className="text-xs font-normal text-slate-400">d/yr</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Baseline: {metrics.baselineExtremeHeatDays} d/yr
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Row 2: Comprehensive Climate Anomaly & Projection Timeline Chart */}
        <section id="projections-view" className="w-full">
          <ClimateAnomalyChart
            summary={summary}
            activeScenarioId={activeScenarioId}
            activeMetric={activeMetric}
            timelineYear={timelineYear}
            onYearChange={setTimelineYear}
            showAllScenarios={showAllScenarios}
            onToggleShowAllScenarios={() => setShowAllScenarios(!showAllScenarios)}
          />
        </section>

        {/* Row 3: Seasonal Shift Radar & Hydrological Cycle */}
        <section id="seasonal-view" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SeasonalShiftRadar profiles={summary.monthlyProfiles} regionName={summary.name} />
          <HydrologicalCycleCard summary={summary} timelineYear={timelineYear} />
        </section>

        {/* Row 4: AI Scientific Briefing & Vulnerability Report */}
        <section id="briefing-view" className="w-full">
          <AiBriefingCard summary={summary} />
        </section>

        {/* Data Provenance & Epistemic Attribution */}
        <footer className="pt-6 pb-4 border-t border-slate-800 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-slate-400" />
            <span>GeoClimate Atlas · NASA POWER & IPCC CMIP6 Multi-Model Climate Analytics</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsMethodologyOpen(true)}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Methodology & Sources
            </button>
            <span>·</span>
            <span>NASA MERRA-2 Reanalysis</span>
            <span>·</span>
            <span>WCRP CMIP6</span>
          </div>
        </footer>
      </main>

      {/* Collapsible Ergonomic Bottom Dock */}
      <ControlDock
        activeScenarioId={activeScenarioId}
        onScenarioChange={setActiveScenarioId}
        activeMetric={activeMetric}
        onMetricChange={setActiveMetric}
        timelineYear={timelineYear}
        onYearChange={setTimelineYear}
      />

      {/* Scientific Methodology Modal */}
      <MethodologyModal isOpen={isMethodologyOpen} onClose={() => setIsMethodologyOpen(false)} />
    </div>
  );
}
