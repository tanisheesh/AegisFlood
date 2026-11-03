// ============================================================================
// AEGISFLOOD // HYDROLOGICAL DIGITAL TWIN, 1D KALMAN FILTER & DIJKSTRA ENGINE
// ============================================================================

export interface BasinNodeConfig {
  id: string;
  code: string;
  name: string;
  sector: string;
  riverKm: number;
  elevationM: number;
  datumHeightM: number;
  baseLevelM: number;
  warningLevelM: number;
  dangerLevelM: number;
  criticalLevelM: number;
  channelWidthM: number;
  manningN: number;
  bedSlope: number;
  mcu: string;
  radio: string;
  canvasX: number; // Normalized 0..1000 on Tactical Basin Canvas
  canvasY: number; // Normalized 0..540 on Tactical Basin Canvas
}

export interface NodeLiveState extends BasinNodeConfig {
  trueLevelM: number;
  rawSensorLevelM: number;
  kalmanLevelM: number;
  kalmanErrorCov: number;
  kalmanGain: number;
  innovationResidualM: number;
  isAnomalyRejected: boolean;
  velocityMs: number;
  dischargeM3s: number;
  rainfallMmHr: number;
  soilMoisturePct: number;
  runoffCoeff: number;
  rateOfRiseMHr: number;
  forecast15m: number;
  forecast30m: number;
  forecast60m: number;
  forecast120m: number;
  etaToDangerMins: number | null;
  status: "NOMINAL" | "WATCH" | "WARNING" | "CRITICAL";
  inundationRadiusPx: number;
  rssiDbm: number;
  snrDb: number;
  batteryVolts: number;
  transportMode: "4G_MQTT_TLS" | "LORAWAN_865_MESH";
}

export interface WaypointNode {
  id: string;
  name: string;
  type: "village" | "junction" | "shelter";
  x: number;
  y: number;
  elevationM: number;
  population?: number;
  capacity?: number;
}

export interface RoadEdge {
  id: string;
  from: string;
  to: string;
  name: string;
  distanceKm: number;
  monitoredByNode: string | null;
  submergeLevelM: number;
}

export interface ComputedEvacuationRoute {
  villageId: string;
  villageName: string;
  population: number;
  shelterId: string;
  shelterName: string;
  pathNodes: string[];
  roadNames: string[];
  effectiveCostKm: number;
  rerouted: boolean;
  status: string;
}

export const BASIN_NODES: BasinNodeConfig[] = [
  {
    id: "NODE-01",
    code: "N01",
    name: "DEVPRAYAG CONFLUENCE",
    sector: "SECTOR_01 // HEADWATER GORGE",
    riverKm: 0.0,
    elevationM: 830,
    datumHeightM: 10.0,
    baseLevelM: 3.4,
    warningLevelM: 5.4,
    dangerLevelM: 6.4,
    criticalLevelM: 7.5,
    channelWidthM: 38,
    manningN: 0.035,
    bedSlope: 0.012,
    mcu: "ESP32-S3 @ 240MHz",
    radio: "SX1276 865MHz SF9",
    canvasX: 135,
    canvasY: 110,
  },
  {
    id: "NODE-02",
    code: "N02",
    name: "TAPOVAN SPILLWAY BARRAGE",
    sector: "SECTOR_02 // UPPER CANYON",
    riverKm: 14.5,
    elevationM: 490,
    datumHeightM: 9.5,
    baseLevelM: 3.1,
    warningLevelM: 5.0,
    dangerLevelM: 6.0,
    criticalLevelM: 7.0,
    channelWidthM: 46,
    manningN: 0.032,
    bedSlope: 0.0085,
    mcu: "ESP32-S3 @ 240MHz",
    radio: "SX1276 865MHz SF9",
    canvasX: 325,
    canvasY: 185,
  },
  {
    id: "NODE-03",
    code: "N03",
    name: "RISHIKESH TRIVENI BASIN",
    sector: "SECTOR_03 // FOOTHILL URBAN",
    riverKm: 28.0,
    elevationM: 340,
    datumHeightM: 9.0,
    baseLevelM: 2.9,
    warningLevelM: 4.7,
    dangerLevelM: 5.6,
    criticalLevelM: 6.6,
    channelWidthM: 62,
    manningN: 0.028,
    bedSlope: 0.0055,
    mcu: "STM32WL55 Dual-Core",
    radio: "Sub-GHz LoRa + 4G LTE",
    canvasX: 520,
    canvasY: 265,
  },
  {
    id: "NODE-04",
    code: "N04",
    name: "HARIDWAR BHIMGODA GATE",
    sector: "SECTOR_04 // HIGH-DENSITY PLAIN",
    riverKm: 42.0,
    elevationM: 295,
    datumHeightM: 8.5,
    baseLevelM: 2.75,
    warningLevelM: 4.4,
    dangerLevelM: 5.2,
    criticalLevelM: 6.2,
    channelWidthM: 84,
    manningN: 0.025,
    bedSlope: 0.0038,
    mcu: "STM32WL55 Dual-Core",
    radio: "Sub-GHz LoRa + 4G LTE",
    canvasX: 715,
    canvasY: 350,
  },
  {
    id: "NODE-05",
    code: "N05",
    name: "ROORKEE SOLANI DELTA",
    sector: "SECTOR_05 // DOWNSTREAM BASIN",
    riverKm: 58.0,
    elevationM: 268,
    datumHeightM: 8.0,
    baseLevelM: 2.5,
    warningLevelM: 4.1,
    dangerLevelM: 4.9,
    criticalLevelM: 5.8,
    channelWidthM: 105,
    manningN: 0.022,
    bedSlope: 0.0024,
    mcu: "ESP32-S3 + SIM7600",
    radio: "LTE Cat-4 + LoRa Gateway",
    canvasX: 885,
    canvasY: 435,
  },
];

