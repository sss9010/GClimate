# GeoClimate Atlas: Regional Climate History & IPCC CMIP6 Projections

An interactive geospatial climate analytics platform that visualizes historical weather records and projects multi-decade climate trajectories for any global coordinate using NASA POWER satellite observational data and IPCC CMIP6 multi-model climate scenarios.

> [!IMPORTANT] Critical Confirmed Requirements & Architectural Baseline
> - **Climate Data Engine**: NASA POWER (Prediction of Worldwide Energy Resources) historical satellite-calibrated observations (1984–present) coupled with Open-Meteo IPCC CMIP6 multi-model projections (SSP1-2.6, SSP2-4.5, and SSP5-8.5 emissions scenarios through 2050/2100).
> - **Climate Impact Indicators**: Comprehensive thermal (mean temperature, heating/cooling degree days, heatwave frequencies, anomaly spreads) and hydrological cycles (cumulative precipitation, drought risk indices, heavy downpour anomalies).
> - **Visual & Spatial Design**: Atmospheric geospatial observatory with an interactive procedural 3D Earth globe, interactive regional pin drops, coordinated choropleth heatmap projections, and multi-model trajectory charts.

---

### 1. Overview & Core Concept

**GeoClimate Atlas** enables researchers, urban planners, environmental analysts, and curious global citizens to explore long-term climate dynamics for any locality on Earth. By pairing 40+ years of empirical NASA POWER observation data with CMIP6 climate model projections, the platform turns abstract climate science into tangible, localized risk assessments and trend comparisons.

- **What It Does**:
  - **Global 3D Earth Navigation**: Smoothly rotate, zoom, and select preset climate hotspots (e.g., Arctic Archipelago, Sahel, Mediterranean Basin, US Pacific Northwest, Amazon Basin, Gangetic Plain) or search any custom city/coordinates.
  - **Historical Baseline vs. Modern Delta**: Compares a historical climatological reference period (1985–2005) against modern observations (2006–2025) to quantify observed warming, precipitation shifts, and heat anomaly days.
  - **Multi-Scenario Predictive Modeling**: Displays probabilistic future trajectories through 2050 and 2100 under three canonical IPCC Shared Socioeconomic Pathways:
    - *SSP1-2.6* (Aggressive mitigation / Paris Agreement target)
    - *SSP2-4.5* (Middle of the road / current global policy trajectory)
    - *SSP5-8.5* (High emissions / unconstrained fossil-fueled development)
  - **Thermal & Hydrological Dual Analysis**: Coordinated dual-axis charts, seasonal shift matrices, anomaly ribbons, and extreme event probability curves.
  - **AI Regional Synthesis**: Automated, scientific executive briefings generated via server-side Gemini 3.8 Flash, highlighting biome-level vulnerability, agricultural impacts, and water security risks.

---

### 2. User Experience & Visual Design

#### A. Key User Flows
1. **Landing & Exploration**: The user lands on a deep cosmic viewport featuring a rotating 3D Earth illuminated by procedural atmospheric scattering, continent contours, and active thermal anomaly overlays. Quick-select region pills (e.g., *"Mediterranean"*, *"Sahel"*, *"Tokyo"*, *"Phoenix"*, *"London"*, *"São Paulo"*) allow immediate 1-click focus.
2. **Coordinate & Location Search**: A dedicated search bar with geocoding resolves any city, region, or custom latitude/longitude coordinate with instant camera flight transitions to the target coordinate.
3. **Comparative Analysis Console**:
   - **Climatogram & Multi-Decade Timeline**: Interactive timeline slider scrubbing from 1985 to 2100.
   - **Historical vs. Future Anomaly Curves**: Dual-band charts displaying temperature shifts ($\Delta^\circ\text{C}$) and precipitation variances ($\Delta\%$) with CMIP6 model spread confidence bands.
   - **Seasonal Climatology Shift**: Radar / polar chart comparing the 12-month temperature and rainfall envelope between the 1990 baseline, 2025 current state, and 2050 projected state.
   - **Extreme Event Indicators**: Quantitative telemetry cards tracking Days $>35^\circ\text{C}$, consecutive dry days (CDD), and intense precipitation frequency.
4. **AI Vulnerability Briefing**: On-demand climate risk summary that synthesizes local anomalies into actionable ecological, agricultural, and infrastructure takeaways.

#### B. Visual Identity & Palette Discipline (60-30-10)
- **60% Primary Deep Space Canvas**: `#07090E` (Obsidian void with subtle starlight field) and `#0B0F19` (workbench stage).
- **30% Structural Surfaces & Panels**: Flat `#111827` panels with crisp 1px hairline borders (`#1F2937`) and subtle coordinate grid lines (`rgba(255,255,255,0.06)`).
- **10% Calibrated Telemetry Accents**:
  - Cyan phosphor (`#06B6D4` / `#38BDF8`) for baseline records and water cycle indices.
  - Solar amber (`#F59E0B`) for historical warming anomalies.
  - Thermal crimson (`#EF4444`) for high-emissions SSP5-8.5 projections.
  - Emerald leaf (`#10B981`) for SSP1-2.6 sustainability scenarios.
