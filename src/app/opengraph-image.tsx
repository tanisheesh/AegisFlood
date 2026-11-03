import { ImageResponse } from "next/og";

export const alt =
  "AegisFlood — 5-Node River Basin Hydrological Digital Twin & Edge-AI Early Warning System";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#080808",
          padding: "56px 64px",
          border: "12px solid #222220",
          color: "#F2EFE9",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderBottom: "2px solid #222220",
            paddingBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "#FF4D00",
                color: "#080808",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "24px",
              }}
            >
              AF
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "0.04em" }}>
                AEGISFLOOD
              </span>
              <span style={{ fontSize: "13px", color: "#88857E", letterSpacing: "0.14em" }}>
                SYS.REV.2.4 // ESP32-S3 + 1D KALMAN GATE + SAINT-VENANT WAVE + LORA MESH
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "8px 18px",
              border: "2px solid #00E676",
              color: "#00E676",
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            aegisflood.tanisheesh.in
          </div>
        </div>

        {/* Center Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "16px",
              color: "#FF4D00",
              fontWeight: 700,
              letterSpacing: "0.2em",
            }}
          >
            IOT HYDROLOGICAL DIGITAL TWIN &amp; COMMUNITY EARLY WARNING SYSTEM
          </div>
          <div
            style={{
              fontSize: "68px",
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              color: "#F2EFE9",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>STATIC WATER ALARMS FAIL</span>
            <span style={{ color: "#FF4D00" }}>BEFORE THE WAVE HITS.</span>
          </div>
          <div
            style={{
              fontSize: "22px",
              color: "#88857E",
              maxWidth: "980px",
              lineHeight: 1.4,
            }}
          >
            5-Node River Basin Digital Twin simulating ESP32-S3 1D Kalman debris rejection, Saint-Venant kinematic wave forecasting, and dynamic Dijkstra safe evacuation routing.
          </div>
        </div>

        {/* Bottom KPI Strip */}
        <div
          style={{
            display: "flex",
            width: "100%",
            borderTop: "2px solid #222220",
            paddingTop: "24px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "34px", fontWeight: 900, color: "#FF4D00" }}>58.0 KM</span>
            <span style={{ fontSize: "12px", color: "#88857E", letterSpacing: "0.1em" }}>
              5-NODE RIVER BASIN MESH
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "34px", fontWeight: 900, color: "#00E676" }}>3.8σ GATE</span>
            <span style={{ fontSize: "12px", color: "#88857E", letterSpacing: "0.1em" }}>
              1D KALMAN DEBRIS FILTER
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "34px", fontWeight: 900, color: "#F2EFE9" }}>DIJKSTRA G(V,E)</span>
            <span style={{ fontSize: "12px", color: "#88857E", letterSpacing: "0.1em" }}>
              DYNAMIC SHELTER ROUTING
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: "19px", fontWeight: 800, color: "#F2EFE9" }}>
              TANISH PODDAR
            </span>
            <span style={{ fontSize: "13px", color: "#88857E" }}>
              tanisheesh.in · github.com/tanisheesh
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
