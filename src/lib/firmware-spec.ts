export { FULL_ESP32_SKETCH } from "@/lib/esp32-sketch";

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
