"use client";

import { Download } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { FULL_ESP32_SKETCH } from "@/lib/aegisflood-data";
import { downloadTextFile } from "@/lib/file-export";
import { QUICKSTART_TABS } from "@/lib/landing-spec";

export function QuickstartPanel() {
  const [activeTab, setActiveTab] = useState<keyof typeof QUICKSTART_TABS>("sketch");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(QUICKSTART_TABS[activeTab].code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadIno = () => {
    downloadTextFile("AegisFlood_ESP32S3_Edge_Kalman_Node.ino", FULL_ESP32_SKETCH, "text/plain");
  };

  return (
    <div className="lg:col-span-6 bg-[#080808] flex flex-col justify-between min-w-0">
      <div>
        <div className="panel-header">
          <span>PRODUCTION ARTIFACTS // FIRMWARE &amp; DIGITAL TWIN</span>
          <button
            type="button"
            onClick={handleDownloadIno}
            className="inline-flex items-center gap-1 text-[#ffb300] hover:underline font-bold cursor-pointer"
          >
            <Download className="w-3 h-3" strokeWidth={1.75} aria-hidden="true" />
            DOWNLOAD .INO SKETCH
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Quickstart Artifacts"
          className="flex border-b border-[#222220] bg-[#0e0e0e] overflow-x-auto"
        >
          {(Object.keys(QUICKSTART_TABS) as Array<keyof typeof QUICKSTART_TABS>).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={activeTab === k}
              onClick={() => setActiveTab(k)}
              className={`px-4 py-2.5 font-mono text-[11px] tracking-wider border-r border-[#222220] cursor-pointer whitespace-nowrap ${
                activeTab === k
                  ? "bg-[#151515] text-[#ff4d00] font-bold border-b-2 border-b-[#ff4d00]"
                  : "text-[#88857e] hover:text-[#f2efe9]"
              }`}
            >
              {QUICKSTART_TABS[k].label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          <pre
            tabIndex={0}
            className="p-4 bg-[#0e0e0e] border border-[#222220] font-mono text-[11px] sm:text-xs text-[#f2efe9] overflow-x-auto leading-relaxed custom-scrollbar"
          >
            {QUICKSTART_TABS[activeTab].code}
          </pre>
        </div>
      </div>

      <div className="p-4 sm:p-6 border-t border-[#222220] bg-[#0b0b0b] flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={handleCopy} className="brutal-btn">
          {copied ? "COPIED TO CLIPBOARD" : "COPY SNIPPET"}
        </button>
        <Link href="/playground" className="brutal-btn brutal-btn-primary">
          OPEN INTERACTIVE BASIN TWIN →
        </Link>
      </div>
    </div>
  );
}
