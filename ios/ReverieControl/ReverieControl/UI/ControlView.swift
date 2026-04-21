import SwiftUI

struct ControlView: View {
    @EnvironmentObject var ble: BLEManager
    @EnvironmentObject var bed: BedController

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    StatusBanner()

                    presetGrid
                    motorSection(title: "Cabeza", up: { bed.startHoldHead(up: true) }, down: { bed.startHoldHead(up: false) })
                    motorSection(title: "Pies", up: { bed.startHoldFeet(up: true) }, down: { bed.startHoldFeet(up: false) })
                    memorySection
                    Button { bed.toggleLight() } label: {
                        Label("Luz debajo de la cama", systemImage: "lightbulb")
                            .frame(maxWidth: .infinity).padding()
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
            }
            .navigationTitle("Reverie")
        }
    }

    private var presetGrid: some View {
        let columns = [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())]
        return LazyVGrid(columns: columns, spacing: 12) {
            presetButton("Flat", systemImage: "bed.double") { bed.flat() }
            presetButton("Zero-G", systemImage: "moon.stars") { bed.zeroG() }
            presetButton("Anti-Snore", systemImage: "wind") { bed.antiSnore() }
        }
    }

    private var memorySection: some View {
        VStack(alignment: .leading) {
            Text("Memorias").font(.headline)
            HStack {
                ForEach(1...4, id: \.self) { n in
                    Button("M\(n)") { bed.recall(n) }
                        .buttonStyle(.bordered)
                        .frame(maxWidth: .infinity)
                        .contextMenu {
                            Button("Programar memoria \(n)") { bed.program(n) }
                        }
                }
            }
        }
    }

    private func presetButton(_ title: String, systemImage: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack {
                Image(systemName: systemImage).font(.title2)
                Text(title).font(.caption)
            }
            .frame(maxWidth: .infinity, minHeight: 64)
        }
        .buttonStyle(.borderedProminent)
    }

    private func motorSection(title: String, up: @escaping () -> Void, down: @escaping () -> Void) -> some View {
        VStack(alignment: .leading) {
            Text(title).font(.headline)
            HStack {
                holdButton(systemImage: "chevron.up", action: up)
                holdButton(systemImage: "chevron.down", action: down)
            }
        }
    }

    private func holdButton(systemImage: String, action: @escaping () -> Void) -> some View {
        Image(systemName: systemImage)
            .font(.title)
            .frame(maxWidth: .infinity, minHeight: 80)
            .background(Color.accentColor.opacity(0.15))
            .foregroundStyle(.tint)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { _ in action() }
                    .onEnded { _ in bed.stopHold() }
            )
    }
}

struct StatusBanner: View {
    @EnvironmentObject var ble: BLEManager

    var body: some View {
        HStack {
            Circle().fill(color).frame(width: 10, height: 10)
            Text(text)
            Spacer()
            if !isConnected { Button("Buscar") { ble.startScan() } }
        }
        .padding(12)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 10))
    }

    private var isConnected: Bool {
        if case .connected = ble.state { return true }
        return false
    }

    private var color: Color {
        switch ble.state {
        case .connected: return .green
        case .scanning, .connecting: return .orange
        default: return .red
        }
    }

    private var text: String {
        switch ble.state {
        case .poweredOff: return "Bluetooth apagado"
        case .unauthorized: return "Bluetooth no autorizado"
        case .unsupported: return "Bluetooth no soportado"
        case .ready: return "Listo"
        case .scanning: return "Buscando cama..."
        case .connecting(let n): return "Conectando a \(n)..."
        case .connected(let n): return "Conectado: \(n)"
        case .disconnected: return "Desconectado"
        }
    }
}
