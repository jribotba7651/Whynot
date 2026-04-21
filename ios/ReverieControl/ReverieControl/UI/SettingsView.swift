import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var ble: BLEManager
    @AppStorage("bridgeURL") private var bridgeURL: String = ""
    @AppStorage("bridgeToken") private var bridgeToken: String = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Bluetooth") {
                    StatusBanner()
                    Button("Buscar cama") { ble.startScan() }
                    Button("Desconectar", role: .destructive) { ble.disconnect() }

                    if !ble.discoveredPeripherals.isEmpty {
                        ForEach(ble.discoveredPeripherals, id: \.identifier) { p in
                            Button(p.name ?? p.identifier.uuidString) { ble.connect(p) }
                        }
                    }
                }

                Section("Bridge ESP32 (opcional)") {
                    TextField("URL (ej: http://192.168.1.50:8080)", text: $bridgeURL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    SecureField("Token", text: $bridgeToken)
                    Text("Si configuras el bridge, los horarios se sincronizan con él para fiabilidad 24/7. El control manual sigue siendo BLE directo.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Section("Acerca de") {
                    LabeledContent("Versión", value: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "")
                    Link("Protocolo Reverie (smartbed-mqtt)", destination: URL(string: "https://github.com/richardhopton/smartbed-mqtt")!)
                }
            }
            .navigationTitle("Ajustes")
        }
    }
}
