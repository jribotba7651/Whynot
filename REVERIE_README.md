# Reverie Bed Control — App iOS + Bridge

Sistema completo para controlar una cama Reverie ajustable desde iPhone con horarios programados nocturnos.

> Este sistema vive junto al proyecto WhyNot existente (`client/`, `server/`) sin tocarlo. Usa la rama `claude/smartbed-ios-app-mjTtg`.

## Componentes

```
ios/ReverieControl/    App SwiftUI nativa (control manual + horarios)
bridge/                Servicio Node.js always-on (ejecuta horarios 24/7)
esp32/                 Config ESPHome para ESP32 BLE proxy
```

## Arquitectura

```
┌──────────────┐  Bluetooth LE   ┌──────────────────┐
│   iPhone     │ ───────────────▶│  Cama Reverie    │
│ ReverieCtrl  │   (en casa)     └──────────────────┘
└──────┬───────┘                          ▲
       │ HTTP (PUT /schedules)            │ BLE
       ▼                                  │
┌──────────────┐    ESPHome API   ┌──────────────────┐
│ Bridge Node  │ ────────────────▶│  ESP32 proxy     │
│ (Pi/NAS/Mac) │                  └──────────────────┘
└──────────────┘
```

- **Sin bridge**: la app controla directamente la cama por BLE. Horarios best-effort (depende de iOS).
- **Con bridge**: la app sincroniza los horarios con el bridge, que dispara los comandos a la hora exacta vía ESP32, aunque tu iPhone esté apagado.

## Setup rápido (solo iOS)

```bash
brew install xcodegen
cd ios/ReverieControl
xcodegen generate
open ReverieControl.xcodeproj
```

Run en tu iPhone (⌘R). Ver `ios/ReverieControl/README.md` para detalles.

## Setup completo (con bridge para fiabilidad 24/7)

1. **ESP32**: ver `esp32/README.md`. Flashea con ESPHome, anota la IP y la MAC de la cama.
2. **Bridge**: ver `bridge/README.md`. Corre en Raspberry Pi/Mac mini/Synology con `systemd` o `pm2`.
3. **iOS**: en la pestaña Ajustes, llena URL del bridge y token. Los horarios se sincronizan automáticamente.

## Protocolo Reverie (resumen)

| Concepto | Valor |
|---|---|
| BLE Service UUID | `1b1d9641-b942-4da8-89cc-98e6a58fbd93` |
| Write Characteristic | `6af87926-dc79-412e-a3e0-5f85c2d55de2` |
| Frame format | `[0x55, ...payload, XOR_checksum]` |
| Checksum | `payload.reduce((acc,b) => acc^b, 0x55)` |

Comandos:

| Byte(s) | Acción |
|---|---|
| `0x05` | Flat |
| `0x15` | Zero-G |
| `0x16` | Anti-Snore |
| `0x11..0x14` | Recall memorias 1-4 |
| `0x21..0x24` | Programar memorias 1-4 |
| `0x51 P` | Mover cabeza a posición P (0-100) |
| `0x52 P` | Mover pies a posición P |
| `0xff` | Parar motores |
| `0x53 L` | Masaje cabeza nivel L (0-10) |
| `0x54 L` | Masaje pies nivel L |
| `0x40 L` | Patrón Wave nivel L (1-4) |
| `0x5b 0x00` | Toggle luz inferior |

Crédito: extraído de [richardhopton/smartbed-mqtt](https://github.com/richardhopton/smartbed-mqtt).
