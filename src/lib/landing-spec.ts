export const QUICKSTART_TABS = {
  sketch: {
    label: "ESP32-S3 KALMAN .INO",
    code: `// Flash to ESP32-S3 Edge Node (240 MHz Xtensa LX7 + FPU)
// JSN-SR04T/Radar: GPIO4/5 | Rain ISR: GPIO19 | SX1276 LoRa: SPI (865 MHz)
float stepEdgeKalman(float rawStageM, bool &anomalyRejected, float &residualM) {
  residualM = fabs(rawStageM - kf.x);
  anomalyRejected = (residualM > 0.45f); // 3.8σ Innovation Gate (Debris Reject)
  kf.p = kf.p + 0.008f;                  // Prior covariance update
  float effectiveR = anomalyRejected ? (0.080f * 65.0f) : 0.080f;
  kf.k = kf.p / (kf.p + effectiveR);
  kf.x = kf.x + kf.k * (rawStageM - kf.x);
  kf.p = (1.0f - kf.k) * kf.p;
  return kf.x;
}`,
  },
  pinout: {
    label: "NODE PINOUT & BUS",
    code: `# AEGISFLOOD EDGE STATION INTERCONNECT & SURGE ISOLATION TOPOLOGY
STAGE RADAR/SONAR ->  VCC: 5.0V | TRIG: GPIO4  | ECHO: GPIO5   | GND: Star GND
HYETOGRAPH RAIN   ->  REED_ISR: GPIO19 (0.2mm/tip)             | Debounce: 15ms RC
SOIL CAPACITIVE   ->  EXCITE: 3.3V | SIG: GPIO34 (ADC1_CH6)    | Range: 0–100% θ_v
SX1276 LORA 865   ->  NSS: GPIO10 | RST: GPIO14 | DIO0: GPIO2  | SPI: SCK/MISO/MOSI
POWER SUBSYSTEM   ->  20W Solar -> MPPT -> 6.4V 6Ah LiFePO4 -> 5V/3.3V Buck + TVS`,
  },
  webapp: {
    label: "DIGITAL TWIN CLI",
    code: `# Run the AegisFlood 5-Node River Basin Digital Twin & Telemetry Workbench
git clone https://github.com/tanisheesh/AegisFlood.git
cd AegisFlood
pnpm install --frozen-lockfile
pnpm run dev

# Open http://localhost:3000 -> /playground (Basin Twin) or /network (Node Spec)`,
  },
} as const;

export const HERO_STATION_SNAPSHOT = [
  {
    id: "NODE_01 // DEVPRAYAG_GORGE",
    spec: "KM 0.0 · 830m ASL",
    val: 45,
    metric: "Stage: 3.40m / Danger: 6.40m",
    state: "HEADWATER",
    bar: "bg-[#ff4d00]",
  },
  {
    id: "NODE_02 // TAPOVAN_BARRAGE",
    spec: "KM 14.5 · 490m ASL",
    val: 44,
    metric: "Stage: 3.10m · Q: 295 m³/s",
    state: "SPILLWAY",
    bar: "bg-[#00e676]",
  },
  {
    id: "NODE_03 // RISHIKESH_BASIN",
    spec: "KM 28.0 · 340m ASL",
    val: 48,
    metric: "Kalman Δ: 0.01m · SF9 LoRa",
    state: "KALMAN_OK",
    bar: "bg-[#ff4d00]",
  },
  {
    id: "NODE_04 // HARIDWAR_PLAINS",
    spec: "KM 42.0 · 295m ASL",
    val: 52,
    metric: "Dijkstra G(V,E): 4 Zones Clear",
    state: "ROUTING_OK",
    bar: "bg-[#ffb300]",
  },
] as const;

export const LANDING_KPIS = [
  {
    num: "58.0 KM",
    label: "5-NODE RIVER BASIN MESH",
    sub: "Devprayag (830m) → Roorkee Delta (268m)",
  },
  {
    num: "3.8σ GATE",
    label: "1D KALMAN DEBRIS REJECTION",
    sub: "Blocks +2.0m floating timber sonar spikes",
  },
  {
    num: "+120 MIN",
    label: "KINEMATIC WAVE LEAD TIME",
    sub: "Manning Q + soil moisture runoff coupling",
  },
  {
    num: "G(V, E)",
    label: "DYNAMIC DIJKSTRA EVACUATION",
    sub: "Prunes submerged bridges (w = ∞) in <2ms",
  },
] as const;

export const BENCHMARK_ROWS = [
  {
    arch: "MECHANICAL FLOAT SWITCH",
    sensing: "Single Binary Contact",
    debrisImmunity: "JAMS ON SILT / FLOATING LOGS",
    leadTime: "0 MIN (REACTIVE ONLY)",
    evacuation: "Static Siren Only",
    backhaul: "Wired / Local",
    win: false,
  },
  {
    arch: "RAW ULTRASONIC + BUZZER",
    sensing: "Unfiltered HC-SR04 / JSN-SR04T",
    debrisImmunity: "FALSE SIRENS ON SURFACE DEBRIS",
    leadTime: "0 MIN (THRESHOLD ONLY)",
    evacuation: "None",
    backhaul: "Wi-Fi (Fails in Storm)",
    win: false,
  },
  {
    arch: "CLOUD-ONLY 4G GAUGE",
    sensing: "Periodic 15-Min Polling",
    debrisImmunity: "Delayed Moving Average",
    leadTime: "10–15 MIN LAG",
    evacuation: "Fixed Map PDF",
    backhaul: "4G Only (Blackout Prone)",
    win: false,
  },
  {
    arch: "AEGISFLOOD (EDGE-KALMAN + MESH)",
    sensing: "5-Node Radar + Rain + Soil Fusion",
    debrisImmunity: "1D KALMAN 3.8σ INNOVATION GATE",
    leadTime: "+15m TO +120m KINEMATIC WAVE",
    evacuation: "DYNAMIC DIJKSTRA G(V,E)",
    backhaul: "4G-MQTT + 865MHz LORA MESH",
    win: true,
  },
] as const;
