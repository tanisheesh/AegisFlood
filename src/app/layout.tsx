import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://aegisflood.tanisheesh.in";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#080808",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AegisFlood — IoT Hydrological Digital Twin & Edge-AI Early Warning System",
    template: "%s | AegisFlood",
  },
  description:
    "Interactive 5-Node River Basin Hydrological Digital Twin, In-Browser ESP32-S3 Edge Kalman Filter Patcher, Saint-Venant Kinematic Wave Forecaster, and Dynamic Dijkstra Safe Evacuation Workbench (ESP32-S3 + 24GHz Radar/JSN-SR04T + SX1276 865MHz LoRaWAN Mesh).",
  applicationName: "AegisFlood",
  authors: [{ name: "Tanish Poddar", url: "https://tanisheesh.in" }],
  creator: "Tanish Poddar",
  publisher: "Tanish Poddar",
  keywords: [
    "AegisFlood",
    "Smart Flood Monitoring System",
    "IoT Early Warning System",
    "Hydrological Digital Twin",
    "1D Kalman Filter Edge Computing",
    "Saint-Venant Kinematic Wave",
    "Dijkstra Evacuation Routing",
    "ESP32-S3 LoRaWAN Flood Sensor",
    "SX1276 865MHz Mesh",
    "Tanish Poddar",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "AegisFlood",
    title: "AegisFlood — IoT Hydrological Digital Twin & Edge-AI Early Warning System",
    description:
      "Static water-level alarms trigger only after embankments breach. AegisFlood simulates a 5-node river basin mesh with 1D Edge Kalman debris filtering, Saint-Venant kinematic wave forecasting, and dynamic Dijkstra evacuation routing.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AegisFlood — IoT Hydrological Digital Twin & Edge-AI Early Warning System",
    description:
      "5-Node River Basin Digital Twin: ESP32-S3 1D Kalman Filter + Saint-Venant Kinematic Wave Forecaster + Dijkstra Safe Route Engine + 865MHz LoRaWAN Failover.",
    creator: "@tanisheeshh",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  category: "technology",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AegisFlood",
  operatingSystem: "Web, ESP32-S3 RTOS, Linux, Windows, macOS",
  applicationCategory: "DeveloperApplication",
  url: SITE_URL,
  author: [
    {
      "@type": "Person",
      name: "Tanish Poddar",
      url: "https://tanisheesh.in",
    },
  ],
  description:
    "Interactive 5-Node River Basin Hydrological Digital Twin, In-Browser Edge Kalman Filter Patcher, and Dynamic Dijkstra Community Early Warning System.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen overflow-x-hidden antialiased selection:bg-[#ff4d00] selection:text-black">
        {children}
      </body>
    </html>
  );
}
