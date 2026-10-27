export interface ClimatePoint {
  year: number;
  // Historical observed or projected
  isProjected: boolean;
  tempMean: number;      // °C
  tempAnomaly: number;   // °C deviation from 1985-2005 baseline
  precipitation: number; // mm annual
  precipAnomalyPct: number; // % deviation from baseline
  extremeHeatDays: number; // days > 35°C (or 95th percentile)
  droughtIndex: number;  // Palmer / SPI equivalent (-3 severe drought to +3 wet)
  // Confidence spreads for CMIP6 projections
  tempMinBound?: number;
  tempMaxBound?: number;
}

export interface MonthlyProfile {
  month: string;       // Jan, Feb, ...
  monthIndex: number;  // 0 to 11
  baselineTemp: number; // 1985-2005 average
  modernTemp: number;   // 2006-2025 average
  futureTemp2050: number; // 2040-2060 SSP2-4.5 average
  baselinePrecip: number; // mm/month
  modernPrecip: number;
  futurePrecip2050: number;
}

export interface ScenarioProjection {
  scenarioId: 'ssp126' | 'ssp245' | 'ssp585';
  name: string;
  shortLabel: string;
  description: string;
  emissionsTrack: string;
  tempBy2050: number;
  tempBy2100: number;
  precipChangeBy2050Pct: number;
  precipChangeBy2100Pct: number;
  timeSeries: ClimatePoint[];
}

export interface RegionSummary {
  locationId: string;
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  elevationMeters: number;
  climateZone: string; // e.g., Mediterranean, Humid Subtropical, Semi-Arid, Tundra
  dataSource: {
    historical: string; // "NASA POWER Satellite (1985–2024)"
    projections: string; // "IPCC AR6 CMIP6 Multi-Model Ensembles"
    lastUpdated: string;
  };
  metrics: {
    baselineTempMean: number; // 1985-2005
    modernTempMean: number;   // 2006-2025
    observedWarmingDelta: number; // modern - baseline
    baselinePrecipMean: number;
    modernPrecipMean: number;
    observedPrecipDeltaPct: number;
    baselineExtremeHeatDays: number;
    modernExtremeHeatDays: number;
    futureExtremeHeatDays2050: number;
    currentDroughtRiskLevel: 'Low' | 'Moderate' | 'High' | 'Severe' | 'Extreme';
  };
  monthlyProfiles: MonthlyProfile[];
  scenarios: {
    ssp126: ScenarioProjection;
    ssp245: ScenarioProjection;
    ssp585: ScenarioProjection;
  };
}

export interface AiBriefingResponse {
  summary: string;
  thermalAnalysis: string;
  waterCycleAnalysis: string;
  vulnerabilityFactors: string[];
  adaptationRecommendations: string[];
  keyRiskRating: 'Moderate' | 'Elevated' | 'High' | 'Severe';
}
