"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const MATHEMATICAL_LAWS = [
  {
    code: "LAW 01 // STAGE RANGING",
    title: "NON-CONTACT TIME-OF-FLIGHT WATER STAGE CONVERSION",
    formula: "h_raw(t) = H_datum - (c · t_echo) / 2 = H_datum - (t_µs × 0.000343 m/µs) / 2",
    desc: "Mounted beneath a river bridge at known datum elevation H_datum above the riverbed, the transducer measures round-trip acoustic/radar echo duration t_µs to the water surface and subtracts distance-to-surface from H_datum.",
  },
  {
    code: "LAW 02 // EDGE ESTIMATION",
    title: "1D KALMAN FILTER WITH 3.8σ INNOVATION GATE DEBRIS REJECTION",
    formula:
      "P_k⁻ = P_{k-1} + Q  |  R_eff = 65·R if |z_k - x̂_k⁻| > 0.45m else R  |  K_k = P_k⁻/(P_k⁻ + R_eff)  |  x̂_k = x̂_k⁻ + K_k(z_k - x̂_k⁻)",
    desc: "Physical rivers cannot rise by >0.45 m within a 1-second sampling interval. When floating logs or debris cause a sudden spike in z_k, the innovation gate scales measurement noise covariance R by 65x, driving Kalman gain K_k near zero so the state estimate x̂_k remains uncorrupted.",
  },
  {
    code: "LAW 03 // OPEN-CHANNEL FLOW",
    title: "MANNING'S HYDRAULIC DISCHARGE & SOIL SATURATION RUNOFF",
    formula:
      "Q = A(h) · (1 / n) · R_h(h)^(2/3) · S_0^(1/2)   |   C_r(θ_v) = 1.0 + 0.6 · max(0, (θ_v - 50) / 50)",
    desc: "Open-channel volumetric flow Q (m³/s) scales non-linearly with wetted cross-sectional area A(h), hydraulic radius R_h, channel roughness n, and bed slope S_0. As volumetric soil moisture θ_v exceeds 50%, infiltration drops and surface runoff C_r amplifies flood wave growth.",
  },
  {
    code: "LAW 04 // WAVE PROPAGATION",
    title: "1D SAINT-VENANT CONTINUITY & KINEMATIC WAVE CELERITY",
    formula: "∂A/∂t + ∂Q/∂x = q_lateral   |   c_k = dQ/dA ≈ (5 / 3) · v_mean   |   Δt_lag = Δx / c_k",
    desc: "Upstream cloudbursts and dam spillway releases propagate downstream at kinematic wave celerity c_k = (5/3)·v_mean with distance attenuation. Fusing upstream excess head with local dh/dt yields +15m, +30m, +60m, and +120m water stage forecasts.",
  },
  {
    code: "LAW 05 // GRAPH ROUTING",
    title: "DYNAMIC DIJKSTRA SHORTEST SAFE EVACUATION PATH ON G(V, E)",
    formula:
      "w(e, t) = ∞ if h(node_e, t) ≥ H_submerge(e)   |   w(e, t) = 3.2·d(e) if h ≥ H_submerge - 0.65m   |   min ∑ w(e, t)",
    desc: "Community road corridors are modeled as a weighted graph G(V, E). Whenever a river node crosses a bridge's submergence threshold, edge weight becomes infinite and Dijkstra's algorithm automatically recomputes high-ground shelter paths.",
  },
];

const LIMITATIONS_VS_FUTURE = [
  {
    id: "LIM_01",
    limitation: "1D Cross-Sectional Channel Approximation",
    cause:
      "1D Saint-Venant kinematic equations assume uniform cross-sectional velocity and simplified floodplain geometry.",
    upgrade: "2D Shallow-Water GPU Solver + LiDAR DEM Bathymetry",
    solution:
      "Integrates 1-meter resolution Digital Elevation Models (DEM) to compute street-by-street 2D hydrodynamic inundation vectors.",
  },
  {
    id: "LIM_02",
    limitation: "Heavy Foam & Turbulence Acoustic Scattering",
    cause:
      "40 kHz ultrasonic pulses suffer signal attenuation over aerating whitewater rapids and thick monsoon surface foam.",
    upgrade: "77 GHz FMCW Millimeter-Wave Radar + Dual-Pressure Piezometer",
    solution:
      "Fuses non-contact 77 GHz radar with a submerged vented hydrostatic pressure transducer for dual-redundant stage lock.",
  },
  {
    id: "LIM_03",
    limitation: "Linear Kinematic Extrapolation Over Long Horizons",
    cause:
      "Kinematic wave travel-time lag works well up to +120 minutes but does not capture multi-day synoptic cyclone trajectories.",
    upgrade: "Spatio-Temporal Graph Neural Network (ST-GNN) + IMD Doppler Radar",
    solution:
      "Ingests gridded satellite precipitation nowcasts into a Graph Attention Network across all tributary nodes for 24-hour lead times.",
  },
  {
    id: "LIM_04",
    limitation: "Terrestrial LoRa Line-of-Sight Canyon Shadowing",
    cause:
      "Deep Himalayan gorges can obstruct 865 MHz terrestrial P2P paths beyond 8–10 km without elevated repeater relays.",
    upgrade: "NTN Satellite IoT (LoRa-FHSS / Iridium SBD) Emergency Uplink",
    solution:
      "Adds direct-to-satellite LoRa-FHSS fallback on headwater gateway nodes when both 4G cellular and terrestrial mesh links fail.",
  },
];