- **Typography**:
  - Primary UI & Titles: *Plus Jakarta Sans* / *DM Sans* for clean, modern readability.
  - Data, Coordinates & Metrics: *JetBrains Mono* / *IBM Plex Mono* (`tabular-nums`) for jitter-free numbers, degree anomalies, and coordinates.

---

### 3. Key Product Decisions & Trade-Offs

#### Decision 1: Hybrid Climate Data Pipeline (NASA POWER + IPCC CMIP6)
- **Chosen Approach**: Combine NASA POWER API (`https://power.larc.nasa.gov/api/temporal/monthly/point`) for high-resolution historical observations (1984–present) with Open-Meteo Climate API (downscaled CMIP6 ensembles across MPI-ESM1-2-HR, EC-Earth3P-HR, and MRI-ESM2-0 models for SSP1-2.6, SSP2-4.5, SSP5-8.5).
- **Why**: NASA POWER provides gold-standard solar and meteorological satellite observations calibrated against ground stations, while CMIP6 is the authoritative global climate model standard endorsed by the IPCC AR6.
- **Resilience Strategy**: Server-side Express proxy with in-memory caching and pre-computed regional archetypes to guarantee instantaneous loading and smooth offline/fallback capabilities.

#### Decision 2: 3D Geospatial Globe with Three.js (Zero 404s, PBR Materials)
- **Chosen Approach**: Procedural 3D Earth built using Three.js: procedural Canvas-generated continent landmasses, latitude/longitude graticule mesh, atmospheric rim shader, dynamic heatmap points, and smooth spherical coordinate navigation (`OrbitControls` with spherical interpolation).
- **Why**: Avoids large external raster texture downloads that fail or trigger CORS/404 errors, ensuring 100% reliable execution in sandboxed environments while delivering smooth 60fps rendering.

#### Decision 3: Collapsible Bottom Control Dock
- **Chosen Approach**: Following 3D/Spatial UI guidelines, controls (scenario selector, variable toggles, metric tabs, timeline scrubber) are anchored into a collapsible bottom glass dock, preserving an unobstructed 3D view of the Earth and regional heatmap.

#### Decision 4: Server-Side Gemini 3.8 Flash for Climate Synthesis
- **Chosen Approach**: Server-side proxy (`/api/climate/summarize`) using the `@google/genai` SDK with model `gemini-3.8-flash` to generate rigorous scientific summaries with structured ecological and socioeconomic impact categories.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            GEO-CLIMATE ATLAS                                │
│                                                                             │
│  ┌───────────────────────┐  ┌────────────────────────────────────────────┐  │
│  │   TOP STATUS BAR      │  │ Coordinate / City Search & Quick Presets   │  │
│  └───────────────────────┘  └────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────┬─────────────────────────────────┐  │
│  │                                     │                                 │  │
│  │     PROCEDURAL 3D EARTH GLOBE       │    REGIONAL CLIMATE INSPECTOR   │  │
│  │      - Continent Landmasses         │    - Historical vs Future KPI   │  │
│  │      - Graticules & Atmosphere      │    - Multi-Model CMIP6 Chart    │  │
│  │      - Target Pin & Heat Anomaly    │    - Seasonal Radar Distribution│  │
│  │      - Smooth Camera Flight         │    - Hydrological Drought Gauge │  │
│  │                                     │    - AI Executive Summary Card  │  │
│  │                                     │                                 │  │
│  └─────────────────────────────────────┴─────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ COLLAPSIBLE CONTROL DOCK: Metric (Temp / Precip / Extremes) |         │  │
│  │ Scenarios (SSP1-2.6, SSP2-4.5, SSP5-8.5) | Timeline 1985-2100 Slider │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EXPRESS BACKEND PROXY (server.ts)                      │
│                                                                             │
│  ├── /api/climate/historical   ──> NASA POWER API (monthly T2M & PRECTOT)   │
│  ├── /api/climate/projections  ──> CMIP6 Multi-Model Ensembles              │
│  ├── /api/climate/summarize    ──> GoogleGenAI SDK (gemini-3.8-flash)       │
│  └── In-Memory LRU Cache       ──> Low-latency regional dataset cache       │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Key State & Interactive Controls
- `selectedLocation`: `{ name: string, lat: number, lon: number, elevation?: number, biome?: string }`
- `activeScenario`: `'ssp126' | 'ssp245' | 'ssp585'`
- `selectedMetric`: `'temperature' | 'precipitation' | 'extremes' | 'seasonal'`
- `timelineYear`: Current scrubbed year ($1985 \le Y \le 2100$)
- `climateData`: Historical records, 30-year climatological normals, CMIP6 projection series, and anomaly statistics.
- `aiSummary`: Loading, cached, or rendered markdown synthesis.

---

### 5. Verification & Quality Plan

- **Compilation Verification**: Full TypeScript compilation and Vite build with `@tailwindcss/vite`.
- **API Error Handling & Resilience**: Graceful fallback data generation if external APIs hit rate limits or downtime.
- **Three.js Performance Guard**: Proper disposal of geometries/materials, zero GC in animation loop, and software WebGL detection.
- **Accessibility & Anti-Slop Enforcement**: Zero unboxed pill badges, tabular numerals for all telemetry, full keyboard & mouse control, and high-contrast scientific color encoding.