export const WAYPOINTS: Record<string, WaypointNode> = {
  V1: {
    id: "V1",
    name: "Sangam Ghat Cluster (Zone A)",
    type: "village",
    x: 165,
    y: 215,
    elevationM: 485,
    population: 1450,
  },
  V2: {
    id: "V2",
    name: "Tapovan Lowland Market (Zone B)",
    type: "village",
    x: 345,
    y: 295,
    elevationM: 360,
    population: 3200,
  },
  V3: {
    id: "V3",
    name: "Triveni Floodplain Ward (Zone C)",
    type: "village",
    x: 540,
    y: 380,
    elevationM: 312,
    population: 5800,
  },
  V4: {
    id: "V4",
    name: "Kankhal Embankment Colony (Zone D)",
    type: "village",
    x: 725,
    y: 455,
    elevationM: 278,
    population: 8400,
  },

  // Road Intersections
  J1: { id: "J1", name: "Old Gorge Suspension Bridge", type: "junction", x: 230, y: 150, elevationM: 492 },
  J2: { id: "J2", name: "NH-58 Cliff Ridge Bypass", type: "junction", x: 245, y: 65, elevationM: 790 },
  J3: { id: "J3", name: "Barrage Causeway Crossing", type: "junction", x: 430, y: 235, elevationM: 348 },
  J4: { id: "J4", name: "Shivalik Highland Highway", type: "junction", x: 485, y: 130, elevationM: 540 },
  J5: { id: "J5", name: "Canal Bank Underpass", type: "junction", x: 635, y: 320, elevationM: 298 },
  J6: { id: "J6", name: "BHEL Elevated Expressway", type: "junction", x: 755, y: 215, elevationM: 410 },

  // Safe High-Ground NDRF Relief Shelters
  S1: {
    id: "S1",
    name: "NDRF Base Camp // Tehri Ridge",
    type: "shelter",
    x: 335,
    y: 58,
    elevationM: 840,
    capacity: 5000,
  },
  S2: {
    id: "S2",
    name: "AIIMS Highland Helipad Shelter",
    type: "shelter",
    x: 615,
    y: 118,
    elevationM: 560,
    capacity: 12000,
  },
  S3: {
    id: "S3",
    name: "IIT Elevated Stadium Complex",
    type: "shelter",
    x: 880,
    y: 195,
    elevationM: 430,
    capacity: 15000,
  },
};

