# Reverie Bridge

Servicio Node.js "always-on" que ejecuta los horarios programados para tu cama Reverie 24/7, independientemente de si tu iPhone está apagado o lejos. Habla con un ESP32 corriendo ESPHome `bluetooth_proxy` (ver `../esp32/`) que actúa como puente BLE permanente cerca de la cama.

## Cuándo usarlo

- Si quieres que los horarios se cumplan al 100 % aunque iOS suspenda la app.
- Si tienes un Raspberry Pi, Mac mini, Synology, o cualquier máquina siempre encendida en tu LAN.

Si te conformas con scheduling best-effort desde la app iOS, **no necesitas el bridge**.

## Instalación

```bash
cd bridge
npm install
cp .env.example .env
# Edita .env con la IP del ESP32 y la MAC de tu cama
npm run build
npm start
```

## Encontrar la MAC de tu cama

1. Conéctate desde la app iOS (te muestra el peripheral en Ajustes).
2. O usa la UI web de ESPHome (`http://<ip-esp32>`) → Bluetooth Proxy → mira los advertisements.

## Endpoints

| Método | Path | Descripción |
|---|---|---|
| GET | `/health` | liveness |
| GET | `/schedules` | lista de horarios |
| PUT | `/schedules` | reemplaza todos los horarios (usado por la app iOS al sincronizar) |
| POST | `/schedules` | upsert un horario |
| DELETE | `/schedules/:id` | borra un horario |
| POST | `/command` | dispara un comando inmediato (control remoto desde fuera de casa) |

Todos los endpoints requieren `Authorization: Bearer <API_TOKEN>` si lo configuraste.

## Correr como servicio

### systemd (Raspberry Pi)

`/etc/systemd/system/reverie-bridge.service`:

```ini
[Unit]
Description=Reverie Bridge
After=network-online.target

[Service]
Type=simple
WorkingDirectory=/opt/reverie-bridge
ExecStart=/usr/bin/node /opt/reverie-bridge/dist/index.js
Restart=always
EnvironmentFile=/opt/reverie-bridge/.env
User=pi

[Install]
WantedBy=multi-user.target
```

### pm2

```bash
pm2 start dist/index.js --name reverie-bridge
pm2 save && pm2 startup
```
