"use client";

import { Download } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { type NodeFaultType, NodeSchematic } from "@/components/features/node-schematic";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { FULL_ESP32_SKETCH, HARDWARE_MODULES } from "@/lib/aegisflood-data";
import { downloadTextFile } from "@/lib/file-export";

const NODE_FAULTS: Record<
  NodeFaultType,
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
  const [activeFault, setActiveFault] = useState<NodeFaultType>("nominal");
  const [copied, setCopied] = useState(false);

  const activeModule = HARDWARE_MODULES.find((m) => m.id === selectedId) ?? HARDWARE_MODULES[0];
  const faultInfo = NODE_FAULTS[activeFault];

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(FULL_ESP32_SKETCH);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadIno = () => {
    downloadTextFile("AegisFlood_ESP32S3_Edge_Kalman_Node.ino", FULL_ESP32_SKETCH, "text/plain");
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        <div className="border border-[#222220] bg-[#0e0e0e] p-5 sm:p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] sm:text-xs text-[#ff4d00] uppercase tracking-widest mb-2">
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
            <button
              type="button"
              onClick={handleDownloadIno}
              className="brutal-btn brutal-btn-primary"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
              DOWNLOAD ESP32 .INO
            </button>
            <Link href="/playground" className="brutal-btn">
              OPEN BASIN DIGITAL TWIN →
            </Link>
          </div>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-12 border border-[#222220] bg-[#0e0e0e]">
          <NodeSchematic activeFault={activeFault} faultCode={faultInfo.code} />

          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="panel-header">
                <span>FAULT INJECTION &amp; EDGE RESILIENCE MATRIX</span>
                <span className="text-[#00e676]">SELECT FAILURE MODE</span>
              </div>

              <div className="p-4 space-y-2 border-b border-[#222220]">
                {(Object.keys(NODE_FAULTS) as NodeFaultType[]).map((fKey) => {
                  const item = NODE_FAULTS[fKey];
                  const active = activeFault === fKey;
                  return (
                    <button
                      key={fKey}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setActiveFault(fKey)}
                      className={`w-full p-2.5 text-left font-mono text-xs border cursor-pointer transition flex items-center justify-between ${
                        active
                          ? "bg-[#151515] border-[#ff4d00] text-[#f2efe9] font-bold"
                          : "bg-[#0b0b0b] border-[#222220] text-[#88857e] hover:text-[#f2efe9]"
                      }`}
                    >
                      <span>
                        <span className="text-[#ff4d00] mr-2">[{item.code}]</span>
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
                  <span className="px-2 py-0.5 border border-[#ff4d00] text-[#ff4d00] text-[10px] font-bold">
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
              <Link href="/playground" className="text-[#ff4d00] hover:underline font-bold">
                LAUNCH PLAYGROUND →
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 border border-[#222220] bg-[#0e0e0e]">
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#222220]">
            <div className="panel-header">
              <span>6 EDGE STATION SUBSYSTEM SPECIFICATIONS</span>
              <span>CLICK TO INSPECT</span>
            </div>

            <div className="divide-y divide-[#222220]">
              {HARDWARE_MODULES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={selectedId === m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`w-full p-4 text-left cursor-pointer transition block ${
                    selectedId === m.id
                      ? "bg-[#151515] border-l-4 border-l-[#ff4d00]"
                      : "hover:bg-[#121212]"
                  }`}
                >
                  <div className="font-mono text-xs font-bold text-[#f2efe9]">
                    <span className="text-[#ff4d00] mr-2">[{m.code}]</span>
                    {m.name}
                  </div>
                  <div className="font-mono text-[11px] text-[#88857e] mt-1">{m.pins}</div>
                </button>
              ))}
            </div>

            <div className="p-4 bg-[#080808] border-t border-[#222220] space-y-2 font-mono text-xs">
              <h2 className="text-[#ff4d00] font-bold">{activeModule.name}</h2>
              <ul className="space-y-1.5 text-[11px] text-[#88857e] list-disc list-inside">
                {activeModule.specs.map((sp) => (
                  <li key={sp}>{sp}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#080808] flex flex-col justify-between min-w-0">
            <div>
              <div className="panel-header">
                <span>PRODUCTION SKETCH // AegisFlood_ESP32S3_Edge_Kalman_Node.ino</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-[#ff4d00] hover:underline font-bold cursor-pointer"
                >
                  {copied ? "COPIED" : "COPY FULL SKETCH"}
                </button>
              </div>
              <div className="p-4">
                <pre
                  tabIndex={0}
                  className="p-4 bg-[#0e0e0e] border border-[#222220] font-mono text-[11px] text-[#f2efe9] overflow-x-auto max-h-[520px] custom-scrollbar leading-relaxed"
                >
                  {FULL_ESP32_SKETCH}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-[#222220] bg-[#0b0b0b] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDownloadIno}
                className="brutal-btn brutal-btn-primary"
              >
                <Download className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                DOWNLOAD .INO FILE
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
