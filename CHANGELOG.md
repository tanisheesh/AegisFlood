# Changelog

All notable changes to **AegisFlood** are documented here.

---

## [1.0.0] — 2026-11-03

### ✨ Added
- 5-Node River Basin Hydrological Digital Twin (`NODE-01 Devprayag` to `NODE-05 Roorkee`) with 1D Saint-Venant kinematic wave propagation and Manning open-channel discharge solver
- Edge 1D Kalman Filter with $3.8\sigma$ innovation gate (`|r_k| > 0.45 m`) to reject floating timber and acoustic debris spikes without phase lag
- In-browser ESP32-S3 C++ firmware constant patcher (`KALMAN_Q`, `KALMAN_R`, `INNOVATION_GATE_M`) and pre-warmed dual-trace oscilloscope with multi-horizon (`+15m`, `+30m`, `+60m`, `+120m`) forecast strip and `.CSV` / `.JSON` blackbox export
- Dynamic Dijkstra shortest-safe-path evacuation router on road graph $G(V, E)$ connecting 4 floodplain settlements (`V1–V4`) to 3 high-ground NDRF shelters (`S1–S3`)
- Interactive Node Topology & Fault Diagnosis workbench (`/network`) with downloadable production ESP32-S3 + SX1276 LoRa `.ino` firmware
- ITU-T CAP v1.2 and live Telegram Bot emergency broadcast endpoint (`/api/telegram`)
- Dynamic OpenGraph (`1200x630`), Twitter card, and Apple touch icon generators in the NDRF Tactical Blaze (`#FF4D00`) industrial theme

---

[1.0.0]: https://github.com/tanisheesh/AegisFlood/releases/tag/v1.0.0

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
