import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { WORLD_CITIES, WorldCity } from '../data/worldLocations';

interface EarthGlobeProps {
  selectedLat: number;
  selectedLon: number;
  selectedName: string;
  anomalyDelta: number; // e.g. +1.4°C
  precipDeltaPct: number; // e.g. -8.5%
  extremeHeatDays: number; // e.g. 35 days
  activeMetric: 'temperature' | 'precipitation' | 'extremes';
  onSelectLocation: (loc: { lat: number; lon: number; name: string }) => void;
  timelineYear: number;
}

/**
 * Determine dynamic land fill & border color based on the selected metric & anomaly value
 */
function getDynamicLandColors(
  metric: 'temperature' | 'precipitation' | 'extremes',
  tempAnomaly: number,
  precipAnomaly: number,
  heatDays: number
): { fillColor: string; strokeColor: string; label: string; scaleProgress: number } {
  if (metric === 'temperature') {
    const t = Math.max(0, Math.min(5, tempAnomaly));
    const progress = t / 5;

    if (t <= 0.6) {
      return {
        fillColor: '#1e293b',
        strokeColor: '#38bdf8',
        label: 'Near Baseline (<+0.6°C)',
        scaleProgress: progress,
      };
    } else if (t <= 1.3) {
      return {
        fillColor: '#1e3a4c',
        strokeColor: '#22d3ee',
        label: 'Mild Warming (+0.7 to +1.3°C)',
        scaleProgress: progress,
      };
    } else if (t <= 2.0) {
      return {
        fillColor: '#5c3d18',
        strokeColor: '#fbbf24',
        label: 'Moderate Warming (+1.4 to +2.0°C)',
        scaleProgress: progress,
      };
    } else if (t <= 3.0) {
      return {
        fillColor: '#7c2d12',
        strokeColor: '#f97316',
        label: 'Severe Warming (+2.1 to +3.0°C)',
        scaleProgress: progress,
      };
    } else if (t <= 4.0) {
      return {
        fillColor: '#881337',
        strokeColor: '#f43f5e',
        label: 'Extreme Heating (+3.1 to +4.0°C)',
        scaleProgress: progress,
      };
    } else {
      return {
        fillColor: '#450a0a',
        strokeColor: '#ef4444',
        label: 'Catastrophic Warming (>+4.0°C)',
        scaleProgress: progress,
      };
    }
  } else if (metric === 'precipitation') {
    const p = precipAnomaly;
    const progress = Math.max(0, Math.min(1, (p + 25) / 50));

    if (p <= -15) {
      return {
        fillColor: '#78350f',
        strokeColor: '#d97706',
        label: 'Severe Drying / Drought (<-15%)',
        scaleProgress: progress,
      };
    } else if (p <= -5) {
      return {
        fillColor: '#57534e',
        strokeColor: '#a8a29e',
        label: 'Moderate Drying (-5% to -15%)',
        scaleProgress: progress,
      };
    } else if (p <= 5) {
      return {
        fillColor: '#1e293b',
        strokeColor: '#38bdf8',
        label: 'Stable Moisture (±5%)',
        scaleProgress: progress,
      };
    } else if (p <= 15) {
      return {
        fillColor: '#0f4c5c',
        strokeColor: '#2dd4bf',
        label: 'Elevated Rainfall (+5% to +15%)',
        scaleProgress: progress,
      };
    } else {
      return {
        fillColor: '#0c4a6e',
        strokeColor: '#38bdf8',
        label: 'Extreme Precipitation (>+15%)',
        scaleProgress: progress,
      };
    }
  } else {
    const days = Math.max(0, heatDays);
    const progress = Math.min(1, days / 70);

    if (days <= 10) {
      return {
        fillColor: '#1e293b',
        strokeColor: '#38bdf8',
        label: 'Low Recurrence (<10 days/yr)',
        scaleProgress: progress,
      };
    } else if (days <= 25) {
      return {
        fillColor: '#4338ca',
        strokeColor: '#818cf8',
        label: 'Moderate Recurrence (10-25 days/yr)',
        scaleProgress: progress,
      };
    } else if (days <= 45) {
      return {
        fillColor: '#7c2d12',
        strokeColor: '#fb923c',
        label: 'High Heat Recurrence (25-45 days/yr)',
        scaleProgress: progress,
      };
    } else {
      return {
        fillColor: '#7f1d1d',
        strokeColor: '#f87171',
        label: 'Critical Extreme Heat (>45 days/yr)',
        scaleProgress: progress,
      };
    }
  }
}

