# Estado del proyecto — App iOS para cama Reverie

> **Última actualización:** 2026-04-21
> **Rama:** `claude/smartbed-ios-app-mjTtg`
> **Último commit:** `2bf5cdb` — feat: add iOS Reverie bed controller with optional ESP32 bridge

## TL;DR

App iOS nativa (SwiftUI + CoreBluetooth) para controlar tu cama **Reverie 8Q** por Bluetooth, con horarios programados para la noche. Código completo y commiteado, **falta probarlo en hardware real**.

Vive en `ios/`, `bridge/`, `esp32/` junto al proyecto WhyNot existente — sin tocar `client/` ni `server/`.

## Lo que YA está hecho ✅

### App iOS (`ios/ReverieControl/`)
- Proyecto SwiftUI completo, iOS 17+, generable con XcodeGen.
- 4 pestañas: **Control** (presets + hold-to-move + memorias + luz), **Masaje** (sliders 0-10 + Wave 1-4), **Horarios** (CRUD con días de la semana), **Ajustes** (BLE + URL del bridge).
- BLE manager con auto-reconexión, restoración de estado, persistencia del peripheral.
- Scheduler con SwiftData + `BGTaskScheduler` + notificación local de respaldo.
- Cliente HTTP opcional al bridge.

### Bridge Node.js (`bridge/`)
- TypeScript + Fastify + node-cron + cliente ESPHome native API.
- Endpoints REST: `GET/PUT/POST/DELETE /schedules`, `POST /command`.
- Auth con `Bearer token`.
- Pensado para correr con systemd o pm2 en Raspberry Pi/Mac mini/NAS.

### ESP32 (`esp32/`)
- Config ESPHome `bluetooth_proxy` lista para flashear.
- README con pasos completos.

### Protocolo Reverie portado
| Cosa | Valor |
|---|---|
| Service UUID | `1b1d9641-b942-4da8-89cc-98e6a58fbd93` |
| Write characteristic | `6af87926-dc79-412e-a3e0-5f85c2d55de2` |
| Frame | `[0x55, ...payload, XOR(payload, 0x55)]` |
| Flat | `0x05` · Zero-G `0x15` · Anti-Snore `0x16` |
| Memorias | recall `0x11-0x14`, programar `0x21-0x24` |
| Motores | head `0x51 P`, feet `0x52 P`, stop `0xff` |
| Masaje | head `0x53 L`, feet `0x54 L`, wave `0x40 L` |
| Luz | `0x5b 0x00` |

