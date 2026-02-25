#include "esp_camera.h"
#include <WiFi.h>
#include <WebServer.h>

// --------------------
// WiFi credentials
// --------------------
const char* WIFI_SSID = "";
const char* WIFI_PASS = "";

// --------------------
// Camera model: AI Thinker ESP32-CAM
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

WebServer server(80);

static void handle_root() {
  server.send(200, "text/plain",
              "ESP32-CAM is running.\n"
              "GET /capture for a JPEG.\n"
              "GET / for this message.\n");
}

static void handle_capture() {
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    server.send(503, "text/plain", "Camera capture failed");
    return;
  }

  server.sendHeader("Content-Type", "image/jpeg");
  server.sendHeader("Content-Disposition", "inline; filename=capture.jpg");
  server.sendHeader("Access-Control-Allow-Origin", "*"); // handy for testing
  server.send_P(200, "image/jpeg", (const char*)fb->buf, fb->len);

  esp_camera_fb_return(fb);
}

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

  // Frame settings: start conservative for stability
  // You can try FRAMESIZE_VGA / SVGA later.
  config.frame_size   = FRAMESIZE_VGA;   // 640x480
  config.jpeg_quality = 10;              // lower number = higher quality
  config.fb_count     = 2;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed: 0x%x\n", err);
    while (true) delay(1000);
  }
  sensor_t * s = esp_camera_sensor_get();

  s->set_brightness(s, 0);     // -2 to 2
  s->set_contrast(s, 1);       // improves colors
  s->set_saturation(s, 2);     // makes colors stronger
  s->set_sharpness(s, 1);      
  s->set_denoise(s, 1);

  s->set_whitebal(s, 1);
  s->set_awb_gain(s, 1);
  s->set_wb_mode(s, 0);        // 0 = auto

  s->set_exposure_ctrl(s, 1);
  s->set_aec2(s, 1);
  s->set_ae_level(s, 0);
  s->set_gain_ctrl(s, 1);
  s->set_wb_mode(s, 4);
}

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(false);
  delay(300);

  setup_camera();

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Connected! ESP32-CAM IP: ");
  Serial.println(WiFi.localIP());

  server.on("/", HTTP_GET, handle_root);
  server.on("/capture", HTTP_GET, handle_capture);
  server.begin();

  Serial.println("HTTP server started.");
  Serial.println("Try in browser: http://<ESP_IP>/capture");
}

void loop() {
  server.handleClient();
}