/**
 * Render procedural 4096x2048 Earth canvas with fully connected Fenno-Scandinavia,
 * Baltic Sea (Finland, Estonia, Latvia, Lithuania), Baja California, and crisp non-intersecting coastlines.
 */
function renderEarthCanvas(
  canvas: HTMLCanvasElement,
  metric: 'temperature' | 'precipitation' | 'extremes',
  tempAnomaly: number,
  precipAnomaly: number,
  heatDays: number
) {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d')!;

  const { fillColor, strokeColor } = getDynamicLandColors(metric, tempAnomaly, precipAnomaly, heatDays);

  // Deep ocean background
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#020617');
  oceanGrad.addColorStop(0.25, '#071527');
  oceanGrad.addColorStop(0.5, '#040f1c');
  oceanGrad.addColorStop(0.75, '#071527');
  oceanGrad.addColorStop(1, '#020617');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Coordinate graticules
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
  ctx.lineWidth = 1.5;

  for (let lat = -75; lat <= 75; lat += 15) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  for (let lon = -180; lon <= 180; lon += 30) {
    const x = ((lon + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Equator line
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
  const equatorY = height / 2;
  ctx.beginPath();
  ctx.moveTo(0, equatorY);
  ctx.lineTo(width, equatorY);
  ctx.stroke();

  const toXY = (lon: number, lat: number): [number, number] => {
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return [x, y];
  };

  const drawPoly = (coords: [number, number][], customFill?: string, customStroke?: string) => {
    if (coords.length < 3) return;
    ctx.beginPath();
    const [startX, startY] = toXY(coords[0][0], coords[0][1]);
    ctx.moveTo(startX, startY);
    for (let i = 1; i < coords.length; i++) {
      const [px, py] = toXY(coords[i][0], coords[i][1]);
      ctx.lineTo(px, py);
    }
    ctx.closePath();

    ctx.fillStyle = customFill || fillColor;
    ctx.fill();

    ctx.strokeStyle = customStroke || strokeColor;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  // 1. EURASIA + FENNO-SCANDINAVIA + BALTIC STATES
  // Traces Western Europe -> Denmark -> Baltic coast (Poland, Lithuania, Latvia, Estonia)
  // -> Gulf of Finland -> Finland -> Bothnia -> Scandinavia (Sweden, Norway, North Cape)
  // -> Russia Arctic -> Asia -> India -> Arabia -> Mediterranean
  drawPoly([
    // Gibraltar & Iberian Peninsula
    [-5.5, 36], [-9, 37], [-9.3, 38.7], [-9.3, 43], [-2, 43.5],
    // France Atlantic & English Channel coast
    [-1.5, 46], [-4.5, 48.5], [-1, 49.5], [1.5, 50],
    // Low Countries & Germany North Sea
    [3.5, 51.5], [5, 52.5], [7, 53.5], [8.5, 54],
    // Jutland Peninsula (Denmark)
    [8.5, 55], [8.2, 56.5], [10, 57.7], [10.5, 56.5], [9.8, 55], [10.5, 54.5],
    // Germany Baltic Coast
    [11.5, 54], [14, 54],
    // Poland Baltic Coast (Pomerania & Gdansk Bay)
    [15.5, 54.2], [18.5, 54.5], [19.5, 54.4],
    // LITHUANIA (Curonian Spit & Baltic Shore)
    [21, 55.2], [21, 56],
    // LATVIA (Courland, Gulf of Riga)
    [21, 56.8], [21.5, 57.5], [22.5, 57.7], // Cape Kolka
    [24, 57], // Riga / South Gulf of Riga
    [24.5, 57.8], // Latvia-Estonia border on Riga Gulf
    // ESTONIA (Pärnu, Gulf of Finland southern shore, Tallinn, Narva)
    [24, 58.4], [23.5, 58.8], [24.5, 59.4], // Tallinn
    [26, 59.5], [28, 59.4], // Narva
    // RUSSIA (Eastern end of Gulf of Finland / St. Petersburg)
    [30, 59.9],
    // FINLAND (South coast, Helsinki, Turku, Archipelago Sea)
    [28, 60.5], [25, 60.2], // Helsinki
    [22.5, 60.4], // Turku
    // GULF OF BOTHNIA - FINNISH SHORE (Heading North)
    [21.5, 61.5], [21.5, 63], [22.5, 64], [25, 65],
    [24.5, 65.8], // Tornio / Head of Gulf of Bothnia (LAND CONNECTION TO SWEDEN!)
    // GULF OF BOTHNIA - SWEDISH SHORE (Heading South)
    [23.5, 65.8], [21.5, 65], [18.5, 63], [17.5, 61],
    // SWEDEN BALTIC COAST & SKÅNE
    [18, 59.5], // Stockholm area
    [16.5, 58], [16, 56.5], [14.5, 56],
    [13, 55.5], // Skåne (Southern tip of Sweden across from Denmark)
    // SWEDEN WEST COAST & OSLO FJORD
    [12.5, 56.5], [12, 57.8], [11, 59],
    [10.5, 59.5], // Oslo Fjord
    // NORWAY SOUTH & ATLANTIC FJORD COAST (Heading North)
    [8, 58], [6, 58.5],
    [5, 60.5], // Bergen
    [5, 62], [7, 63], [10, 65], [13, 67], [15, 68.5], // Lofoten
    [19, 70], [24, 71],
    [28, 71.2], // NORTH CAPE (Nordkapp)
    // NORWEGIAN FINNMARK & KOLA PENINSULA (Connected into Russia)
    [31, 70.5], // Kirkenes
    [36, 69], [40, 68], [41, 66], [38, 66], [35, 66.5],
    // RUSSIAN ARCTIC COAST (White Sea to Bering Strait)
    [40, 65], [44, 67], [50, 68], [65, 69], [75, 71],
    [90, 73], [110, 73], [130, 72], [155, 71], [170, 69], [178, 65],
    // PACIFIC COAST (Kamchatka, Okhotsk, Amur)
    [165, 56], [156, 51], [142, 47], [136, 42],
    // KOREAN PENINSULA
    [130, 39], [129, 35.5], [126, 34.5], [126, 37.5], [125, 39],
    // CHINA COAST & TAIWAN STRAIT
    [122, 37], [121, 31], [118, 25], [114, 22], [108, 21],
    // INDOCHINA & MALAY PENINSULA
    [106, 17], [107, 11], [104, 9], [101, 3], [103, 1.3], [100, 6], [98, 12],
    // BAY OF BENGAL & INDIAN SUBCONTINENT
    [92, 19], [88, 22], [85, 20], [82, 17], [80, 13],
    [77.5, 8.1], // Cape Comorin (South Tip of India)
    [75, 12], [73, 16], [72.8, 19], [70, 21], [68.5, 24],
    // ARABIAN SEA & PERSIAN GULF
    [64, 25], [58, 24], [55, 26], [50, 28], [48, 30],
    // ARABIAN PENINSULA
    [52, 24], [55, 22], [58, 16], [54, 14], [45, 12.5], [43, 15], [38, 22], [35, 28],
    // RED SEA, LEVANT & ANATOLIA (Turkey)
    [35.5, 33], [36, 36], [34, 37], [30, 36.5], [27, 37], [26, 40],
    // GREECE & BALKANS
    [24, 38], [23, 36.5], [21.5, 37.5], [20, 39.5], [18, 41],
    // ITALIAN BOOT
    [15.5, 41], [18, 40.2], [16.5, 39], [15.5, 38.2], // Toe
    [15, 39.5], [13.5, 41.5], [11, 43], [9, 44], // West Italian coast
    // FRENCH RIVIERA & MEDITERRANEAN SPAIN
    [5, 43], [3, 42], [0, 40], [-2, 38], [-5.5, 36]
  ]);

  // BRITISH ISLES
  // Great Britain
  drawPoly([
    [-5, 50], [-3, 50.5], [-0.5, 51.5], [1.5, 52.5], [0, 54], [-1, 56],
    [-2, 58], [-4.5, 58.5], [-5.5, 56.5], [-4.5, 53], [-5, 51], [-5, 50]
  ]);
  // Ireland
  drawPoly([
    [-10, 52], [-7.5, 51.5], [-6, 52.5], [-6, 54.5], [-7.5, 55], [-10, 54.2], [-10.5, 53], [-10, 52]
  ]);

  // JAPAN
  drawPoly([
    [130, 31.5], [131.5, 33], [133.5, 34], [136, 35], [138, 36.5],
    [141, 40], [142, 43.5], [144, 44], [141, 45.5], [140, 44],
    [136, 37], [133, 35], [130, 32], [130, 31.5]
  ]);

  // 2. NORTH AMERICA (Explicitly modeling Baja California, Florida, Alaska, Hudson Bay)
  drawPoly([
    // Alaska & Arctic North
    [-168, 65], [-160, 71], [-145, 70], [-130, 70], [-115, 69], [-95, 72],
    [-85, 68], [-80, 62], [-82, 54], [-90, 52], [-92, 56], [-88, 62],
    [-80, 62], [-65, 58], [-55, 52],
    // Canada Atlantic & St. Lawrence
    [-60, 48], [-65, 44], [-70, 43], [-74, 40],
    // US East Coast & Florida Peninsula
    [-75, 36], [-79, 32], [-81, 28], [-80.5, 25], // South Florida tip
    [-82, 25.5], [-82.5, 28], [-84, 30], // Florida Gulf Coast
    // Gulf of Mexico & Texas
    [-88, 30], [-92, 29.5], [-97, 26], [-97, 21],
    // Yucatan Peninsula
    [-91, 19], [-87.5, 21.5], [-87, 18.5],
    // Central America Isthmus
    [-88, 15.5], [-85, 12], [-83, 10], [-79, 9], [-77.5, 8],
    // Pacific Central America & South Mexico
    [-84, 9.5], [-88, 13], [-94, 15.5], [-98, 16], [-102, 18], [-105, 20],
    // Mexico West Coast (Mainland side of Gulf of California)
    [-106, 23], [-108, 25], [-111, 28], [-113, 30], [-114.8, 31.8], // Colorado River Delta
    // BAJA CALIFORNIA PENINSULA (Iconic long slender peninsula)
    [-114, 30], [-112.5, 28], [-111, 26], [-110, 24.5], [-109.8, 22.8], // Cabo San Lucas
    [-110.5, 23.5], [-111.5, 25], [-113, 27], [-114.5, 29], [-116, 31], [-117.2, 32.5], // West Baja coast
    // California, Oregon, Washington
    [-120, 34.5], [-124, 40], [-124.5, 48],
    // British Columbia & Alaska Panhandle
    [-128, 52], [-132, 55], [-136, 58], [-145, 60], [-155, 58], [-162, 55], [-166, 60],
    [-168, 65]
  ]);

  // GREENLAND
  drawPoly([
    [-45, 60], [-35, 65], [-20, 70], [-18, 77], [-25, 82], [-40, 83],
    [-55, 82], [-68, 77], [-60, 72], [-52, 65], [-45, 60]
  ]);

  // 3. SOUTH AMERICA
  drawPoly([
    [-77, 10], [-72, 12], [-64, 11], [-55, 6], [-50, 0], [-42, -2.5],
    [-35, -5], [-35, -10], [-38, -13], [-39, -18], [-42, -23], [-48, -27],
    [-53, -33], [-58, -38], [-65, -42], [-66, -48], [-65, -55], [-72, -55],
    [-75, -50], [-74, -43], [-72, -35], [-71, -28], [-75, -20], [-77, -13],
    [-81, -5], [-80, 2], [-77, 8], [-77, 10]
  ]);

  // 4. AFRICA
  drawPoly([
    [-5.5, 36], [0, 36], [10, 37], [12, 34], [15, 32], [22, 32], [26, 32],
    [32, 31.5], [33, 28], [37, 22], [42, 15], [44, 12], [51, 10], [48, 5],
    [42, -2], [40, -10], [35, -20], [33, -27], [30, -32], [25, -34.5],
    [19, -34.8], // Cape of Good Hope
    [17, -33], [14, -26], [12, -18], [11, -8], [9, 0], [4, 4],
    [2, 6], [-4, 5], [-8, 4], [-12, 5], [-15, 10], [-17, 15],
    [-17, 21], [-13, 28], [-10, 32], [-5.5, 36]
  ]);

  // MADAGASCAR
  drawPoly([[44, -12], [50, -14], [48, -25], [44, -25], [43, -16], [44, -12]]);

  // 5. AUSTRALIA & OCEANIA
  drawPoly([
    [114, -22], [118, -20], [123, -16], [128, -14], [134, -12], [138, -12],
    [142, -10], // Cape York
    [144, -14], [148, -20], [152, -25], [153, -28], [150, -35], [146, -38],
    [140, -38], [135, -34], [128, -32], [122, -34], [116, -35], [114, -30],
    [114, -22]
  ]);

  // TASMANIA
  drawPoly([[145, -41], [148, -41], [148, -43.5], [144.5, -43.5], [145, -41]]);

  // NEW ZEALAND
  drawPoly([[173, -35], [178, -38], [175, -41.5], [173, -40], [173, -35]]);
  drawPoly([[167, -45], [171, -42], [174, -42], [170, -46.5], [167, -45]]);

  // 6. ANTARCTICA
  drawPoly([
    [-180, -78], [-140, -74], [-100, -70], [-65, -64], [-60, -68],
    [-30, -72], [0, -70], [30, -68], [60, -66], [90, -66],
    [120, -66], [150, -70], [180, -78], [180, -90], [-180, -90], [-180, -78]
  ], '#334155', '#94a3b8');
}

export const EarthGlobe: React.FC<EarthGlobeProps> = ({
  selectedLat,
  selectedLon,
  selectedName,
  anomalyDelta,
  precipDeltaPct,
  extremeHeatDays,
  activeMetric,
  onSelectLocation,
  timelineYear,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const pinGroupRef = useRef<THREE.Group | null>(null);
  const hotspotGroupRef = useRef<THREE.Group | null>(null);

  // Interaction tracking
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });

  // Lat/Lon to Sphere Vector3
  const latLonToVector3 = useCallback((lat: number, lon: number, radius = 5): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  }, []);

  // Center globe on selected location
  useEffect(() => {
    const targetY = -((selectedLon + 90) * (Math.PI / 180));
    const targetX = (selectedLat * (Math.PI / 180)) * 0.7;
    targetRotation.current = { x: targetX, y: targetY };

    if (pinGroupRef.current) {
      const pinPos = latLonToVector3(selectedLat, selectedLon, 5.06);
      pinGroupRef.current.position.copy(pinPos);
      pinGroupRef.current.lookAt(pinPos.clone().multiplyScalar(2));
    }
  }, [selectedLat, selectedLon, latLonToVector3]);

  // Dynamically update procedural canvas texture whenever active metric or anomaly changes
  useEffect(() => {
    if (canvasRef.current && textureRef.current) {
      renderEarthCanvas(canvasRef.current, activeMetric, anomalyDelta, precipDeltaPct, extremeHeatDays);
      textureRef.current.needsUpdate = true;
    }
  }, [activeMetric, anomalyDelta, precipDeltaPct, extremeHeatDays]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 14;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // Initialize 4096x2048 high-definition procedural Earth canvas
    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 2048;
    canvasRef.current = canvas;
    renderEarthCanvas(canvas, activeMetric, anomalyDelta, precipDeltaPct, extremeHeatDays);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    textureRef.current = texture;

    // High segment resolution Earth Sphere
    const earthGeometry = new THREE.SphereGeometry(5, 96, 96);
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);

    // Atmospheric Glow Shell
    const atmosphereGeometry = new THREE.SphereGeometry(5.2, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0, 0, 1.0)), 2.2);
          gl_FragColor = vec4(0.22, 0.74, 0.97, 1.0) * intensity * 0.8;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphereMesh);

    // Starlight Background
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = isSoftwareGl ? 300 : 900;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 40 + Math.random() * 60;
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = radius * Math.cos(phi);
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.7,
      transparent: true,
      opacity: 0.45,
    });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

    // Hotspot markers for major world cities
    const hotspotGroup = new THREE.Group();
    hotspotGroupRef.current = hotspotGroup;
    globeGroup.add(hotspotGroup);

    WORLD_CITIES.forEach(loc => {
      const pos = latLonToVector3(loc.lat, loc.lon, 5.04);
      const markerGeom = new THREE.SphereGeometry(0.08, 12, 12);
      const markerMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.85,
      });
      const marker = new THREE.Mesh(markerGeom, markerMat);
      marker.position.copy(pos);
      marker.userData = { location: loc };
      hotspotGroup.add(marker);
    });

    // Active Location Pin
    const pinGroup = new THREE.Group();
    pinGroupRef.current = pinGroup;
    const initialPinPos = latLonToVector3(selectedLat, selectedLon, 5.06);
    pinGroup.position.copy(initialPinPos);
    pinGroup.lookAt(initialPinPos.clone().multiplyScalar(2));

    const stemGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
    stemGeom.rotateX(Math.PI / 2);
    const stemMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const stem = new THREE.Mesh(stemGeom, stemMat);
    pinGroup.add(stem);

    const headGeom = new THREE.SphereGeometry(0.14, 16, 16);
    const headMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.z = 0.28;
    pinGroup.add(head);

    const ringGeom = new THREE.RingGeometry(0.18, 0.28, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    pinGroup.add(ring);

    globeGroup.add(pinGroup);

    // Lighting Rig
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(12, 8, 14);
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.65);
    scene.add(hemiLight);

    const initialY = -((selectedLon + 90) * (Math.PI / 180));
    const initialX = (selectedLat * (Math.PI / 180)) * 0.7;
    targetRotation.current = { x: initialX, y: initialY };
    currentRotation.current = { x: initialX, y: initialY };
    globeGroup.rotation.x = initialX;
    globeGroup.rotation.y = initialY;

    let frameId = 0;
    const clock = new THREE.Clock();

    function renderLoop() {
      const delta = clock.getDelta();

      if (!isDragging.current) {
        currentRotation.current.x = THREE.MathUtils.damp(
          currentRotation.current.x,
          targetRotation.current.x,
          5,
          delta
        );
        currentRotation.current.y = THREE.MathUtils.damp(
          currentRotation.current.y,
          targetRotation.current.y,
          5,
          delta
        );
      }

      globeGroup.rotation.x = currentRotation.current.x;
      globeGroup.rotation.y = currentRotation.current.y;
      starField.rotation.y += 0.0002;

      const time = clock.getElapsedTime();
      ring.scale.setScalar(1 + Math.sin(time * 3) * 0.25);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(renderLoop);
    }

    renderLoop();

    const dom = renderer.domElement;

    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      currentRotation.current.y += deltaX * 0.005;
      currentRotation.current.x += deltaY * 0.005;
      targetRotation.current.y = currentRotation.current.y;
      targetRotation.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, currentRotation.current.x));

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const newZ = camera.position.z + e.deltaY * 0.008;
      camera.position.z = Math.max(8, Math.min(24, newZ));
    };

    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = dom.getBoundingClientRect();
      mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVector.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseVector, camera);
      const intersects = raycaster.intersectObjects(hotspotGroup.children);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData?.location) {
          const loc = hit.userData.location as WorldCity;
          onSelectLocation({ lat: loc.lat, lon: loc.lon, name: `${loc.name}, ${loc.country}` });
        }
      }
    };

    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('click', onClick);

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w && h && renderer && camera) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frameId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('click', onClick);
      resizeObserver.disconnect();

      earthGeometry.dispose();
      earthMaterial.dispose();
      texture.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
      stemGeom.dispose();
      stemMat.dispose();
      headGeom.dispose();
      headMat.dispose();
      ringGeom.dispose();
      ringMat.dispose();
      renderer.dispose();
    };
  }, [latLonToVector3, onSelectLocation]);

  const activeColorInfo = getDynamicLandColors(activeMetric, anomalyDelta, precipDeltaPct, extremeHeatDays);

  return (
    <div className="relative w-full h-full min-h-[480px] flex items-center justify-center overflow-hidden rounded-xl border border-slate-800/80 bg-[#07090e]">
      {/* Three.js Isolated Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Spatial HUD Overlay (Top-Left) */}
      <div className="absolute top-4 left-4 pointer-events-none z-10 flex flex-col gap-1.5 bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-200">GEO-SPATIAL OBSERVATORY</span>
          <span>·</span>
          <span>NASA POWER</span>
          <span>·</span>
          <span>CMIP6</span>
        </div>
        <div className="text-sm font-medium text-white flex items-center gap-2">
          <span>{selectedName}</span>
          <span className="font-mono text-xs text-cyan-400 tabular-nums">
            [{selectedLat >= 0 ? `${selectedLat.toFixed(2)}°N` : `${Math.abs(selectedLat).toFixed(2)}°S`},{' '}
            {selectedLon >= 0 ? `${selectedLon.toFixed(2)}°E` : `${Math.abs(selectedLon).toFixed(2)}°W`}]
          </span>
        </div>

        {/* Dynamic Parameter Readout */}
        <div className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
          <span className="text-slate-400">Parameter:</span>
          <span className="font-semibold text-cyan-300 uppercase font-mono">{activeMetric}</span>
          <span>·</span>
          <span>Timeline: {timelineYear}</span>
        </div>
      </div>

      {/* Dynamic Land Parameter Color Scale Legend (Top-Right) */}
      <div className="absolute top-4 right-4 z-10 bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs flex flex-col gap-1.5 pointer-events-none">
        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wide flex items-center justify-between gap-4">
          <span>DYNAMIC LAND MAP COLOR</span>
          <span className="text-cyan-400 font-semibold">{activeMetric}</span>
        </div>

        {/* Color Gradient Bar */}
        <div className="w-48 h-2 rounded-full overflow-hidden relative border border-slate-700/60 mt-0.5">
          {activeMetric === 'temperature' && (
            <div className="w-full h-full bg-gradient-to-r from-slate-800 via-amber-700 via-orange-600 to-rose-700" />
          )}
          {activeMetric === 'precipitation' && (
            <div className="w-full h-full bg-gradient-to-r from-amber-800 via-slate-700 to-sky-600" />
          )}
          {activeMetric === 'extremes' && (
            <div className="w-full h-full bg-gradient-to-r from-slate-800 via-indigo-700 via-orange-600 to-red-700" />
          )}
          {/* Active pointer marker */}
          <div
            className="absolute top-0 bottom-0 w-1.5 bg-white shadow-sm -translate-x-1/2"
            style={{ left: `${Math.max(5, Math.min(95, activeColorInfo.scaleProgress * 100))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span className="text-slate-200 font-semibold">{activeColorInfo.label}</span>
          <span className="tabular-nums">
            {activeMetric === 'temperature'
              ? `${anomalyDelta > 0 ? `+${anomalyDelta.toFixed(2)}` : anomalyDelta.toFixed(2)}°C`
              : activeMetric === 'precipitation'
              ? `${precipDeltaPct > 0 ? `+${precipDeltaPct}` : precipDeltaPct}%`
              : `${extremeHeatDays} days`}
          </span>
        </div>
      </div>

      {/* Navigation hints (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 pointer-events-none z-10 text-[11px] text-slate-500 font-mono">
        DRAG TO ROTATE GLOBE · SCROLL TO ZOOM · CLICK CITY BEACONS
      </div>
    </div>
  );
};
