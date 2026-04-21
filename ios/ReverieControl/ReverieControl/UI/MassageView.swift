import SwiftUI

struct MassageView: View {
    @EnvironmentObject var bed: BedController

    var body: some View {
        NavigationStack {
            Form {
                Section("Cabeza") {
                    sliderRow(value: Binding(
                        get: { Double(bed.headMassageLevel) },
                        set: { bed.setHeadMassage(UInt8($0)) }
                    ), max: 10)
                }
                Section("Pies") {
                    sliderRow(value: Binding(
                        get: { Double(bed.feetMassageLevel) },
                        set: { bed.setFeetMassage(UInt8($0)) }
                    ), max: 10)
                }
                Section("Patrón Wave") {
                    Picker("Nivel", selection: Binding(
                        get: { Int(bed.waveLevel) },
                        set: { bed.setWave(UInt8($0)) }
                    )) {
                        ForEach(1...4, id: \.self) { Text("Wave \($0)").tag($0) }
                    }
                    .pickerStyle(.segmented)
                }
                Section {
                    Button("Apagar todo masaje", role: .destructive) {
                        bed.setHeadMassage(0)
                        bed.setFeetMassage(0)
                    }
                }
            }
            .navigationTitle("Masaje")
        }
    }

    private func sliderRow(value: Binding<Double>, max: Double) -> some View {
        HStack {
            Slider(value: value, in: 0...max, step: 1)
            Text("\(Int(value.wrappedValue))").monospacedDigit().frame(width: 32)
        }
    }
}