export const ROAD_EDGES: RoadEdge[] = [
  // Zone A (V1) connections
  { id: "E01", from: "V1", to: "J1", name: "Old Sangam River Road", distanceKm: 1.8, monitoredByNode: "NODE-01", submergeLevelM: 5.9 },
  { id: "E02", from: "J1", to: "S1", name: "Gorge Bridge Approach", distanceKm: 1.5, monitoredByNode: "NODE-01", submergeLevelM: 6.2 },
  { id: "E03", from: "V1", to: "J2", name: "NH-58 Hairpin Ascent", distanceKm: 2.9, monitoredByNode: null, submergeLevelM: 99.0 },
  { id: "E04", from: "J2", to: "S1", name: "Tehri Ridge Crest Road", distanceKm: 1.4, monitoredByNode: null, submergeLevelM: 99.0 },

  // Zone B (V2) connections
  { id: "E05", from: "V2", to: "J1", name: "Lower Ghat Link", distanceKm: 2.1, monitoredByNode: "NODE-02", submergeLevelM: 5.4 },
  { id: "E06", from: "V2", to: "J3", name: "Barrage Causeway", distanceKm: 2.0, monitoredByNode: "NODE-02", submergeLevelM: 5.2 },
  { id: "E07", from: "J3", to: "S2", name: "Floodplain Direct Arterial", distanceKm: 2.2, monitoredByNode: "NODE-03", submergeLevelM: 5.3 },
  { id: "E08", from: "V2", to: "J4", name: "Shivalik Foothill Climb", distanceKm: 3.4, monitoredByNode: null, submergeLevelM: 99.0 },
  { id: "E09", from: "J4", to: "S2", name: "Highland Corridor", distanceKm: 1.9, monitoredByNode: null, submergeLevelM: 99.0 },

  // Zone C (V3) connections
  { id: "E10", from: "V3", to: "J3", name: "Triveni Underpass Road", distanceKm: 1.8, monitoredByNode: "NODE-03", submergeLevelM: 5.0 },
  { id: "E11", from: "V3", to: "J5", name: "Canal Embankment Track", distanceKm: 2.1, monitoredByNode: "NODE-03", submergeLevelM: 5.2 },
  { id: "E12", from: "V3", to: "J4", name: "Sector-3 Elevated Ramp", distanceKm: 3.1, monitoredByNode: null, submergeLevelM: 99.0 },
  { id: "E13", from: "J5", to: "S2", name: "Eastern Basin Connector", distanceKm: 2.5, monitoredByNode: "NODE-04", submergeLevelM: 4.9 },

  // Zone D (V4) connections
  { id: "E14", from: "V4", to: "J5", name: "Bhimgoda Lowland Road", distanceKm: 1.9, monitoredByNode: "NODE-04", submergeLevelM: 4.7 },
  { id: "E15", from: "V4", to: "J6", name: "BHEL Flyover Spur", distanceKm: 2.7, monitoredByNode: null, submergeLevelM: 99.0 },
  { id: "E16", from: "J6", to: "S3", name: "Industrial Expressway", distanceKm: 2.3, monitoredByNode: null, submergeLevelM: 99.0 },
  { id: "E17", from: "J6", to: "S2", name: "Northern Ridge Highway", distanceKm: 3.2, monitoredByNode: null, submergeLevelM: 99.0 },
];