const ENGINEERING_QA = [
  {
    q: "Why run a 1D Kalman Filter with an Innovation Gate on the ESP32-S3 instead of a simple moving average?",
    a: "A N-sample moving average introduces phase lag during genuine flash-flood surges while still getting pulled upward by a +2.0m floating timber reflection. By gating on the innovation residual |z_k - x̂_k⁻| > 0.45m and inflating measurement covariance R by 65x only during physically impossible 1-second jumps, the Kalman filter achieves zero-lag tracking of real flood waves while completely rejecting debris spikes.",
  },
  {
    q: "Why model evacuation routing as a dynamic weighted graph G(V, E) rather than static map directions?",
    a: "The shortest road from a riverside settlement to a relief camp almost always crosses low-lying suspension bridges or causeways that submerge first. Coupling graph edge weights directly to real-time Kalman water stages ensures evacuation alerts never direct citizens onto flooded bridges.",
  },
  {
    q: "Why pair 4G-LTE MQTT with an 865 MHz SX1276 LoRaWAN P2P mesh fallback?",
    a: "Cellular base stations rely on grid power and fiber backhaul, both of which frequently fail during cloudbursts and landslides. Operating a sub-GHz 865 MHz LoRa mesh (168 dB link budget, SF9) allows upstream nodes to hop telemetry node-to-node down the river valley without any telecom infrastructure.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div className="border border-[#222220] bg-[#0e0e0e] p-5 sm:p-8 lg:p-10">
          <div className="font-mono text-[11px] sm:text-xs text-[#00e5ff] uppercase tracking-widest mb-2">
            // HYDROLOGICAL PHYSICS, KALMAN ESTIMATION &amp; GRAPH ROUTING SPECIFICATION
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl uppercase text-[#f2efe9]">
            HYDROLOGY, KALMAN LAWS &amp; ARCHITECTURE
          </h1>
          <p className="text-xs sm:text-base text-[#88857e] mt-3 max-w-3xl leading-relaxed">
            Governing Saint-Venant kinematic wave equations, 1D Kalman innovation gating, Manning
            open-channel discharge formulas, dynamic Dijkstra edge weighting, and system design
            tradeoffs.
          </p>
        </div>

        {/* 5 Mathematical Laws */}
        <section className="border border-[#222220] bg-[#0e0e0e]">
          <div className="panel-header">
            <span>GOVERNING MATHEMATICAL LAWS // 5 EQUATIONS DRIVING THE DIGITAL TWIN</span>
            <span className="text-[#00e5ff]">REALTIME SOLVER</span>
          </div>

          <div className="divide-y divide-[#222220]">
            {MATHEMATICAL_LAWS.map((law) => (
              <div key={law.code} className="p-5 sm:p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                  <span className="text-[#00e5ff] font-bold">{law.code}</span>
                  <span className="text-[#f2efe9] font-bold">{law.title}</span>
                </div>
                <div className="p-3.5 bg-[#080808] border border-[#222220] font-mono text-xs sm:text-sm text-[#00e676] overflow-x-auto custom-scrollbar">
                  {law.formula}
                </div>
                <p className="text-xs sm:text-sm text-[#88857e] leading-relaxed">{law.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Engineering Decisions Q&A */}
        <section className="border border-[#222220] bg-[#0e0e0e]">
          <div className="panel-header">
            <span>SYSTEMS ENGINEERING DECISIONS // ARCHITECTURAL RATIONALE</span>
            <span className="text-[#ffb300]">EDGE + MESH + GRAPH</span>
          </div>

          <div className="divide-y divide-[#222220]">
            {ENGINEERING_QA.map((item) => (
              <div key={item.q} className="p-5 sm:p-6 space-y-2">
                <h3 className="font-mono text-xs sm:text-sm font-bold text-[#f2efe9]">{item.q}</h3>
                <p className="text-xs sm:text-sm text-[#88857e] leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Limitations vs v2 Upgrades */}
        <section className="border border-[#222220] bg-[#0e0e0e]">
          <div className="panel-header">
            <span>CURRENT BOUNDARIES VS. V2 PRODUCTION ROADMAP</span>
            <span>4 ARCHITECTURAL UPGRADES</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md: gap-0 border-t border-[#222220]">
            {LIMITATIONS_VS_FUTURE.map((item) => (
              <div key={item.id} className="p-5 border-b border-r border-[#222220] space-y-2.5">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-[#ff5500] font-bold">
                    [{item.id}] {item.limitation}
                  </span>
                </div>
                <p className="text-xs text-[#88857e]">{item.cause}</p>
                <div className="pt-2 border-t border-[#222220]">
                  <div className="font-mono text-xs text-[#00e676] font-bold">
                    V2 UPGRADE // {item.upgrade}
                  </div>
                  <p className="text-xs text-[#f2efe9] mt-1">{item.solution}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <div className="border border-[#222220] bg-[#0b0b0b] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="font-mono text-xs sm:text-sm text-[#f2efe9]">
            Ready to test 1D Kalman debris rejection and dynamic Dijkstra rerouting live?
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/playground" className="brutal-btn brutal-btn-primary">
              LAUNCH BASIN DIGITAL TWIN →
            </Link>
            <Link href="/network" className="brutal-btn">
              INSPECT NODE SCHEMATIC →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
