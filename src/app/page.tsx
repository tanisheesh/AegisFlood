"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import {
  EWS_STAGES,
  FULL_ESP32_SKETCH,
  HARDWARE_MODULES,
  TWELVE_STEPS,
} from "@/lib/aegisflood-data";

const QUICKSTART_TABS = {
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
npm install
npm run dev

# Open http://localhost:3000 -> /playground (Basin Twin) or /network (Node Spec)`,
  },
};

const BENCHMARK_ROWS = [
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
];

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"sketch" | "pinout" | "webapp">("sketch");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(QUICKSTART_TABS[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleDownloadIno = () => {
    const blob = new Blob([FULL_ESP32_SKETCH], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "AegisFlood_ESP32S3_Edge_Kalman_Node.ino";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 lg:px-8">
        {/* ================= HERO GRID ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 border-x border-b border-[#222220]">
          {/* Left 7 Cols */}
          <div className="lg:col-span-7 p-5 sm:p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-[#222220] flex flex-col justify-between min-w-0">
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.14em] sm:tracking-[0.18em] text-[#00e5ff] mb-4 sm:mb-6">
                <span className="w-2 h-2 shrink-0 bg-[#00e5ff] inline-block" />
                <span>ESP32-S3 // 1D KALMAN GATE // SAINT-VENANT WAVE // SX1276 865MHZ LORA</span>
              </div>

              <h1 className="font-display font-black uppercase text-[clamp(40px,9vw,94px)] leading-[0.9] tracking-tight text-[#f2efe9] mb-5 sm:mb-6 break-words">
                STATIC WATER
                <br />
                ALARMS FAIL BEFORE
                <br />
                <span className="text-[#00e5ff]">THE WAVE HITS.</span>
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-[#88857e] max-w-xl leading-relaxed mb-6 sm:mb-8">
                Single-point threshold gauges trigger only after downstream embankments breach, while
                floating logs and storm debris cause rampant false alarms on raw ultrasonic sensors.{" "}
                <strong className="text-[#f2efe9] font-semibold">AegisFlood</strong> is a{" "}
                <strong className="text-[#f2efe9] font-semibold">
                  5-Node River Basin Hydrological Digital Twin
                </strong>{" "}
                and distributed early warning system combining{" "}
                <code className="text-[#00e5ff]">ESP32-S3 1D Kalman filtering</code> (
                <code className="text-[#00e676]">|r_k| &gt; 3.8σ</code> debris rejection),{" "}
                <strong className="text-[#f2efe9] font-semibold">
                  1D Saint-Venant kinematic wave forecasting
                </strong>{" "}
                (+15 to +120 min ahead),{" "}
                <strong className="text-[#f2efe9] font-semibold">
                  dynamic Dijkstra evacuation routing
                </strong>
                , and automatic <code className="text-[#ffb300]">865 MHz LoRaWAN mesh failover</code>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-2">
              <Link href="/playground" className="brutal-btn brutal-btn-primary w-full sm:w-auto">
                LAUNCH BASIN DIGITAL TWIN →
              </Link>
              <Link href="/network" className="brutal-btn w-full sm:w-auto">
                NODE TOPOLOGY &amp; PINOUT →
              </Link>
              <Link href="/how-it-works" className="brutal-btn w-full sm:w-auto">
                HYDROLOGY &amp; MATH →
              </Link>
            </div>
          </div>

          {/* Right 5 Cols: Live 5-Node Basin Telemetry Snapshot */}
          <div className="lg:col-span-5 bg-[#0b0b0b] flex flex-col justify-between min-w-0">
            <div className="panel-header">
              <span>HYDRO_MESH_BUS // 5-STATION RIVER BASIN STATUS</span>
              <span className="text-[#00e676] font-bold">● KALMAN: 10Hz LOCK</span>
            </div>

            <div className="p-4 sm:p-6 space-y-4 font-mono text-xs">
              <div className="space-y-2.5">
                {[
                  {
                    id: "NODE_01 // DEVPRAYAG_GORGE",
                    spec: "KM 0.0 · 830m ASL",
                    val: 45,
                    metric: "Stage: 3.40m / Danger: 6.40m",
                    state: "HEADWATER",
                    bar: "bg-[#00e5ff]",
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
                    bar: "bg-[#00e5ff]",
                  },
                  {
                    id: "NODE_04 // HARIDWAR_PLAINS",
                    spec: "KM 42.0 · 295m ASL",
                    val: 52,
                    metric: "Dijkstra G(V,E): 4 Zones Clear",
                    state: "ROUTING_OK",
                    bar: "bg-[#ffb300]",
                  },
                ].map((s) => (
                  <div key={s.id} className="border border-[#222220] bg-[#111111] p-2.5 sm:p-3">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                      <div className="truncate">
                        <span className="text-[#f2efe9] font-bold">{s.id}</span>
                        <span className="text-[#88857e] ml-1.5 text-[11px]">[{s.spec}]</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 border border-[#00e676] text-[#00e676] shrink-0">
                        {s.state}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#88857e] mb-1.5">
                      <span>{s.metric}</span>
                      <span className="text-[#f2efe9] font-bold">CAPACITY: {s.val}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#1c1c1a]">
                      <div className={`h-full ${s.bar}`} style={{ width: `${s.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="border border-[#222220] bg-[#080808] p-3 sm:p-3.5 space-y-1">
                <div className="text-[10px] text-[#00e5ff] uppercase tracking-wider">
                  1D SAINT-VENANT CONTINUITY &amp; EDGE KALMAN GAIN
                </div>
                <div className="text-[#00e676] text-[11px] sm:text-xs overflow-x-auto custom-scrollbar whitespace-nowrap pb-1">
                  ∂A/∂t + ∂Q/∂x = q_L &nbsp;|&nbsp; K_k = P_k⁻ / (P_k⁻ + R_eff) &nbsp;|&nbsp; x̂_k = x̂_k⁻ + K_k(z_k - x̂_k⁻)
                </div>
              </div>
            </div>

            <div className="border-t border-[#222220] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] sm:text-[11px] text-[#88857e]">
              <span>INNOVATION GATE: |z_k - x̂_k⁻| &gt; 0.45m → R×65</span>
              <Link href="/playground" className="text-[#00e5ff] hover:underline font-bold">
                INJECT CLOUDBURST &amp; DEBRIS LIVE →
              </Link>
            </div>
          </div>
        </section>

        {/* ================= 4-KPI METRICS STRIP ================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-x border-b border-[#222220] bg-[#0b0b0b]">
          {[
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
          ].map((m, idx) => (
            <div
              key={m.label}
              className={`p-5 sm:p-6 border-[#222220] ${
                idx < 3 ? "border-b lg:border-b-0 lg:border-r" : ""
              } ${idx % 2 === 0 ? "sm:border-r" : ""} ${
                idx >= 2 ? "sm:border-b-0" : "sm:border-b"
              }`}
            >
              <div className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-[#00e5ff] tracking-tight">
                {m.num}
              </div>
              <div className="font-mono text-xs font-bold text-[#f2efe9] mt-2 tracking-wider">
                {m.label}
              </div>
              <div className="font-mono text-[11px] text-[#88857e] mt-1">{m.sub}</div>
            </div>
          ))}
        </section>

        {/* ================= 4-STAGE AUTONOMOUS EARLY WARNING PIPELINE ================= */}
        <section className="border-x border-b border-[#222220] bg-[#0e0e0e]">
          <div className="panel-header">
            <span>DISTRIBUTED EARLY WARNING ARCHITECTURE // 4-STAGE DETERMINISTIC PIPELINE</span>
            <span className="text-[#00e5ff]">SENSE → KALMAN FILTER → KINEMATIC FORECAST → DIJKSTRA DISPATCH</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-[#222220]">
            {EWS_STAGES.map((st) => (
              <div
                key={st.id}
                className="p-4 sm:p-5 border-b border-r border-[#222220] flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="px-2 py-0.5 bg-[#00e5ff] text-[#080808] font-bold">
                      {st.code}
                    </span>
                    <span className="text-[#00e676]">{st.condition}</span>
                  </div>
                  <h3 className="font-display font-black text-xl uppercase text-[#f2efe9]">
                    {st.label}
                  </h3>
                  <p className="text-xs text-[#88857e] leading-relaxed">{st.action}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= 12-STEP EXECUTION MATRIX ================= */}
        <section className="border-x border-b border-[#222220] bg-[#080808]">
          <div className="panel-header">
            <span>TELEMETRY &amp; EVACUATION EXECUTION PIPELINE // 12-STEP CYCLE</span>
            <span>PHASE 1: EDGE SENSING &amp; KALMAN [01–06] · PHASE 2: WAVE FORECAST &amp; ROUTING [07–12]</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 border-t border-[#222220]">
            {TWELVE_STEPS.map((s) => (
              <div
                key={s.step}
                className="p-4 sm:p-5 border-b border-r border-[#222220] bg-[#0e0e0e] hover:bg-[#141414] transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-[#00e5ff] font-bold">
                      STEP {String(s.step).padStart(2, "0")} // PHASE {s.phase}
                    </span>
                    <span className="px-1.5 py-0.5 border border-[#3a3834] text-[#f2efe9]">
                      {s.state}
                    </span>
                  </div>
                  <h4 className="font-mono text-xs sm:text-sm font-bold text-[#f2efe9]">
                    {s.title}
                  </h4>
                  <p className="text-xs text-[#88857e] leading-relaxed">{s.desc}</p>
                </div>
                <div className="pt-2 border-t border-[#222220] font-mono text-[10px] text-[#00e676]">
                  SUBSYSTEM: {s.hw}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= 6 HARDWARE SUBSYSTEMS SUMMARY + QUICKSTART ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 border-x border-b border-[#222220]">
          {/* Left 6 Cols: Hardware Stack */}
          <div className="lg:col-span-6 border-b lg:border-b-0 lg:border-r border-[#222220] bg-[#0e0e0e] flex flex-col justify-between">
            <div className="panel-header">
              <span>EDGE SENSING &amp; TELECOM STACK // 6 SUBSYSTEMS</span>
              <Link href="/network" className="text-[#00e5ff] hover:underline">
                INSPECT SCHEMATIC →
              </Link>
            </div>

            <div className="divide-y divide-[#222220]">
              {HARDWARE_MODULES.map((m) => (
                <div key={m.id} className="p-4 sm:p-5 flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                    <span className="text-[#f2efe9] font-bold">
                      <span className="text-[#00e5ff] mr-2">[{m.code}]</span>
                      {m.name}
                    </span>
                    <span className="text-[10px] text-[#00e676] border border-[#222220] bg-[#080808] px-2 py-0.5">
                      {m.pins.split("|")[0]}
                    </span>
                  </div>
                  <p className="text-xs text-[#88857e]">{m.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right 6 Cols: Interactive Firmware & CLI Quickstart */}
          <div className="lg:col-span-6 bg-[#080808] flex flex-col justify-between min-w-0">
            <div>
              <div className="panel-header">
                <span>PRODUCTION ARTIFACTS // FIRMWARE &amp; DIGITAL TWIN</span>
                <button
                  onClick={handleDownloadIno}
                  className="text-[#ffb300] hover:underline font-bold cursor-pointer"
                >
                  ⬇ DOWNLOAD .INO SKETCH
                </button>
              </div>

              <div className="flex border-b border-[#222220] bg-[#0e0e0e] overflow-x-auto">
                {(Object.keys(QUICKSTART_TABS) as Array<keyof typeof QUICKSTART_TABS>).map((k) => (
                  <button
                    key={k}
                    onClick={() => setActiveTab(k)}
                    className={`px-4 py-2.5 font-mono text-[11px] tracking-wider border-r border-[#222220] cursor-pointer whitespace-nowrap ${
                      activeTab === k
                        ? "bg-[#151515] text-[#00e5ff] font-bold border-b-2 border-b-[#00e5ff]"
                        : "text-[#88857e] hover:text-[#f2efe9]"
                    }`}
                  >
                    {QUICKSTART_TABS[k].label}
                  </button>
                ))}
              </div>

              <div className="p-4 sm:p-6">
                <pre className="p-4 bg-[#0e0e0e] border border-[#222220] font-mono text-[11px] sm:text-xs text-[#f2efe9] overflow-x-auto leading-relaxed custom-scrollbar">
                  {QUICKSTART_TABS[activeTab].code}
                </pre>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-[#222220] bg-[#0b0b0b] flex flex-wrap items-center justify-between gap-3">
              <button onClick={handleCopy} className="brutal-btn">
                {copied ? "✓ COPIED TO CLIPBOARD" : "COPY SNIPPET"}
              </button>
              <Link href="/playground" className="brutal-btn brutal-btn-primary">
                OPEN INTERACTIVE BASIN TWIN →
              </Link>
            </div>
          </div>
        </section>

        {/* ================= ARCHITECTURE COMPARISON BENCHMARK TABLE ================= */}
        <section className="border-x border-b border-[#222220] bg-[#0e0e0e]">
          <div className="panel-header">
            <span>ARCHITECTURE COMPARISON // REACTIVE GAUGES VS. DISTRIBUTED EDGE-AI DIGITAL TWIN</span>
            <span>EVALUATION ACROSS 5 CRITICAL DIMENSIONS</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[#222220] bg-[#0b0b0b] text-[#88857e] text-[10px] sm:text-[11px] uppercase">
                  <th className="p-3 sm:p-4 border-r border-[#222220]">Architecture</th>
                  <th className="p-3 sm:p-4 border-r border-[#222220]">Sensing Modality</th>
                  <th className="p-3 sm:p-4 border-r border-[#222220]">Debris / Glitch Immunity</th>
                  <th className="p-3 sm:p-4 border-r border-[#222220]">Forecast Lead Time</th>
                  <th className="p-3 sm:p-4 border-r border-[#222220]">Evacuation Routing</th>
                  <th className="p-3 sm:p-4">Storm Backhaul</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222220]">
                {BENCHMARK_ROWS.map((r) => (
                  <tr
                    key={r.arch}
                    className={
                      r.win
                        ? "bg-[#00e5ff]/10 text-[#f2efe9] font-bold"
                        : "bg-[#0e0e0e] text-[#88857e]"
                    }
                  >
                    <td className="p-3 sm:p-4 border-r border-[#222220] whitespace-nowrap">
                      {r.win && <span className="text-[#00e5ff] mr-1.5">★</span>}
                      {r.arch}
                    </td>
                    <td className="p-3 sm:p-4 border-r border-[#222220]">{r.sensing}</td>
                    <td
                      className={`p-3 sm:p-4 border-r border-[#222220] ${
                        r.win ? "text-[#00e676]" : "text-[#ff5500]"
                      }`}
                    >
                      {r.debrisImmunity}
                    </td>
                    <td className="p-3 sm:p-4 border-r border-[#222220]">{r.leadTime}</td>
                    <td className="p-3 sm:p-4 border-r border-[#222220]">{r.evacuation}</td>
                    <td className="p-3 sm:p-4">{r.backhaul}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