Crédito: [richardhopton/smartbed-mqtt](https://github.com/richardhopton/smartbed-mqtt).

## Próximo paso (cuando vuelvas a la Mac) 🔨

### 1. Generar y abrir el proyecto Xcode

```bash
brew install xcodegen   # si no lo tienes
cd ios/ReverieControl
xcodegen generate
open ReverieControl.xcodeproj
```

### 2. Configurar tu Apple ID en Xcode
- Xcode → Settings → Accounts → "+" → tu Apple ID (gratis sirve para sideload de 7 días).
- Selecciona el target `ReverieControl` → Signing & Capabilities → Team = tu cuenta personal.
- Cambia Bundle Identifier si Apple se queja: ej. `com.tunombre.ReverieControl`.

### 3. Conectar iPhone y correr
- iPhone por USB, confiar en la Mac.
- En Xcode arriba → seleccionar tu iPhone como destino.
- ⌘R.
- En el iPhone: Ajustes → General → VPN y administración de dispositivos → confiar en el certificado.
- Aceptar permiso de Bluetooth la primera vez que abra.

### 4. Probar contra la cama
1. Pestaña **Control** → tocar **Buscar**.
2. Si tu Reverie 8Q tiene controlador BLE aparecerá y se conectará solo (banner verde).
3. Probar botones uno por uno:
   - Empezar por **Flat** (es el más seguro de probar).
   - Luego **Zero-G**, **Anti-Snore**.
   - Hold-to-move de cabeza/pies.
4. **Si NO conecta** → tu 8Q probablemente es de los antiguos solo-RF. Necesitarías un módulo BLE Reverie aparte, o irnos por otra ruta.

### 5. Crear primer horario de prueba
- Pestaña Horarios → "+" → ej. "Test" a 2 minutos en el futuro → Comando: Zero-G → Guardar.
- Bloquear iPhone, esperar 2 minutos, ver si la cama se mueve.

## Cosas pendientes / por validar ⚠️

| Tarea | Por qué |
|---|---|
| **Compilar la app** en Xcode | No pude probarlo desde Linux. Puede haber warnings de Swift 6 strict concurrency o algún typo. |
| **Verificar 8Q tiene BLE** | Algunos 8Q son solo RF. Lo sabremos al primer escaneo. |
| **Validar API ESPHome** | El cliente `@2colors/esphome-native-api` puede tener nombres ligeramente distintos a `connectBluetoothDevice`/`writeBluetoothGATTCharacteristic`. Si el bridge falla al arrancar, ajustamos. |
| **Background BLE real** | Apple es famoso por matar apps. Hay que medir cuántas veces se cumple un horario a las 3 AM. |
| **Comprar ESP32** | Solo si decides ir por la ruta de fiabilidad 100 %. ~$5-8 USD en Amazon. |

## Decisiones que tomamos

1. **Híbrido en 2 capas** (app iOS + bridge ESP32 opcional) en vez de iOS-only o servidor-only — porque iOS no garantiza scheduling nocturno y un bridge ESP32 sí.
2. **SwiftUI + iOS 17+** (no UIKit, no SwiftPM aparte) — moderno y simple.
3. **XcodeGen** para regenerar el `.xcodeproj` desde un yml — más fácil de mantener en git que el `.pbxproj` binario.
4. **No clonamos smartbed-mqtt** — está atado a Home Assistant. Solo portamos las constantes del protocolo.
5. **Bridge en TypeScript/Node** — no Python, para mantener el stack alineado con el monorepo existente (cliente/servidor son JS también).

## Preguntas abiertas para mañana ❓

- ¿Confirmamos que tu 8Q es de los con Bluetooth? (lo sabremos al escanear)
- ¿Compras el ESP32 o probamos primero solo con iOS?
- ¿Cuáles son los horarios típicos que quieres? (ej: 22:00 cabeza arriba, 02:00 plano, 06:30 anti-ronquido). Útil para crear los horarios iniciales como ejemplo.
- ¿Qué tan precisos necesitas los movimientos? Los comandos `0x51 P` mueven la cabeza a "posición P" (0-100), pero el firmware Reverie puede no respetar el valor exacto — habrá que probar.

## Estructura completa de archivos

```
ios/ReverieControl/
├── project.yml                                 ← XcodeGen
├── README.md
└── ReverieControl/
    ├── Info.plist                              ← background modes + BLE permission
    ├── ReverieControl.entitlements
    ├── App/
    │   └── ReverieControlApp.swift             ← entry point + AppDelegate
    ├── Bluetooth/
    │   ├── ReverieProtocol.swift               ← UUIDs + buildCommand + ReverieCommand enum
    │   ├── BLEManager.swift                    ← CoreBluetooth scan/connect/write
    │   └── BedController.swift                 ← API alta nivel (flat, zeroG, hold...)
    ├── Scheduling/
    │   ├── Schedule.swift                      ← @Model SwiftData
    │   └── ScheduleRunner.swift                ← BGTaskScheduler + notificaciones
    ├── Bridge/
    │   └── BridgeClient.swift                  ← HTTP cliente al bridge opcional
    └── UI/
        ├── RootTabView.swift
        ├── ControlView.swift                   ← presets, hold-to-move, memorias, luz
        ├── MassageView.swift
        ├── ScheduleListView.swift
        ├── ScheduleEditView.swift
        └── SettingsView.swift                  ← BLE + bridge config

bridge/
├── package.json
├── tsconfig.json
├── .env.example
├── README.md
└── src/
    ├── index.ts                                ← bootstrap
    ├── reverie.ts                              ← port del protocolo
    ├── esphome.ts                              ← cliente ESPHome native API
    ├── store.ts                                ← persistencia JSON
    ├── scheduler.ts                            ← node-cron
    └── api.ts                                  ← Fastify REST

esp32/
├── reverie-proxy.yaml                          ← config ESPHome
├── secrets.example.yaml
└── README.md

REVERIE_README.md                               ← overview top-level
STATUS.md                                       ← este archivo
```

## Comandos útiles para retomar

```bash
# Ver dónde estamos
git log --oneline -5
git diff cb18a61..HEAD --stat

# Ver el plan original
cat REVERIE_README.md

# Empezar a desarrollar (en Mac)
cd ios/ReverieControl && xcodegen generate && open ReverieControl.xcodeproj

# Probar el bridge sin ESP32 (mock)
cd bridge && npm install && npm run dev
```

---

*Cuando vuelvas pásame un screenshot de Xcode si algo no compila, o el output del log de Bluetooth si la cama no aparece. Buena noche.*