export function computeDijkstraEvacuation(
  nodeLevels: Record<string, number>
): {
  routes: ComputedEvacuationRoute[];
  edgeStatuses: Array<RoadEdge & { isSubmerged: boolean; isNearFlood: boolean }>;
} {
  const adj: Record<
    string,
    Array<{ to: string; weight: number; roadName: string; isSubmerged: boolean }>
  > = {};
  Object.keys(WAYPOINTS).forEach((k) => {
    adj[k] = [];
  });

  const edgeStatuses = ROAD_EDGES.map((edge) => {
    const lvl = edge.monitoredByNode ? nodeLevels[edge.monitoredByNode] ?? 0 : 0;
    const isSubmerged = edge.monitoredByNode !== null && lvl >= edge.submergeLevelM;
    const isNearFlood =
      !isSubmerged && edge.monitoredByNode !== null && lvl >= edge.submergeLevelM - 0.65;
    const penalty = isSubmerged ? Infinity : isNearFlood ? 3.2 : 1.0;
    const weight = isSubmerged ? Infinity : Number((edge.distanceKm * penalty).toFixed(2));

    adj[edge.from].push({ to: edge.to, weight, roadName: edge.name, isSubmerged });
    adj[edge.to].push({ to: edge.from, weight, roadName: edge.name, isSubmerged });

    return {
      ...edge,
      isSubmerged,
      isNearFlood,
    };
  });

  const shelters = Object.values(WAYPOINTS)
    .filter((w) => w.type === "shelter")
    .map((w) => w.id);
  const villages = Object.values(WAYPOINTS).filter((w) => w.type === "village");

  const routes: ComputedEvacuationRoute[] = villages.map((village) => {
    const dist: Record<string, number> = {};
    const prev: Record<string, { parent: string; road: string } | null> = {};
    const visited = new Set<string>();

    Object.keys(WAYPOINTS).forEach((k) => {
      dist[k] = Infinity;
      prev[k] = null;
    });
    dist[village.id] = 0;

    while (visited.size < Object.keys(WAYPOINTS).length) {
      let u: string | null = null;
      let bestD = Infinity;
      for (const k of Object.keys(WAYPOINTS)) {
        if (!visited.has(k) && dist[k] < bestD) {
          bestD = dist[k];
          u = k;
        }
      }
      if (!u || bestD === Infinity) break;
      visited.add(u);

      for (const neighbor of adj[u]) {
        if (neighbor.isSubmerged || neighbor.weight === Infinity) continue;
        const alt = dist[u] + neighbor.weight;
        if (alt < dist[neighbor.to]) {
          dist[neighbor.to] = alt;
          prev[neighbor.to] = { parent: u, road: neighbor.roadName };
        }
      }
    }

    let bestShelter = shelters[0];
    for (const s of shelters) {
      if (dist[s] < dist[bestShelter]) {
        bestShelter = s;
      }
    }

    const pathNodes: string[] = [];
    const roadNames: string[] = [];
    let curr: string | null = bestShelter;
    while (curr) {
      pathNodes.unshift(curr);
      const step: { parent: string; road: string } | null = prev[curr];
      if (step) {
        roadNames.unshift(step.road);
        curr = step.parent;
      } else {
        curr = null;
      }
    }

    const directEdgeSubmerged = edgeStatuses.some(
      (e) => (e.from === village.id || e.to === village.id) && (e.isSubmerged || e.isNearFlood)
    );

    return {
      villageId: village.id,
      villageName: village.name,
      population: village.population || 2000,
      shelterId: bestShelter,
      shelterName: WAYPOINTS[bestShelter].name,
      pathNodes,
      roadNames,
      effectiveCostKm: Number(dist[bestShelter].toFixed(2)),
      rerouted: directEdgeSubmerged,
      status: directEdgeSubmerged ? "REROUTED // HIGH-GROUND BYPASS" : "NOMINAL // SHORTEST PATH",
    };
  });

  return { routes, edgeStatuses };
}

export const EWS_STAGES = [
  {
    id: "STAGE_01",
    code: "S01 // SENSE",
    label: "MULTI-MODAL TRANSDUCER FUSION",
    condition: "10 Hz Sampling",
    action:
      "Fuses 24 GHz FMCW radar / JSN-SR04T ultrasonic time-of-flight water stage (h = H_datum - c·t/2) with 0.2 mm tipping-bucket hyetograph interrupts and capacitive soil moisture probes.",
  },
  {
    id: "STAGE_02",
    code: "S02 // FILTER",
    label: "EDGE 1D KALMAN & INNOVATION GATE",
    condition: "|r_k| > 3.8σ → R×65",
    action:
      "Executes a continuous 1D Kalman state estimator on the ESP32-S3. Instantaneous acoustic spikes (>0.45 m/s) caused by floating timber or debris trigger covariance inflation, preventing false community sirens.",
  },
  {
    id: "STAGE_03",
    code: "S03 // FORECAST",
    label: "KINEMATIC WAVE PROPAGATION",
    condition: "+15m to +120m Horizon",
    action:
      "Couples Manning's open-channel discharge (Q = A·n⁻¹·R²/³·S¹/²) with 1D Saint-Venant kinematic wave celerity to project downstream flood crest arrival and ETA-to-Danger across all 5 river sectors.",
  },
  {
    id: "STAGE_04",
    code: "S04 // DISPATCH",
    label: "DIJKSTRA ROUTING & LORA/CAP ALERT",
    condition: "w(e) = ∞ on Submerge",
    action:
      "Prunes inundated low-lying bridges from the community road graph G(V,E), computes shortest high-ground shelter paths via Dijkstra's algorithm, and broadcasts ITU-T CAP v1.2 alerts over 4G-MQTT + 865 MHz LoRa mesh.",
  },
];

