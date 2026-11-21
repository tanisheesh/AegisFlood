import Link from "next/link";
import { AegisFloodLogo } from "@/components/ui/aegis-logo";

export default function Footer() {
  return (
    <footer className="border-t border-[#222220] bg-[#080808] text-[#88857e] mt-12 sm:mt-20">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 font-mono text-xs">
        <div className="flex items-center gap-3 min-w-0">
          <AegisFloodLogo size={28} />
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
                className="text-[#f2efe9] hover:text-[#ff4d00] underline underline-offset-2"
              >
                Tanish Poddar
              </a>{" "}
              · ESP32-S3 Edge Node + 1D Kalman Filter + Saint-Venant Kinematic Wave + Dijkstra
              Evacuation Engine
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] sm:text-[11px] uppercase tracking-wider">
          <Link href="/" className="hover:text-[#ff4d00] transition">
            [01] Spec
          </Link>
          <Link href="/playground" className="hover:text-[#ff4d00] transition">
            [02] Digital Twin
          </Link>
          <Link href="/network" className="hover:text-[#ff4d00] transition">
            [03] Node Topology
          </Link>
          <Link href="/how-it-works" className="hover:text-[#ff4d00] transition">
            [04] Hydrology &amp; Math
          </Link>
          <a
            href="https://github.com/tanisheesh/AegisFlood"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f2efe9] hover:text-[#ff4d00] transition"
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
