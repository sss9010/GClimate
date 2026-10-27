import React, { useState } from 'react';
import { Search, MapPin, Globe, X, ChevronDown } from 'lucide-react';
import { WORLD_CITIES, WorldCity } from '../data/worldLocations';
import { RegionSummary } from '../types/climate';

interface LocationBarProps {
  summary: RegionSummary;
  onSelectCity: (city: WorldCity) => void;
  onCustomCoordinate: (lat: number, lon: number, name: string) => void;
  isLoading: boolean;
}

export const LocationBar: React.FC<LocationBarProps> = ({
  summary,
  onSelectCity,
  onCustomCoordinate,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);
  const [selectedContinent, setSelectedContinent] = useState<string>('All');

  const continents = ['All', 'Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania'];

  const filteredCities = WORLD_CITIES.filter(
    c => selectedContinent === 'All' || c.continent === selectedContinent
  );

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if input is "lat, lon"
    const coordMatch = searchQuery.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[3]);
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        onCustomCoordinate(lat, lon, `Coord (${lat.toFixed(2)}, ${lon.toFixed(2)})`);
        setSearchQuery('');
        return;
      }
    }

    // Check direct world cities matches
    const matchedCity = WORLD_CITIES.find(
      c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.country.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (matchedCity) {
      onSelectCity(matchedCity);
      setSearchQuery('');
      return;
    }

    // Fallback: Global Geocoding API for ANY city or country in the world
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          searchQuery
        )}&count=1&language=en&format=json`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const item = data.results[0];
          onCustomCoordinate(
            item.latitude,
            item.longitude,
            `${item.name}, ${item.country_code || item.country || ''}`
          );
          setSearchQuery('');
        } else {
          alert(`No global coordinate found for "${searchQuery}". Try typing "City, Country" or "lat, lon".`);
        }
      }
    } catch (err) {
      console.warn('Geocoding error:', err);
      alert('Geocoding service unavailable. You can enter direct coordinates as "lat, lon" (e.g. 48.85, 2.35).');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 py-3 border-b border-slate-800/80 bg-slate-950/60 px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search Bar + Browse Button */}
        <div className="flex items-center gap-2 flex-1 min-w-[280px] max-w-lg">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search any country, major city, or 'lat, lon'..."
              className="w-full pl-9 pr-20 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              disabled={isSearching || isLoading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSearching ? 'Locating...' : 'Locate'}
            </button>
          </form>

          {/* Browse Catalog Button */}
          <button
            onClick={() => setIsBrowseOpen(!isBrowseOpen)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs text-slate-200 transition-colors shrink-0 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Browse Cities</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Selected Region Telemetry */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-200">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-semibold">{summary.name}</span>
            {summary.country && summary.country !== 'Earth' && (
              <span className="text-slate-400">({summary.country})</span>
            )}
          </div>
          <span>·</span>
          <span className="font-mono text-cyan-400 tabular-nums">
            {summary.lat >= 0 ? `${summary.lat.toFixed(2)}°N` : `${Math.abs(summary.lat).toFixed(2)}°S`},{' '}
            {summary.lon >= 0 ? `${summary.lon.toFixed(2)}°E` : `${Math.abs(summary.lon).toFixed(2)}°W`}
          </span>
          <span>·</span>
          <span>{summary.climateZone}</span>
        </div>
      </div>

      {/* Quick Select Hotspot Pills (Top global cities) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-mono text-slate-500 uppercase shrink-0">GLOBAL PRESETS:</span>
        <div className="flex items-center gap-1.5">
          {WORLD_CITIES.slice(0, 12).map(c => {
            const isSelected =
              Math.abs(summary.lat - c.lat) < 0.05 && Math.abs(summary.lon - c.lon) < 0.05;
            return (
              <button
                key={c.id}
                onClick={() => onSelectCity(c)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/50'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {c.name} ({c.country})
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Cities Catalog Modal */}
      {isBrowseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-semibold text-white">World Cities & Climate Hotspots Directory</h3>
              </div>
              <button
                onClick={() => setIsBrowseOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Continent Filter Tabs */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 bg-slate-950/60 overflow-x-auto text-xs">
              <span className="font-mono text-slate-400 uppercase text-[11px] shrink-0">CONTINENT:</span>
              {continents.map(cont => (
                <button
                  key={cont}
                  onClick={() => setSelectedContinent(cont)}
                  className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    selectedContinent === cont
                      ? 'bg-cyan-600 text-white font-medium'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {cont}
                </button>
              ))}
            </div>

            {/* Grid of Cities */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredCities.map(city => {
                const isSelected =
                  Math.abs(summary.lat - city.lat) < 0.05 && Math.abs(summary.lon - city.lon) < 0.05;
                return (
                  <button
                    key={city.id}
                    onClick={() => {
                      onSelectCity(city);
                      setIsBrowseOpen(false);
                    }}
                    className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500/80 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-white">{city.name}</span>
                      <span className="text-[10px] font-mono text-cyan-400">{city.continent}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{city.country}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">
                      {city.lat >= 0 ? `${city.lat.toFixed(1)}°N` : `${Math.abs(city.lat).toFixed(1)}°S`},{' '}
                      {city.lon >= 0 ? `${city.lon.toFixed(1)}°E` : `${Math.abs(city.lon).toFixed(1)}°W`} ·{' '}
                      {city.elevation}m
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-snug">
                      {city.description}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <span>Showing {filteredCities.length} locations across {selectedContinent}</span>
              <button
                onClick={() => setIsBrowseOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
