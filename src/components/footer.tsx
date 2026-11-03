import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#222220] bg-[#080808] text-[#88857e] mt-12 sm:mt-20">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 font-mono text-xs">
        <div className="flex items-center gap-3 min-w-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 64 64"
            fill="none"
            className="shrink-0"
            aria-hidden="true"
          >
            <rect width="64" height="64" fill="#080808" />
            <rect x="3" y="3" width="58" height="58" stroke="#00E5FF" strokeWidth="4" />
            <circle cx="32" cy="18" r="5" fill="#FFB300" />
            <path d="M22 25 L32 18 L42 25" stroke="#FFB300" strokeWidth="2.5" />
            <path
              d="M10 37 C17 31, 25 43, 32 37 C39 31, 47 43, 54 37"
              stroke="#00E5FF"
              strokeWidth="4"
              fill="none"
            />
            <path
              d="M10 48 C17 42, 25 54, 32 48 C39 42, 47 54, 54 48"
              stroke="#00E676"
              strokeWidth="4"
              fill="none"
            />
          </svg>
          <div className="space-y-1 min-w-0">
            <div className="text-[#f2efe9] font-bold tracking-wider text-[11px] sm:text-xs">
              AEGISFLOOD // IOT HYDROLOGICAL DIGITAL TWIN &amp; EDGE-AI EARLY WARNING SYSTEM
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#88857e] leading-relaxed">
              Built by{" "}
              <a
                href="https://tanisheesh.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#f2efe9] hover:text-[#00e5ff] underline underline-offset-2"
              >
                Tanish Poddar
              </a>{" "}
              · ESP32-S3 Edge Node + 1D Kalman Filter + Saint-Venant Kinematic Wave + Dijkstra Evacuation Engine
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] sm:text-[11px] uppercase tracking-wider">
          <Link href="/" className="hover:text-[#00e5ff] transition">
            [01] Spec
          </Link>
          <Link href="/playground" className="hover:text-[#00e5ff] transition">
            [02] Digital Twin
          </Link>
          <Link href="/network" className="hover:text-[#00e5ff] transition">
            [03] Node Topology
          </Link>
          <Link href="/how-it-works" className="hover:text-[#00e5ff] transition">
            [04] Hydrology &amp; Math
          </Link>
          <a
            href="https://github.com/tanisheesh/AegisFlood"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f2efe9] hover:text-[#00e5ff] transition"
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
