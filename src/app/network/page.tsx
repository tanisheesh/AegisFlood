"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { FULL_ESP32_SKETCH, HARDWARE_MODULES } from "@/lib/aegisflood-data";

type FaultType =
  | "nominal"
  | "debris_echo"
  | "cellular_blackout"
  | "lora_airtime"
  | "solar_brownout";

const NODE_FAULTS: Record<
  FaultType,
  {
    code: string;
    label: string;
    domain: string;
    status: string;
    diagnosis: string;
    mitigation: string;
  }
> = {
  nominal: {
    code: "NOMINAL",
    label: "ALL SENSORS & LINKS NOMINAL",
    domain: "REFERENCE EDGE STATION TOPOLOGY",
    status: "PASS // BUS HEALTHY",
    diagnosis:
      "ESP32-S3 samples bridge-mounted JSN-SR04T / 24GHz radar stage at 10Hz, filters through the 1D Kalman estimator, and publishes signed JSON frames over 4G-LTE MQTT with 865MHz LoRaWAN standby.",
    mitigation: "V_bus = 6.42V LiFePO4 | Kalman K = 0.091 | RSSI = -71 dBm (4G-LTE)",
  },
  debris_echo: {
    code: "FAULT_01",
    label: "FLOATING TIMBER ACOUSTIC SPIKE",
    domain: "TRANSDUCER TIME-OF-FLIGHT ARTIFACT",
    status: "MITIGATED // 1D KALMAN GATE",
    diagnosis:
      "Floating logs or dense storm foam pass beneath the bridge transducer, shortening echo return time t_echo from 35,000 µs to 23,000 µs (+2.05m instantaneous stage spike).",
    mitigation:
      "Innovation Gate detects |z_k - x̂_k⁻| = 2.05m > 0.45m (3.8σ) and inflates measurement noise covariance R by 65x, rejecting the false siren.",
  },
  cellular_blackout: {
    code: "FAULT_02",
    label: "4G-LTE CELLULAR BACKHAUL OUTAGE",
    domain: "TELECOM TOWER POWER / FIBER FAILURE",
    status: "FAILOVER // 865MHz LORA MESH",
    diagnosis:
      "Cyclonic rainfall or landslide severs district cellular backhaul; MQTT TLS socket times out after 3 consecutive keep-alive frames.",
    mitigation:
      "ESP32-S3 asserts NSS (GPIO10) on the Semtech SX1276 transceiver, encapsulating telemetry into 32-byte binary frames relayed hop-by-hop at 865.4 MHz (SF9, 168 dB link budget).",
  },
  lora_airtime: {
    code: "FAULT_03",
    label: "LORA SF12 DUTY-CYCLE COLLISION",
    domain: "SUB-GHZ MAC LAYER CONTENTION",
    status: "ADAPTIVE // ADR SPREADING FACTOR",
    diagnosis:
      "Locking all 5 river nodes at Spreading Factor SF12 increases single-packet time-on-air to ~1,480 ms, causing ALOHA packet collisions during simultaneous 1 Hz flood bursts.",
    mitigation:
      "Adaptive Data Rate (ADR) assigns orthogonal frequencies (865.0625 / 865.4025 / 865.985 MHz) and SF9 (~185 ms airtime) with TDMA slot offsets per node ID.",
  },
  solar_brownout: {
    code: "FAULT_04",
    label: "PROLONGED MONSOON SOLAR DEPLETION",
    domain: "POWER BUS UNDERVOLTAGE",
    status: "PROTECTED // DEEP-SLEEP DUTY CYCLE",
    diagnosis:
      "10+ days of dense cloud cover reduces 20W solar panel harvest below 1.2W while continuous 4G modem transmission draws 380 mA peaks.",
    mitigation:
      "INA219 detects LiFePO4 bus < 6.05V and switches ESP32-S3 to adaptive duty cycling (wake 120 ms → sample + LoRa TX → deep sleep @ 14 µA), extending runtime to 18 days.",
  },
};

