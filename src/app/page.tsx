import Link from "next/link";
import { QuickstartPanel } from "@/components/features/quickstart-panel";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { EWS_STAGES, HARDWARE_MODULES, TWELVE_STEPS } from "@/lib/aegisflood-data";
import { BENCHMARK_ROWS, HERO_STATION_SNAPSHOT, LANDING_KPIS } from "@/lib/landing-spec";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 lg:px-8">
        <section className="grid grid-cols-1 lg:grid-cols-12 border-x border-b border-[#222220]">
          <div className="lg:col-span-7 p-5 sm:p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-[#222220] flex flex-col justify-between min-w-0">
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.14em] sm:tracking-[0.18em] text-[#ff4d00] mb-4 sm:mb-6">
                <span className="w-2 h-2 shrink-0 bg-[#ff4d00] inline-block" aria-hidden="true" />
                <span>ESP32-S3 // 1D KALMAN GATE // SAINT-VENANT WAVE // SX1276 865MHZ LORA</span>
              </div>

              <h1 className="font-display font-black uppercase text-[clamp(34px,8.5vw,92px)] leading-[0.9] tracking-tight text-[#f2efe9] mb-5 sm:mb-6 break-words">
                STATIC WATER
                <br />
                ALARMS FAIL BEFORE
                <br />
                <span className="text-[#ff4d00]">THE WAVE HITS.</span>
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-[#88857e] max-w-xl leading-relaxed mb-6 sm:mb-8">
                Single-point threshold gauges trigger only after downstream embankments breach,
                while floating logs and storm debris cause rampant false alarms on raw ultrasonic
                sensors. <strong className="text-[#f2efe9] font-semibold">AegisFlood</strong> is a{" "}
                <strong className="text-[#f2efe9] font-semibold">
                  5-Node River Basin Hydrological Digital Twin
                </strong>{" "}
                and distributed early warning system combining{" "}
                <code className="text-[#ff4d00]">ESP32-S3 1D Kalman filtering</code> (
                <code className="text-[#00e676]">|r_k| &gt; 3.8σ</code> debris rejection),{" "}
                <strong className="text-[#f2efe9] font-semibold">
                  1D Saint-Venant kinematic wave forecasting
                </strong>{" "}
                (+15 to +120 min ahead),{" "}
                <strong className="text-[#f2efe9] font-semibold">
                  dynamic Dijkstra evacuation routing
                </strong>
                , and automatic{" "}
                <code className="text-[#ffb300]">865 MHz LoRaWAN mesh failover</code>.
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

          <div className="lg:col-span-5 bg-[#0b0b0b] flex flex-col justify-between min-w-0">
            <div className="panel-header">
              <span>HYDRO_MESH_BUS // 5-STATION RIVER BASIN BASELINE</span>
              <span className="text-[#00e676] font-bold">KALMAN: 10Hz LOCK</span>
            </div>

            <div className="p-4 sm:p-6 space-y-4 font-mono text-xs tabular-nums">
              <div className="space-y-2.5">
                {HERO_STATION_SNAPSHOT.map((s) => (
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
                <div className="text-[10px] text-[#ff4d00] uppercase tracking-wider">
                  1D SAINT-VENANT CONTINUITY &amp; EDGE KALMAN GAIN
                </div>
                <div
                  tabIndex={0}
                  className="text-[#00e676] text-[11px] sm:text-xs overflow-x-auto custom-scrollbar whitespace-nowrap pb-1"
                >
                  ∂A/∂t + ∂Q/∂x = q_L &nbsp;|&nbsp; K_k = P_k⁻ / (P_k⁻ + R_eff) &nbsp;|&nbsp; x̂_k =
                  x̂_k⁻ + K_k(z_k - x̂_k⁻)
                </div>
              </div>
            </div>

            <div className="border-t border-[#222220] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] sm:text-[11px] text-[#88857e]">
              <span>INNOVATION GATE: |z_k - x̂_k⁻| &gt; 0.45m → R×65</span>
              <Link href="/playground" className="text-[#ff4d00] hover:underline font-bold">
                INJECT CLOUDBURST &amp; DEBRIS LIVE →
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-x border-b border-[#222220] bg-[#0b0b0b] tabular-nums">
          {LANDING_KPIS.map((m, idx) => (
            <div
              key={m.label}
              className={`p-5 sm:p-6 border-[#222220] ${
                idx < 3 ? "border-b lg:border-b-0 lg:border-r" : ""
              } ${idx % 2 === 0 ? "sm:border-r" : ""} ${
                idx >= 2 ? "sm:border-b-0" : "sm:border-b"
              }`}
            >
              <div className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-[#ff4d00] tracking-tight">
                {m.num}
              </div>
              <div className="font-mono text-xs font-bold text-[#f2efe9] mt-2 tracking-wider">
                {m.label}
              </div>
              <div className="font-mono text-[11px] text-[#88857e] mt-1">{m.sub}</div>
            </div>
          ))}
        </section>

        <section className="border-x border-b border-[#222220] bg-[#0e0e0e]">
          <div className="panel-header">
            <span>DISTRIBUTED EARLY WARNING ARCHITECTURE // 4-STAGE DETERMINISTIC PIPELINE</span>
            <span className="text-[#ff4d00]">
              SENSE → KALMAN FILTER → KINEMATIC FORECAST → DIJKSTRA DISPATCH
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-[#222220]">
            {EWS_STAGES.map((st) => (
              <div
                key={st.id}
                className="p-4 sm:p-5 border-b border-r border-[#222220] flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="px-2 py-0.5 bg-[#ff4d00] text-[#080808] font-bold">
                      {st.code}
                    </span>
                    <span className="text-[#00e676]">{st.condition}</span>
                  </div>
                  <h2 className="font-display font-black text-xl uppercase text-[#f2efe9]">
                    {st.label}
                  </h2>
                  <p className="text-xs text-[#88857e] leading-relaxed">{st.action}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-x border-b border-[#222220] bg-[#080808]">
          <div className="panel-header">
            <span>TELEMETRY &amp; EVACUATION EXECUTION PIPELINE // 12-STEP CYCLE</span>
            <span>
              PHASE 1: EDGE SENSING &amp; KALMAN [01–06] · PHASE 2: WAVE FORECAST &amp; ROUTING
              [07–12]
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 border-t border-[#222220]">
            {TWELVE_STEPS.map((s) => (
              <div
                key={s.step}
                className="p-4 sm:p-5 border-b border-r border-[#222220] bg-[#0e0e0e] hover:bg-[#141414] transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-[#ff4d00] font-bold">
                      STEP {String(s.step).padStart(2, "0")} // PHASE {s.phase}
                    </span>
                    <span className="px-1.5 py-0.5 border border-[#3a3834] text-[#f2efe9]">
                      {s.state}
                    </span>
                  </div>
                  <h3 className="font-mono text-xs sm:text-sm font-bold text-[#f2efe9]">
                    {s.title}
                  </h3>
                  <p className="text-xs text-[#88857e] leading-relaxed">{s.desc}</p>
                </div>
                <div className="pt-2 border-t border-[#222220] font-mono text-[10px] text-[#00e676]">
                  SUBSYSTEM: {s.hw}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 border-x border-b border-[#222220]">
          <div className="lg:col-span-6 border-b lg:border-b-0 lg:border-r border-[#222220] bg-[#0e0e0e] flex flex-col justify-between">
            <div className="panel-header">
              <span>EDGE SENSING &amp; TELECOM STACK // 6 SUBSYSTEMS</span>
              <Link href="/network" className="text-[#ff4d00] hover:underline">
                INSPECT SCHEMATIC →
              </Link>
            </div>

            <div className="divide-y divide-[#222220]">
              {HARDWARE_MODULES.map((m) => (
                <div key={m.id} className="p-4 sm:p-5 flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                    <span className="text-[#f2efe9] font-bold">
                      <span className="text-[#ff4d00] mr-2">[{m.code}]</span>
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

          <QuickstartPanel />
        </section>

        <section className="border-x border-b border-[#222220] bg-[#0e0e0e]">
          <div className="panel-header">
            <span>
              ARCHITECTURE COMPARISON // REACTIVE GAUGES VS. DISTRIBUTED EDGE-AI DIGITAL TWIN
            </span>
            <span>EVALUATION ACROSS 5 CRITICAL DIMENSIONS</span>
          </div>

          <div tabIndex={0} className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[680px] text-left border-collapse font-mono text-xs">
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
                        ? "bg-[#ff4d00]/10 text-[#f2efe9] font-bold"
                        : "bg-[#0e0e0e] text-[#88857e]"
                    }
                  >
                    <td className="p-3 sm:p-4 border-r border-[#222220] whitespace-nowrap">
                      {r.win && <span className="text-[#ff4d00] mr-1.5">★</span>}
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