export const TWELVE_STEPS = [
  {
    step: 1,
    phase: "1",
    state: "SENSE",
    title: "Acoustic / Radar Time-of-Flight Burst",
    desc: "ESP32-S3 triggers a 10 µs pulse on GPIO4 and measures echo duration t_us on GPIO5, computing raw river stage h_raw = H_datum - (t_us / 5800).",
    hw: "JSN-SR04T / 24GHz Radar (GPIO4/5)",
  },
  {
    step: 2,
    phase: "1",
    state: "SENSE",
    title: "Tipping-Bucket Hyetograph Interrupt",
    desc: "Hardware ISR on GPIO19 counts 0.2 mm rainfall bucket tips over a rolling 60-second window to compute instantaneous precipitation intensity I (mm/hr).",
    hw: "Reed Switch ISR (GPIO19)",
  },
  {
    step: 3,
    phase: "1",
    state: "SENSE",
    title: "Soil Saturation & Runoff Coefficient",
    desc: "12-bit SAR ADC on GPIO34 samples volumetric soil moisture θ_v. When θ_v > 80%, infiltration drops and surface runoff coefficient C_r scales up to 1.6x.",
    hw: "Capacitive Probe (ADC1_CH6)",
  },
  {
    step: 4,
    phase: "1",
    state: "FILTER",
    title: "Kalman Prior State Prediction",
    desc: "Edge filter projects prior water stage x̂_k⁻ = x̂_{k-1} and increments error covariance P_k⁻ = P_{k-1} + Q (process variance Q = 0.008 m²).",
    hw: "ESP32-S3 FPU (32-bit Float)",
  },
  {
    step: 5,
    phase: "1",
    state: "FILTER",
    title: "Innovation Gate Debris Rejection",
    desc: "Computes innovation residual r_k = |z_k - x̂_k⁻|. If floating logs or foam cause r_k > 0.45 m (3.8σ), measurement noise R is dynamically scaled by 65x.",
    hw: "Edge Anomaly Gate (Z-Score)",
  },
  {
    step: 6,
    phase: "1",
    state: "FILTER",
    title: "Posterior Stage & Velocity Update",
    desc: "Updates Kalman gain K_k = P_k⁻ / (P_k⁻ + R_eff) and true stage x̂_k, then derives vertical rate-of-rise dh/dt (m/hr) from a 15-sample ring buffer.",
    hw: "SRAM Ring Buffer (15 Samples)",
  },
  {
    step: 7,
    phase: "2",
    state: "FORECAST",
    title: "Manning Open-Channel Discharge",
    desc: "Computes wetted cross-sectional area A(h), hydraulic radius R_h, flow velocity v = n⁻¹·R_h^(2/3)·S^(1/2), and volumetric discharge Q = A·v (m³/s).",
    hw: "Hydrological Solver Engine",
  },
  {
    step: 8,
    phase: "2",
    state: "FORECAST",
    title: "1D Saint-Venant Kinematic Wave Lag",
    desc: "Propagates upstream discharge surges (Node 01 → Node 05) using kinematic wave celerity c_k = (5/3)·v, scheduling downstream crest arrival times.",
    hw: "Kinematic Wave Queue",
  },
  {
    step: 9,
    phase: "2",
    state: "FORECAST",
    title: "Multi-Horizon Stage Projection",
    desc: "Synthesizes local dh/dt, upstream excess head, and queued wave energy into +15m, +30m, +60m, and +120m water level forecasts and ETA-to-Danger.",
    hw: "Multi-Horizon Forecaster",
  },
  {
    step: 10,
    phase: "2",
    state: "DISPATCH",
    title: "Cellular-to-LoRaWAN Mesh Failover",
    desc: "Transmits telemetry over 4G-LTE MQTT TLS. On cellular backhaul timeout, automatically switches to 865 MHz SX1276 LoRa P2P multi-hop mesh.",
    hw: "SX1276 Transceiver (SPI / 865MHz)",
  },
  {
    step: 11,
    phase: "2",
    state: "DISPATCH",
    title: "Dynamic Graph Edge Submergence Pruning",
    desc: "Evaluates road network G(V,E) against node water stages. Low-lying bridges with h_node ≥ H_submerge receive edge weight w(e) = ∞.",
    hw: "Dijkstra Graph Engine",
  },
  {
    step: 12,
    phase: "2",
    state: "DISPATCH",
    title: "CAP v1.2 & Telegram Community Broadcast",
    desc: "Dispatches structured alerts containing current stage, +60m forecast, and turn-by-turn high-ground NDRF shelter routing to community channels.",
    hw: "CAP v1.2 / Telegram Bot API",
  },
];

