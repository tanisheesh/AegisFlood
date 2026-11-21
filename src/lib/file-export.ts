import type { TelemetrySample } from "@/lib/basin-config";

export function formatTelemetryCsv(samples: TelemetrySample[]): string {
  const headers =
    "tick,timestamp,node_id,raw_stage_m,kalman_stage_m,forecast_60m,residual_m,discharge_m3s,rainfall_mm_hr,anomaly_rejected";
  const rows = samples.map(
    (s) =>
      `${s.tick},${s.ts},${s.nodeId},${s.rawStageM},${s.kalmanStageM},${s.forecast60M},${s.residualM},${s.dischargeM3s},${s.rainfallMmHr},${s.anomalyRejected}`,
  );
  return `${headers}\n${rows.join("\n")}`;
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
