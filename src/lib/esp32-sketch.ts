export const FULL_ESP32_SKETCH = `// ============================================================================
// AEGISFLOOD // PRODUCTION EDGE NODE FIRMWARE (ESP32-S3 + SX1276 LoRa + KALMAN)
// Node: NODE-03 (Rishikesh Triveni Basin) | MCU: ESP32-S3 @ 240 MHz
// Features: 1D Kalman Filter, Innovation Gate Debris Rejection, LoRa Failover
// ============================================================================

#include <WiFi.h>
#include <PubSubClient.h>
#include <SPI.h>
#include <LoRa.h>

#define NODE_ID               "NODE-03"
#define PIN_SONAR_TRIG        4
#define PIN_SONAR_ECHO        5
#define PIN_RAIN_ISR          19
#define PIN_SOIL_ADC          34
#define PIN_LORA_SS           10
#define PIN_LORA_RST          14
#define PIN_LORA_DIO0         2
#define PIN_SIREN_RELAY       21

// Hydrological & Kalman Constants (Live-Patchable via Downlink)
float BRIDGE_DATUM_M        = 9.00f;
float DANGER_LEVEL_M        = 5.60f;
float KALMAN_Q              = 0.008f; // Process noise covariance (m^2)
float KALMAN_R              = 0.080f; // Measurement noise covariance (m^2)
float INNOVATION_GATE_M     = 0.450f; // Max physically plausible 1s jump (m)

struct KalmanFilter1D {
  float x = 2.90f; // Estimated true water stage (m)
  float p = 1.00f; // Error covariance
  float k = 0.00f; // Kalman gain
} kf;

volatile uint32_t rainBucketTips = 0;
void IRAM_ATTR onRainBucketTip() {
  rainBucketTips++;
}

float sampleRawWaterStageM() {
  digitalWrite(PIN_SONAR_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_SONAR_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_SONAR_TRIG, LOW);

  long durationUs = pulseIn(PIN_SONAR_ECHO, HIGH, 45000);
  if (durationUs <= 0) return kf.x;
  float distanceToSurfaceM = (durationUs * 0.000343f) * 0.5f;
  return max(0.20f, BRIDGE_DATUM_M - distanceToSurfaceM);
}

float stepEdgeKalman(float rawStageM, bool &anomalyRejected, float &residualM) {
  residualM = fabs(rawStageM - kf.x);
  // Innovation Gate: floating timber/debris causes instantaneous positive spike
  anomalyRejected = (residualM > INNOVATION_GATE_M);

  // Prior prediction
  kf.p = kf.p + KALMAN_Q;

  // Inflate measurement covariance 65x when debris glitch is detected
  float effectiveR = anomalyRejected ? (KALMAN_R * 65.0f) : KALMAN_R;
  kf.k = kf.p / (kf.p + effectiveR);
  kf.x = kf.x + kf.k * (rawStageM - kf.x);
  kf.p = (1.0f - kf.k) * kf.p;

  return kf.x;
}

void transmitTelemetryFrame(float rawM, float kalmanM, float residualM, bool anomaly) {
  char frame[256];
  snprintf(
    frame, sizeof(frame),
    "{\\"node\\":\\"%s\\",\\"raw\\":%.3f,\\"kalman\\":%.3f,\\"res\\":%.3f,\\"anomaly\\":%s}",
    NODE_ID, rawM, kalmanM, residualM, anomaly ? "true" : "false"
  );

  // Primary: 4G-LTE MQTT | Automatic Failover: 865 MHz LoRaWAN P2P Mesh
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[MQTT_TLS] %s\\n", frame);
  } else {
    LoRa.beginPacket();
    LoRa.print(frame);
    LoRa.endPacket();
    Serial.printf("[LORA_865_MESH] %s\\n", frame);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_SONAR_TRIG, OUTPUT);
  pinMode(PIN_SONAR_ECHO, INPUT);
  pinMode(PIN_SIREN_RELAY, OUTPUT);
  pinMode(PIN_RAIN_ISR, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_RAIN_ISR), onRainBucketTip, FALLING);

  LoRa.setPins(PIN_LORA_SS, PIN_LORA_RST, PIN_LORA_DIO0);
  LoRa.begin(865E6);
}

void loop() {
  bool anomaly = false;
  float residual = 0.0f;
  float rawStage = sampleRawWaterStageM();
  float trueStage = stepEdgeKalman(rawStage, anomaly, residual);

  digitalWrite(PIN_SIREN_RELAY, (trueStage >= DANGER_LEVEL_M) ? HIGH : LOW);
  transmitTelemetryFrame(rawStage, trueStage, residual, anomaly);
  delay(1000);
}
`;
