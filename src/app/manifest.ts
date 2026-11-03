import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AegisFlood — IoT Hydrological Digital Twin & Early Warning System",
    short_name: "AegisFlood",
    description:
      "5-Node River Basin Hydrological Digital Twin, 1D Edge Kalman Filter, Kinematic Wave AI Forecaster & Dynamic Dijkstra Evacuation Workbench.",
    start_url: "/",
    display: "standalone",
    background_color: "#080808",
    theme_color: "#ff4d00",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