export default function NetworkPage() {
  const [selectedId, setSelectedId] = useState("esp32s3");
  const [activeFault, setActiveFault] = useState<FaultType>("nominal");
  const [copied, setCopied] = useState(false);

  const activeModule =
    HARDWARE_MODULES.find((m) => m.id === selectedId) || HARDWARE_MODULES[0];
  const faultInfo = NODE_FAULTS[activeFault];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(FULL_ESP32_SKETCH);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
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

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div className="border border-[#222220] bg-[#0e0e0e] p-5 sm:p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] sm:text-xs text-[#00e5ff] uppercase tracking-widest mb-2">
              // EDGE SENSING NODE ARCHITECTURE, PINOUT &amp; FAULT DIAGNOSIS
            </div>
            <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl uppercase text-[#f2efe9]">
              ESP32-S3 NODE TOPOLOGY &amp; LORA BUS
            </h1>
            <p className="text-xs sm:text-base text-[#88857e] mt-2 max-w-2xl leading-relaxed">
              Interactive edge station interconnect schematic, transducer &amp; telecom fault
              simulator, and production ESP32-S3 C++ firmware with 1D Kalman debris rejection.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleDownloadIno} className="brutal-btn brutal-btn-primary">
              ⬇ DOWNLOAD ESP32 .INO
            </button>
            <Link href="/playground" className="brutal-btn">
              OPEN BASIN DIGITAL TWIN →
            </Link>
          </div>
        </div>

        {/* Interactive Node Schematic + Fault Diagnosis Workbench */}
        <section className="grid grid-cols-1 lg:grid-cols-12 border border-[#222220] bg-[#0e0e0e]">
          {/* Left 7 Cols: Interactive SVG Node Bus Schematic */}
          <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-[#222220] flex flex-col">
            <div className="panel-header">
              <span>EDGE STATION INTERCONNECT SCHEMATIC // STAR GROUND &amp; SPI/ADC BUS</span>
              <span className="text-[#00e5ff] font-bold">{faultInfo.code}</span>
            </div>

            <div className="p-4 bg-[#080808] flex-1 flex items-center justify-center">
              <svg
                viewBox="0 0 760 400"
                className="w-full h-auto max-h-[380px] border border-[#222220] bg-[#0b0d12]"
              >
                {/* Power Subsystem Box */}
                <rect
                  x="25"
                  y="30"
                  width="195"
                  height="95"
                  fill="#111318"
                  stroke={activeFault === "solar_brownout" ? "#ff2a2a" : "#ffb300"}
                  strokeWidth="2"
                />
                <text x="38" y="55" fill="#ffb300" fontSize="11" fontWeight="bold" fontFamily="IBM Plex Mono">
                  MOD_05 // SOLAR MPPT + LiFePO4
                </text>
                <text x="38" y="75" fill="#f2efe9" fontSize="10" fontFamily="IBM Plex Mono">
                  20W Panel → 6.4V 6000mAh
                </text>
                <text x="38" y="93" fill="#88857e" fontSize="10" fontFamily="IBM Plex Mono">
                  INA219 I2C · 5.0V &amp; 3.3V Rails
                </text>
                <text x="38" y="111" fill="#00e676" fontSize="10" fontFamily="IBM Plex Mono">
                  TVS Surge + Star GND Bus
                </text>

                {/* Central ESP32-S3 Edge MCU */}
                <rect
                  x="275"
                  y="110"
                  width="210"
                  height="175"
                  fill="#0f1722"
                  stroke="#00e5ff"
                  strokeWidth="2.5"
                />
                <text x="292" y="138" fill="#00e5ff" fontSize="12" fontWeight="bold" fontFamily="IBM Plex Mono">
                  MOD_01 // ESP32-S3 EDGE MCU
                </text>
                <text x="292" y="158" fill="#f2efe9" fontSize="10" fontFamily="IBM Plex Mono">
                  Dual-Core Xtensa LX7 @ 240MHz
                </text>
                <text x="292" y="180" fill="#00e676" fontSize="10" fontFamily="IBM Plex Mono">
                  • 1D Kalman Filter (Q=0.008)
                </text>
                <text x="292" y="198" fill="#00e676" fontSize="10" fontFamily="IBM Plex Mono">
                  • 3.8σ Innovation Gate (R×65)
                </text>
                <text x="292" y="216" fill="#f2efe9" fontSize="10" fontFamily="IBM Plex Mono">
                  • GPIO4/5: Sonar Trig/Echo
                </text>
                <text x="292" y="234" fill="#f2efe9" fontSize="10" fontFamily="IBM Plex Mono">
                  • GPIO19: Rain Tipping ISR
                </text>
                <text x="292" y="252" fill="#f2efe9" fontSize="10" fontFamily="IBM Plex Mono">
                  • GPIO34: Soil ADC1_CH6
                </text>
                <text x="292" y="270" fill="#ffb300" fontSize="10" fontFamily="IBM Plex Mono">
                  • SPI: NSS(10) RST(14) DIO0(2)
                </text>

                {/* Stage Radar / Ultrasonic Module */}
                <rect
                  x="25"
                  y="165"
                  width="195"
                  height="95"
                  fill="#111318"
                  stroke={activeFault === "debris_echo" ? "#ff2a2a" : "#00e5ff"}
                  strokeWidth="2"
                />
                <text x="38" y="190" fill="#00e5ff" fontSize="11" fontWeight="bold" fontFamily="IBM Plex Mono">
                  MOD_02 // STAGE RADAR/SONAR
                </text>
                <text x="38" y="210" fill="#f2efe9" fontSize="10" fontFamily="IBM Plex Mono">
                  JSN-SR04T / 24GHz FMCW
                </text>
                <text x="38" y="228" fill="#88857e" fontSize="10" fontFamily="IBM Plex Mono">
                  TRIG → GPIO4 | ECHO → GPIO5
                </text>
                <text x="38" y="246" fill="#00e676" fontSize="10" fontFamily="IBM Plex Mono">
                  h = H_datum - (c · t_us)/2
                </text>

                {/* Hyetograph & Soil Moisture Array */}
                <rect
                  x="25"
                  y="285"
                  width="195"
                  height="90"
                  fill="#111318"
                  stroke="#00e676"
                  strokeWidth="1.8"
                />
                <text x="38" y="308" fill="#00e676" fontSize="11" fontWeight="bold" fontFamily="IBM Plex Mono">
                  MOD_04 // RAIN &amp; SOIL ARRAY
                </text>
                <text x="38" y="328" fill="#f2efe9" fontSize="10" fontFamily="IBM Plex Mono">
                  0.2mm/tip Reed ISR → GPIO19
                </text>
                <text x="38" y="346" fill="#88857e" fontSize="10" fontFamily="IBM Plex Mono">
                  Capacitive Probe → GPIO34 ADC
                </text>
                <text x="38" y="364" fill="#ffb300" fontSize="10" fontFamily="IBM Plex Mono">
                  Runoff Factor C_r ∈ [1.0, 1.6]
                </text>

                {/* SX1276 865MHz LoRaWAN Module */}
                <rect
                  x="535"
                  y="55"
                  width="200"
                  height="120"
                  fill="#111318"
                  stroke={
                    activeFault === "cellular_blackout" || activeFault === "lora_airtime"
                      ? "#ffb300"
                      : "#00e676"
                  }
                  strokeWidth="2"
                />
                <text x="548" y="80" fill="#ffb300" fontSize="11" fontWeight="bold" fontFamily="IBM Plex Mono">
                  MOD_03 // SX1276 865MHz LORA
                </text>
                <text x="548" y="100" fill="#f2efe9" fontSize="10" fontFamily="IBM Plex Mono">
                  Link Budget: 168 dB · +20 dBm
                </text>
                <text x="548" y="118" fill="#88857e" fontSize="10" fontFamily="IBM Plex Mono">
                  SPI Bus: GPIO10 / 14 / 2
                </text>
                <text x="548" y="136" fill="#00e676" fontSize="10" fontFamily="IBM Plex Mono">
                  P2P Mesh Failover &lt; 200ms
                </text>
                <text x="548" y="154" fill="#00e5ff" fontSize="10" fontFamily="IBM Plex Mono">
                  ADR SF9 · TDMA Slotted
                </text>

                {/* Acoustic Siren & CAP Gateway */}
                <rect
                  x="535"
                  y="220"
                  width="200"
                  height="120"
                  fill="#111318"
                  stroke="#00e5ff"
                  strokeWidth="1.8"
                />
                <text x="548" y="245" fill="#00e5ff" fontSize="11" fontWeight="bold" fontFamily="IBM Plex Mono">
                  MOD_06 // SIREN &amp; CAP GATEWAY
                </text>
                <text x="548" y="265" fill="#f2efe9" fontSize="10" fontFamily="IBM Plex Mono">
                  Opto-Relay GPIO21 → 115dB Horn
                </text>
                <text x="548" y="283" fill="#88857e" fontSize="10" fontFamily="IBM Plex Mono">
                  4G-LTE SIM7600 MQTT TLS
                </text>
                <text x="548" y="301" fill="#00e676" fontSize="10" fontFamily="IBM Plex Mono">
                  ITU-T CAP v1.2 + Telegram API
                </text>

                {/* Interconnect Bus Lines */}
                <line x1="220" y1="78" x2="275" y2="145" stroke="#ffb300" strokeWidth="2" />
                <line x1="220" y1="210" x2="275" y2="200" stroke="#00e5ff" strokeWidth="2" />
                <line x1="220" y1="330" x2="275" y2="255" stroke="#00e676" strokeWidth="2" />
                <line x1="485" y1="165" x2="535" y2="115" stroke="#ffb300" strokeWidth="2" />
                <line x1="485" y1="235" x2="535" y2="275" stroke="#00e5ff" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* Right 5 Cols: Interactive Fault Injector & Diagnosis */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="panel-header">
                <span>FAULT INJECTION &amp; EDGE RESILIENCE MATRIX</span>
                <span className="text-[#00e676]">SELECT FAILURE MODE</span>
              </div>

              <div className="p-4 space-y-2 border-b border-[#222220]">
                {(Object.keys(NODE_FAULTS) as FaultType[]).map((fKey) => {
                  const item = NODE_FAULTS[fKey];
                  const active = activeFault === fKey;
                  return (
                    <button
                      key={fKey}
                      onClick={() => setActiveFault(fKey)}
                      className={`w-full p-2.5 text-left font-mono text-xs border cursor-pointer transition flex items-center justify-between ${
                        active
                          ? "bg-[#151515] border-[#00e5ff] text-[#f2efe9] font-bold"
                          : "bg-[#0b0b0b] border-[#222220] text-[#88857e] hover:text-[#f2efe9]"
                      }`}
                    >
                      <span>
                        <span className="text-[#00e5ff] mr-2">[{item.code}]</span>
                        {item.label}
                      </span>
                      <span className="text-[10px] text-[#00e676]">INSPECT</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-4 sm:p-5 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#88857e] text-[10px]">{faultInfo.domain}</span>
                  <span className="px-2 py-0.5 border border-[#00e5ff] text-[#00e5ff] text-[10px] font-bold">
                    {faultInfo.status}
                  </span>
                </div>
                <p className="text-xs text-[#f2efe9] leading-relaxed font-sans">
                  {faultInfo.diagnosis}
                </p>
                <div className="p-3 bg-[#080808] border border-[#222220] text-[#00e676] text-[11px]">
                  EDGE MITIGATION: {faultInfo.mitigation}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#222220] bg-[#0b0b0b] flex items-center justify-between font-mono text-xs">
              <span className="text-[#88857e] text-[11px]">TEST LIVE IN BASIN STAGE:</span>
              <Link href="/playground" className="text-[#00e5ff] hover:underline font-bold">
                LAUNCH PLAYGROUND →
              </Link>
            </div>
          </div>
        </section>

        {/* 6 Subsystems Detailed Spec + Full Production Sketch */}
        <section className="grid grid-cols-1 lg:grid-cols-12 border border-[#222220] bg-[#0e0e0e]">
          {/* Left 5 Cols: Subsystem Selector */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#222220]">
            <div className="panel-header">
              <span>6 EDGE STATION SUBSYSTEM SPECIFICATIONS</span>
              <span>CLICK TO INSPECT</span>
            </div>

            <div className="divide-y divide-[#222220]">
              {HARDWARE_MODULES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`w-full p-4 text-left cursor-pointer transition block ${
                    selectedId === m.id ? "bg-[#151515] border-l-4 border-l-[#00e5ff]" : "hover:bg-[#121212]"
                  }`}
                >
                  <div className="font-mono text-xs font-bold text-[#f2efe9]">
                    <span className="text-[#00e5ff] mr-2">[{m.code}]</span>
                    {m.name}
                  </div>
                  <div className="font-mono text-[11px] text-[#88857e] mt-1">{m.pins}</div>
                </button>
              ))}
            </div>

            <div className="p-4 bg-[#080808] border-t border-[#222220] space-y-2 font-mono text-xs">
              <div className="text-[#00e5ff] font-bold">{activeModule.name}</div>
              <ul className="space-y-1.5 text-[11px] text-[#88857e] list-disc list-inside">
                {activeModule.specs.map((sp) => (
                  <li key={sp}>{sp}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right 7 Cols: Complete Production ESP32-S3 Firmware Code */}
          <div className="lg:col-span-7 bg-[#080808] flex flex-col justify-between min-w-0">
            <div>
              <div className="panel-header">
                <span>PRODUCTION SKETCH // AegisFlood_ESP32S3_Edge_Kalman_Node.ino</span>
                <button
                  onClick={handleCopyCode}
                  className="text-[#00e5ff] hover:underline font-bold cursor-pointer"
                >
                  {copied ? "✓ COPIED" : "COPY FULL SKETCH"}
                </button>
              </div>
              <div className="p-4">
                <pre className="p-4 bg-[#0e0e0e] border border-[#222220] font-mono text-[11px] text-[#f2efe9] overflow-x-auto max-h-[520px] custom-scrollbar leading-relaxed">
                  {FULL_ESP32_SKETCH}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-[#222220] bg-[#0b0b0b] flex flex-wrap items-center justify-between gap-3">
              <button onClick={handleDownloadIno} className="brutal-btn brutal-btn-primary">
                ⬇ DOWNLOAD .INO FILE
              </button>
              <Link href="/how-it-works" className="brutal-btn">
                MATHEMATICAL DERIVATIONS →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
