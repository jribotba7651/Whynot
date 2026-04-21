# Reverie Control (iOS)

App nativa SwiftUI + CoreBluetooth para controlar una cama Reverie ajustable y programar ajustes nocturnos.

## Funciones

- Control manual: hold-to-move de cabeza y pies, parar.
- Presets: Flat, Zero-G, Anti-Snore.
- Memorias 1-4 (recall y programar).
- Masaje cabeza/pies (0-10) y patrón Wave (1-4).
- Toggle de luz debajo de la cama.
- Horarios programados con días de la semana.
- Bridge ESP32 opcional para fiabilidad 24/7.

## Compilar

Necesitas macOS con Xcode 15+ (iOS 17 SDK).

### Opción A — XcodeGen (recomendado)

```bash
brew install xcodegen
cd ios/ReverieControl
xcodegen generate
open ReverieControl.xcodeproj
```

XcodeGen lee `project.yml` y genera `ReverieControl.xcodeproj` desde cero. Si añades archivos nuevos, vuelve a correr `xcodegen`.

### Opción B — Crear proyecto manualmente en Xcode

1. Xcode → File → New → Project → iOS → App.
2. Product Name: `ReverieControl` · Interface: SwiftUI · Language: Swift · Storage: SwiftData.
3. Borra los archivos `ContentView.swift` y el `*App.swift` que generó.
4. Arrastra el contenido de `ReverieControl/` (App, Bluetooth, Scheduling, Bridge, UI) al proyecto, marcando "Copy items if needed".
5. Reemplaza `Info.plist` por el de este folder.
6. Signing & Capabilities → añade tu Apple ID, marca "Automatically manage signing", y añade la capability **Background Modes** con: Uses Bluetooth LE accessories, Background fetch, Background processing.
7. En Background Modes → Permitted background task scheduler identifiers añade `com.reverie.ReverieControl.schedule` (ya está en `Info.plist`).

## Correr en tu iPhone

1. Conecta el iPhone por USB.
2. Selecciónalo como destino en Xcode.
3. Run (⌘R). La primera vez tendrás que aprobar el certificado de desarrollador en *Ajustes → General → VPN y administración de dispositivos*.
4. Acepta el permiso de Bluetooth.
5. Toca **Buscar** en la pestaña Control. La app se conectará automáticamente al primer dispositivo que anuncie el service UUID Reverie.

> **Apple ID gratis:** la app funciona sideloaded por 7 días. Para uso permanente necesitas una cuenta Apple Developer ($99/año) o reinstalar cada semana desde Xcode.

## Probar el protocolo sin cama

`ReverieProtocol.buildCommand([0x15])` debe producir `0x55 0x15 0x40` (XOR de `0x55^0x15`). Si quieres tests unitarios, agrega un target `ReverieControlTests` en Xcode y crea un test:

```swift
func testBuildCommandZeroG() {
    XCTAssertEqual(ReverieProtocol.buildCommand([0x15]), Data([0x55, 0x15, 0x40]))
}
```

## Fiabilidad de horarios

iOS no garantiza ejecución de background BLE durante toda la noche. La app usa `BGAppRefreshTask` + notificación local silenciosa como respaldo, lo cual funciona razonablemente bien con el iPhone cargando y la app no terminada por el sistema. Para fiabilidad 100 % configura el bridge ESP32 (`../bridge/`) — la app sincronizará los horarios con él automáticamente cuando llenes la URL en Ajustes.

## Estructura

```
ReverieControl/
├── App/                     ReverieControlApp.swift, AppDelegate
├── Bluetooth/
│   ├── ReverieProtocol.swift  UUIDs, comandos, XOR
│   ├── BLEManager.swift       CoreBluetooth scan/connect/write
│   └── BedController.swift    API alta nivel
├── Scheduling/
│   ├── Schedule.swift         @Model SwiftData
│   └── ScheduleRunner.swift   BGTaskScheduler + UNUserNotificationCenter
├── Bridge/
│   └── BridgeClient.swift     HTTP cliente al bridge opcional
├── UI/                        SwiftUI views (Tab, Control, Massage, Schedule, Settings)
├── Info.plist
└── ReverieControl.entitlements
```

## Crédito

El protocolo BLE proviene de la ingeniería inversa hecha por [richardhopton/smartbed-mqtt](https://github.com/richardhopton/smartbed-mqtt) — concretamente `src/Reverie/simple/Commands.ts` y `controllerBuilder.ts`. Esta app porta esas constantes a Swift sin depender de Home Assistant.
