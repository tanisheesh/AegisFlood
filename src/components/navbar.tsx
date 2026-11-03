"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AegisFloodLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="30"
      height="30"
      viewBox="0 0 64 64"
      fill="none"
      className="shrink-0 transition-transform group-hover:scale-105"
      aria-hidden="true"
    >
      <rect width="64" height="64" fill="#080808" />
      <rect x="3" y="3" width="58" height="58" stroke="#FF4D00" strokeWidth="4" />
      <circle cx="32" cy="18" r="5" fill="#FFB300" />
      <path d="M22 25 L32 18 L42 25" stroke="#FFB300" strokeWidth="2.5" />
      <path
        d="M10 37 C17 31, 25 43, 32 37 C39 31, 47 43, 54 37"
        stroke="#FF4D00"
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
  );
}

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", code: "01", label: "SPECIFICATION", shortLabel: "SPEC" },
    { href: "/playground", code: "02", label: "BASIN DIGITAL TWIN", shortLabel: "TWIN" },
    { href: "/network", code: "03", label: "NODE TOPOLOGY", shortLabel: "NODES" },
    { href: "/how-it-works", code: "04", label: "HYDROLOGY & MATH", shortLabel: "MATH" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#080808]/95 backdrop-blur-sm border-b border-[#222220]">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
        {/* Brand with SVG Logo */}
        <Link href="/" className="flex items-center gap-2.5 group min-w-0">
          <AegisFloodLogo />
          <div className="flex items-baseline gap-2 truncate">
            <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-[#f2efe9]">
              AEGIS<span className="text-[#ff4d00]">FLOOD</span>
            </span>
            <span className="hidden xl:inline font-mono text-[10px] text-[#88857e] tracking-widest">
              SYS.REV.2.4 // ESP32-S3+KALMAN+LORAWAN+DIJKSTRA
            </span>
          </div>
        </Link>

        {/* Center Navigation (Desktop) */}
        <nav className="hidden md:flex items-center h-full">
          {navLinks.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`h-14 px-3.5 lg:px-5 flex items-center gap-2 font-mono text-[11px] lg:text-xs tracking-wider border-l border-[#222220] last:border-r transition-colors whitespace-nowrap ${
                  active
                    ? "bg-[#151515] text-[#ff4d00] border-b-2 border-b-[#ff4d00]"
                    : "text-[#88857e] hover:text-[#f2efe9] hover:bg-[#0e0e0e]"
                }`}
              >
                <span className="text-[10px] text-[#4a4843]">[{item.code}]</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://github.com/tanisheesh/AegisFlood"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] sm:text-xs text-[#88857e] hover:text-[#f2efe9] px-2.5 sm:px-3 py-1.5 border border-[#222220] hover:border-[#88857e] transition"
          >
            SRC ↗
          </a>
          {pathname !== "/playground" ? (
            <Link
              href="/playground"
              className="brutal-btn brutal-btn-primary !py-1.5 !px-3 sm:!py-2 sm:!px-4 !text-[10px] sm:!text-xs"
            >
              LIVE TWIN →
            </Link>
          ) : (
            <Link
              href="/network"
              className="brutal-btn !py-1.5 !px-3 sm:!py-2 sm:!px-4 !text-[10px] sm:!text-xs !border-[#ffb300] !text-[#ffb300]"
            >
              NODE SPEC →
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Navigation Strip */}
      <nav
        aria-label="Mobile Navigation"
        className="grid grid-cols-4 md:hidden border-t border-[#222220] bg-[#0b0b0b]"
      >
        {navLinks.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`py-2.5 px-1 text-center font-mono text-[10px] tracking-wider border-r border-[#222220] last:border-r-0 truncate ${
                active
                  ? "text-[#ff4d00] bg-[#151515] font-bold border-b-2 border-b-[#ff4d00]"
                  : "text-[#88857e]"
              }`}
            >
              <span className="hidden xs:inline">[{item.code}] </span>
              {item.shortLabel}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
