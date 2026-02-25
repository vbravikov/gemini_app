/*
  ESP32-CAM (AI Thinker) + BLE (NimBLE-Arduino)
  - Write "CAP" to CMD characteristic to trigger a capture
  - Receives JPEG over DATA notifications:
      Header (8 bytes):
        0xA5 0x5A
        uint32_le(total_len)
        uint16_le(chunk_size)
      Then raw JPEG bytes in chunk_size packets

  Library: NimBLE-Arduino (install via Arduino Library Manager)
*/

#include "esp_camera.h"
#include <NimBLEDevice.h>

// --------------------
// Camera model: AI Thinker ESP32-CAM pins
// --------------------
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// --------------------
// BLE UUIDs (custom service)
// --------------------
static const char* SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
static const char* CMD_UUID     = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
static const char* DATA_UUID    = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

// --------------------
// Globals
// --------------------
static NimBLECharacteristic* gDataChar = nullptr;
static volatile bool gDoCapture = false;
static volatile bool gConnected = false;

// Conservative chunk size that works even with small MTU
static uint16_t gChunkSize = 180;

// --------------------
// Camera init
// --------------------
void setup_camera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0       = Y2_GPIO_NUM;
  config.pin_d1       = Y3_GPIO_NUM;
  config.pin_d2       = Y4_GPIO_NUM;
  config.pin_d3       = Y5_GPIO_NUM;
  config.pin_d4       = Y6_GPIO_NUM;
  config.pin_d5       = Y7_GPIO_NUM;
  config.pin_d6       = Y8_GPIO_NUM;
  config.pin_d7       = Y9_GPIO_NUM;
  config.pin_xclk     = XCLK_GPIO_NUM;
  config.pin_pclk     = PCLK_GPIO_NUM;
  config.pin_vsync    = VSYNC_GPIO_NUM;
  config.pin_href     = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn     = PWDN_GPIO_NUM;
  config.pin_reset    = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  // Start small for BLE speed/stability (change later if you want)
  config.frame_size   = FRAMESIZE_QVGA; // 320x240 (try VGA later)
  config.jpeg_quality = 12;             // higher number = more compression
  config.fb_count     = 2;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed: 0x%x\n", err);
    while (true) delay(1000);
  }
}

// --------------------
// BLE helpers
// --------------------
static void send_start_header(uint32_t totalLen, uint16_t chunkSize) {
  uint8_t hdr[8];
  hdr[0] = 0xA5; hdr[1] = 0x5A;
  hdr[2] = (uint8_t)(totalLen & 0xFF);
  hdr[3] = (uint8_t)((totalLen >> 8) & 0xFF);
  hdr[4] = (uint8_t)((totalLen >> 16) & 0xFF);
  hdr[5] = (uint8_t)((totalLen >> 24) & 0xFF);
  hdr[6] = (uint8_t)(chunkSize & 0xFF);
  hdr[7] = (uint8_t)((chunkSize >> 8) & 0xFF);

  gDataChar->setValue(hdr, sizeof(hdr));
  gDataChar->notify();
}

class CmdCallbacks : public NimBLECharacteristicCallbacks {
  void handleWrite(NimBLECharacteristic* c) {
    std::string v = c->getValue();
    if (v == "CAP") {
      gDoCapture = true;
    }
  }

public:
  // Older NimBLE-Arduino
  void onWrite(NimBLECharacteristic* c) { handleWrite(c); }
  // Newer NimBLE-Arduino (with conn info)
  void onWrite(NimBLECharacteristic* c, NimBLEConnInfo& connInfo) { handleWrite(c); }
};

class ServerCallbacks : public NimBLEServerCallbacks {
public:
  // Older NimBLE-Arduino
  void onConnect(NimBLEServer* s) {
    gConnected = true;
    Serial.println("BLE connected");
  }
  void onDisconnect(NimBLEServer* s) {
    gConnected = false;
    Serial.println("BLE disconnected");
    NimBLEDevice::startAdvertising();
  }

  // Newer NimBLE-Arduino
  void onConnect(NimBLEServer* s, NimBLEConnInfo& connInfo) {
    gConnected = true;
    Serial.println("BLE connected");
  }
  void onDisconnect(NimBLEServer* s, NimBLEConnInfo& connInfo, int reason) {
    gConnected = false;
    Serial.println("BLE disconnected");
    NimBLEDevice::startAdvertising();
  }
};

void setup_ble() {
  NimBLEDevice::init("ESP32-CAM-BLE");
  NimBLEDevice::setPower(ESP_PWR_LVL_P9);

  // Ask for larger MTU (client decides if it accepts). Safe to call.
  NimBLEDevice::setMTU(185);

  NimBLEServer* server = NimBLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());

  NimBLEService* svc = server->createService(SERVICE_UUID);

  NimBLECharacteristic* cmdChar = svc->createCharacteristic(
    CMD_UUID,
    NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR
  );
  cmdChar->setCallbacks(new CmdCallbacks());

  gDataChar = svc->createCharacteristic(
    DATA_UUID,
    NIMBLE_PROPERTY::NOTIFY
  );

  svc->start();

  NimBLEAdvertising* adv = NimBLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID);
  adv->start();

  Serial.println("BLE advertising started");
}

// --------------------
// Arduino
// --------------------
void setup() {
  Serial.begin(115200);
  delay(300);

  setup_camera();
  setup_ble();

  Serial.println("Write 'CAP' to CMD characteristic to capture.");
}

void loop() {
  if (!gDoCapture) {
    delay(10);
    return;
  }
  gDoCapture = false;

  if (!gDataChar || !gConnected) {
    Serial.println("No BLE client connected; skipping capture");
    return;
  }

  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }

  uint32_t total = fb->len;
  Serial.printf("Captured %lu bytes\n", (unsigned long)total);

  // Send header
  send_start_header(total, gChunkSize);
  delay(10);

  // Send JPEG bytes in chunks
  uint32_t offset = 0;
  while (offset < total) {
    uint32_t n = total - offset;
    if (n > gChunkSize) n = gChunkSize;

    gDataChar->setValue((uint8_t*)fb->buf + offset, n);
    gDataChar->notify();

    offset += n;

    // pacing helps avoid overruns/disconnects
    delay(3);
  }

  esp_camera_fb_return(fb);
  Serial.println("Frame sent");
}