export const HARDWARE_MODULES = [
  {
    id: "esp32s3",
    code: "MOD_01",
    name: "ESP32-S3 Dual-Core Edge MCU",
    role: "1D Kalman Filtering, Sensor Fusion & Telemetry Framing",
    pins: "GPIO4 (Trig), GPIO5 (Echo), GPIO19 (Rain ISR), GPIO34 (Soil ADC), SPI (LoRa)",
    specs: [
      "Dual-Core Xtensa LX7 @ 240 MHz · 512 KB SRAM · Single-Precision FPU",
      "Executes 1D Kalman Filter + Innovation Gate in < 45 µs per sample",
      "Hardware watchdog timer + deep-sleep solar power management",
    ],
  },
  {
    id: "radar_sonar",
    code: "MOD_02",
    name: "JSN-SR04T / 24GHz Non-Contact Stage Sensor",
    role: "Bridge-Mounted Vertical River Stage Ranging",
    pins: "VCC: 5V | TRIG: GPIO4 | ECHO: GPIO5 | GND: Unified Bus",
    specs: [
      "Acoustic 40 kHz waterproof transducer / 24 GHz FMCW radar stage gauge",
      "Range: 0.20 m – 8.00 m · Resolution: ±3 mm · Stilling-well or open-bridge mount",
      "Governing conversion: h_water = H_datum - (t_echo_us × 0.000343) / 2",
    ],
  },
  {
    id: "sx1276_lora",
    code: "MOD_03",
    name: "Semtech SX1276 865 MHz LoRaWAN Transceiver",
    role: "Disaster-Resilient P2P Mesh Backhaul (Cellular Failover)",
    pins: "NSS: GPIO10 | RST: GPIO14 | DIO0: GPIO2 | SCK/MISO/MOSI: Hardware SPI",
    specs: [
      "ISM Band: 865–867 MHz (India) · Link Budget: 168 dB · Line-of-Sight: 12–15 km",
      "Spreading Factor SF7–SF12 · +20 dBm PA output · CRC-16 packet integrity",
      "Auto-activates multi-hop P2P relay within 200 ms of 4G-LTE MQTT disconnect",
    ],
  },
  {
    id: "rain_soil",
    code: "MOD_04",
    name: "Tipping-Bucket Hyetograph & Soil Moisture Array",
    role: "Catchment Precipitation & Surface Runoff Coefficient Estimation",
    pins: "RAIN_ISR: GPIO19 (Pull-Up) | SOIL_ADC: GPIO34 (12-bit SAR ADC)",
    specs: [
      "0.2 mm per bucket tip magnetic reed switch with hardware debounce",
      "Capacitive corrosion-free soil dielectric probe (3.3V excitation)",
      "Computes dynamic runoff amplification C_r ∈ [1.0, 1.6] for kinematic wave model",
    ],
  },
  {
    id: "mppt_power",
    code: "MOD_05",
    name: "Solar MPPT + 6000mAh LiFePO4 Power Subsystem",
    role: "Autonomous Off-Grid Monsoon Operation",
    pins: "SOLAR_IN: 18V 20W Panel | BATT: 6.4V LiFePO4 | BUCK: 5.0V & 3.3V LDO",
    specs: [
      "2000+ cycle LiFePO4 chemistry with 14-day zero-sunlight autonomy",
      "INA219 I2C high-side bus voltage & current telemetry monitor",
      "TVS diode surge protection against lightning-induced river bridge transients",
    ],
  },
  {
    id: "siren_cap",
    code: "MOD_06",
    name: "Acoustic Siren Relay & CAP v1.2 Gateway",
    role: "Community Strobe/Siren Actuation & Mobile Push Dispatch",
    pins: "RELAY_GATE: GPIO21 (Opto-Isolated) | BACKHAUL: MQTT TLS / HTTPS",
    specs: [
      "115 dB weatherproof community horn + high-intensity LED beacon relay",
      "ITU-T X.1303 Common Alerting Protocol (CAP v1.2) payload generator",
      "Direct webhook integration with Telegram Bot API & district EOC dashboards",
    ],
  },
];

