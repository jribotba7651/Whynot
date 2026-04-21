# ESP32 Reverie BLE Proxy

Configuración ESPHome para convertir un ESP32 (~$5 USD) en un puente Bluetooth permanente al lado de la cama. El servicio `bridge/` se conecta a este ESP32 sobre WiFi (API nativa de ESPHome) y le pide enviar comandos BLE a la cama Reverie.

## Pasos

1. **Compra un ESP32** cualquiera (ESP32-DevKitC, ESP32-WROOM-32, M5StampS3, etc.).
2. **Instala ESPHome**:
   ```bash
   pip install esphome
   ```
3. **Copia los secrets**:
   ```bash
   cp secrets.example.yaml secrets.yaml
   # Edita secrets.yaml con tu wifi y genera una API key:
   openssl rand -base64 32
   ```
4. **Flashea**:
   ```bash
   esphome run reverie-proxy.yaml
   ```
   La primera vez por USB; después se actualiza por WiFi (OTA).
5. **Encuentra la IP** del ESP32 en tu router (o `mDNS`: `reverie-proxy.local`) y la MAC de la cama mirando el log:
   ```bash
   esphome logs reverie-proxy.yaml
   ```
   Busca advertisements con el service UUID `1b1d9641-b942-4da8-89cc-98e6a58fbd93`.
6. **Configura el bridge** (`bridge/.env`) con la IP del ESP32, la API encryption key, y la MAC de la cama.

## Notas

- Mantén el ESP32 a menos de 3-5 m de la cama. Si la cama queda lejos del WiFi, usa un ESP32 con antena externa.
- El proxy también funciona simultáneamente con Home Assistant si lo tienes — ESPHome lo soporta out-of-the-box.
