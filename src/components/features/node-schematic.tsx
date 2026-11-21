"use client";

export type NodeFaultType =
  | "nominal"
  | "debris_echo"
  | "cellular_blackout"
  | "lora_airtime"
  | "solar_brownout";

interface NodeSchematicProps {
  activeFault: NodeFaultType;
  faultCode: string;
}

export function NodeSchematic({ activeFault, faultCode }: NodeSchematicProps) {
  return (
    <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-[#222220] flex flex-col">
      <div className="panel-header">
        <span>EDGE STATION INTERCONNECT SCHEMATIC // STAR GROUND &amp; SPI/ADC BUS</span>
        <span className="text-[#ff4d00] font-bold">{faultCode}</span>
      </div>

      <div className="p-4 bg-[#080808] flex-1 flex items-center justify-center">
        <svg
          viewBox="0 0 760 400"
          role="img"
          aria-label={`ESP32-S3 edge station hardware interconnect schematic in ${faultCode} state`}
          className="w-full h-auto max-h-[380px] border border-[#222220] bg-[#0b0b0a]"
        >
          <rect
            x="25"
            y="30"
            width="195"
            height="95"
            fill="#121210"
            stroke={activeFault === "solar_brownout" ? "#ff2a2a" : "#ffb300"}
            strokeWidth="2"
          />
          <text
            x="38"
            y="55"
            fill="#ffb300"
            fontSize="11"
            fontWeight="bold"
            fontFamily="IBM Plex Mono"
          >
            MOD_05 // SOLAR MPPT + LiFePO4
          </text>
          <text x="38" y="75" fill="#f2efe9" fontSize="10" fontFamily="IBM Plex Mono">
            20W Panel → 6.4V 6000mAh
          </text>
          <text x="38" y="93" fill="#88857e" fontSize="10" fontFamily="IBM Plex Mono">
            INA219 I2C · 5.0V &amp; 3.3V Rails
          </text>
          <text x="38" y="111" fill="#00e676" fontSize="10" fontFamily="IBM Plex Mono">
            TVS Surge + Star GND Bus
          </text>

          <rect
            x="275"
            y="110"
            width="210"
            height="175"
            fill="#161412"
            stroke="#ff4d00"
            strokeWidth="2.5"
          />
          <text
            x="292"
            y="138"
            fill="#ff4d00"
            fontSize="12"
            fontWeight="bold"
            fontFamily="IBM Plex Mono"
          >
            MOD_01 // ESP32-S3 EDGE MCU
          </text>
          <text x="292" y="158" fill="#f2efe9" fontSize="10" fontFamily="IBM Plex Mono">
            Dual-Core Xtensa LX7 @ 240MHz
          </text>
          <text x="292" y="180" fill="#00e676" fontSize="10" fontFamily="IBM Plex Mono">
            • 1D Kalman Filter (Q=0.008)
          </text>
          <text x="292" y="198" fill="#00e676" fontSize="10" fontFamily="IBM Plex Mono">
            • 3.8σ Innovation Gate (R×65)
          </text>
          <text x="292" y="216" fill="#f2efe9" fontSize="10" fontFamily="IBM Plex Mono">
            • GPIO4/5: Sonar Trig/Echo
          </text>
          <text x="292" y="234" fill="#f2efe9" fontSize="10" fontFamily="IBM Plex Mono">
            • GPIO19: Rain Tipping ISR
          </text>
          <text x="292" y="252" fill="#f2efe9" fontSize="10" fontFamily="IBM Plex Mono">
            • GPIO34: Soil ADC1_CH6
          </text>
          <text x="292" y="270" fill="#ffb300" fontSize="10" fontFamily="IBM Plex Mono">
            • SPI: NSS(10) RST(14) DIO0(2)
          </text>

          <rect
            x="25"
            y="165"
            width="195"
            height="95"
            fill="#111318"
            stroke={activeFault === "debris_echo" ? "#ff2a2a" : "#ff4d00"}
            strokeWidth="2"
          />
          <text
            x="38"
            y="190"
            fill="#ff4d00"
            fontSize="11"
            fontWeight="bold"
            fontFamily="IBM Plex Mono"
          >
            MOD_02 // STAGE RADAR/SONAR
          </text>
          <text x="38" y="210" fill="#f2efe9" fontSize="10" fontFamily="IBM Plex Mono">
            JSN-SR04T / 24GHz FMCW
          </text>
          <text x="38" y="228" fill="#88857e" fontSize="10" fontFamily="IBM Plex Mono">
            TRIG → GPIO4 | ECHO → GPIO5
          </text>
          <text x="38" y="246" fill="#00e676" fontSize="10" fontFamily="IBM Plex Mono">
            h = H_datum - (c · t_us)/2
          </text>

          <rect
            x="25"
            y="285"
            width="195"
            height="90"
            fill="#111318"
            stroke="#00e676"
            strokeWidth="1.8"
          />
          <text
            x="38"
            y="308"
            fill="#00e676"
            fontSize="11"
            fontWeight="bold"
            fontFamily="IBM Plex Mono"
          >
            MOD_04 // RAIN &amp; SOIL ARRAY
          </text>
          <text x="38" y="328" fill="#f2efe9" fontSize="10" fontFamily="IBM Plex Mono">
            0.2mm/tip Reed ISR → GPIO19
          </text>
          <text x="38" y="346" fill="#88857e" fontSize="10" fontFamily="IBM Plex Mono">
            Capacitive Probe → GPIO34 ADC
          </text>
          <text x="38" y="364" fill="#ffb300" fontSize="10" fontFamily="IBM Plex Mono">
            Runoff Factor C_r ∈ [1.0, 1.6]
          </text>

          <rect
            x="535"
            y="55"
            width="200"
            height="120"
            fill="#111318"
            stroke={
              activeFault === "cellular_blackout" || activeFault === "lora_airtime"
                ? "#ffb300"
                : "#00e676"
            }
            strokeWidth="2"
          />
          <text
            x="548"
            y="80"
            fill="#ffb300"
            fontSize="11"
            fontWeight="bold"
            fontFamily="IBM Plex Mono"
          >
            MOD_03 // SX1276 865MHz LORA
          </text>
          <text x="548" y="100" fill="#f2efe9" fontSize="10" fontFamily="IBM Plex Mono">
            Link Budget: 168 dB · +20 dBm
          </text>
          <text x="548" y="118" fill="#88857e" fontSize="10" fontFamily="IBM Plex Mono">
            SPI Bus: GPIO10 / 14 / 2
          </text>
          <text x="548" y="136" fill="#00e676" fontSize="10" fontFamily="IBM Plex Mono">
            P2P Mesh Failover &lt; 200ms
          </text>
          <text x="548" y="154" fill="#ff4d00" fontSize="10" fontFamily="IBM Plex Mono">
            ADR SF9 · TDMA Slotted
          </text>

          <rect
            x="535"
            y="220"
            width="200"
            height="120"
            fill="#111318"
            stroke="#ff4d00"
            strokeWidth="1.8"
          />
          <text
            x="548"
            y="245"
            fill="#ff4d00"
            fontSize="11"
            fontWeight="bold"
            fontFamily="IBM Plex Mono"
          >
            MOD_06 // SIREN &amp; CAP GATEWAY
          </text>
          <text x="548" y="265" fill="#f2efe9" fontSize="10" fontFamily="IBM Plex Mono">
            Opto-Relay GPIO21 → 115dB Horn
          </text>
          <text x="548" y="283" fill="#88857e" fontSize="10" fontFamily="IBM Plex Mono">
            4G-LTE SIM7600 MQTT TLS
          </text>
          <text x="548" y="301" fill="#00e676" fontSize="10" fontFamily="IBM Plex Mono">
            ITU-T CAP v1.2 + Telegram API
          </text>

          <line x1="220" y1="78" x2="275" y2="145" stroke="#ffb300" strokeWidth="2" />
          <line x1="220" y1="210" x2="275" y2="200" stroke="#ff4d00" strokeWidth="2" />
          <line x1="220" y1="330" x2="275" y2="255" stroke="#00e676" strokeWidth="2" />
          <line x1="485" y1="165" x2="535" y2="115" stroke="#ffb300" strokeWidth="2" />
          <line x1="485" y1="235" x2="535" y2="275" stroke="#ff4d00" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}