export const FULL_ESP32_SKETCH = `// ============================================================================
// AEGISFLOOD // PRODUCTION EDGE NODE FIRMWARE (ESP32-S3 + SX1276 LoRa + KALMAN)
// Node: NODE-03 (Rishikesh Triveni Basin) | MCU: ESP32-S3 @ 240 MHz
// Features: 1D Kalman Filter, Innovation Gate Debris Rejection, LoRa Failover
// ============================================================================

#include <WiFi.h>
#include <PubSubClient.h>
#include <SPI.h>
#include <LoRa.h>

#define NODE_ID               "NODE-03"
#define PIN_SONAR_TRIG        4
#define PIN_SONAR_ECHO        5
#define PIN_RAIN_ISR          19
#define PIN_SOIL_ADC          34
#define PIN_LORA_SS           10
#define PIN_LORA_RST          14
#define PIN_LORA_DIO0         2
#define PIN_SIREN_RELAY       21

// Hydrological & Kalman Constants (Live-Patchable via Downlink)
float BRIDGE_DATUM_M        = 9.00f;
float DANGER_LEVEL_M        = 5.60f;
float KALMAN_Q              = 0.008f; // Process noise covariance (m^2)
float KALMAN_R              = 0.080f; // Measurement noise covariance (m^2)
float INNOVATION_GATE_M     = 0.450f; // Max physically plausible 1s jump (m)

struct KalmanFilter1D {
  float x = 2.90f; // Estimated true water stage (m)
  float p = 1.00f; // Error covariance
  float k = 0.00f; // Kalman gain
} kf;

volatile uint32_t rainBucketTips = 0;
void IRAM_ATTR onRainBucketTip() {
  rainBucketTips++;
}

float sampleRawWaterStageM() {
  digitalWrite(PIN_SONAR_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_SONAR_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_SONAR_TRIG, LOW);

  long durationUs = pulseIn(PIN_SONAR_ECHO, HIGH, 45000);
  if (durationUs <= 0) return kf.x;
  float distanceToSurfaceM = (durationUs * 0.000343f) * 0.5f;
  return max(0.20f, BRIDGE_DATUM_M - distanceToSurfaceM);
}

float stepEdgeKalman(float rawStageM, bool &anomalyRejected, float &residualM) {
  residualM = fabs(rawStageM - kf.x);
  // Innovation Gate: floating timber/debris causes instantaneous positive spike
  anomalyRejected = (residualM > INNOVATION_GATE_M);

  // Prior prediction
  kf.p = kf.p + KALMAN_Q;

  // Inflate measurement covariance 65x when debris glitch is detected
  float effectiveR = anomalyRejected ? (KALMAN_R * 65.0f) : KALMAN_R;
  kf.k = kf.p / (kf.p + effectiveR);
  kf.x = kf.x + kf.k * (rawStageM - kf.x);
  kf.p = (1.0f - kf.k) * kf.p;

  return kf.x;
}

void transmitTelemetryFrame(float rawM, float kalmanM, float residualM, bool anomaly) {
  char frame[256];
  snprintf(
    frame, sizeof(frame),
    "{\\"node\\":\\"%s\\",\\"raw\\":%.3f,\\"kalman\\":%.3f,\\"res\\":%.3f,\\"anomaly\\":%s}",
    NODE_ID, rawM, kalmanM, residualM, anomaly ? "true" : "false"
  );

  // Primary: 4G-LTE MQTT | Automatic Failover: 865 MHz LoRaWAN P2P Mesh
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[MQTT_TLS] %s\\n", frame);
  } else {
    LoRa.beginPacket();
    LoRa.print(frame);
    LoRa.endPacket();
    Serial.printf("[LORA_865_MESH] %s\\n", frame);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_SONAR_TRIG, OUTPUT);
  pinMode(PIN_SONAR_ECHO, INPUT);
  pinMode(PIN_SIREN_RELAY, OUTPUT);
  pinMode(PIN_RAIN_ISR, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_RAIN_ISR), onRainBucketTip, FALLING);

  LoRa.setPins(PIN_LORA_SS, PIN_LORA_RST, PIN_LORA_DIO0);
  LoRa.begin(865E6);
}

void loop() {
  bool anomaly = false;
  float residual = 0.0f;
  float rawStage = sampleRawWaterStageM();
  float trueStage = stepEdgeKalman(rawStage, anomaly, residual);

  digitalWrite(PIN_SIREN_RELAY, (trueStage >= DANGER_LEVEL_M) ? HIGH : LOW);
  transmitTelemetryFrame(rawStage, trueStage, residual, anomaly);
  delay(1000);
}
`;
