import SwiftUI
import SwiftData

struct ScheduleEditView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context

    let entry: ScheduleEntry?

    @State private var name: String = ""
    @State private var time: Date = .now
    @State private var commandKind: CommandKind = .zeroG
    @State private var commandValue: Int = 1
    @State private var daysMask: Int = WeekdayMask.all
    @State private var enabled: Bool = true

    enum CommandKind: String, CaseIterable, Identifiable {
        case flat, zeroG, antiSnore, recallMemory
        case headMove, feetMove, motorStop
        case underBedLightToggle
        var id: String { rawValue }

        var displayName: String {
            switch self {
            case .flat: return "Flat"
            case .zeroG: return "Zero-G"
            case .antiSnore: return "Anti-Snore"
            case .recallMemory: return "Memoria N"
            case .headMove: return "Cabeza → posición"
            case .feetMove: return "Pies → posición"
            case .motorStop: return "Stop motores"
            case .underBedLightToggle: return "Luz toggle"
            }
        }

        var needsValue: Bool {
            switch self {
            case .recallMemory, .headMove, .feetMove: return true
            default: return false
            }
        }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Nombre") {
                    TextField("Ej: Acostarse", text: $name)
                }
                Section("Hora") {
                    DatePicker("Hora", selection: $time, displayedComponents: .hourAndMinute)
                }
                Section("Comando") {
                    Picker("Acción", selection: $commandKind) {
                        ForEach(CommandKind.allCases) { Text($0.displayName).tag($0) }
                    }
                    if commandKind.needsValue {
                        Stepper("Valor: \(commandValue)", value: $commandValue, in: 1...100)
                    }
                }
                Section("Días") {
                    DaysSelector(mask: $daysMask)
                }
                Section {
                    Toggle("Activado", isOn: $enabled)
                }
                if let entry {
                    Section {
                        Button("Borrar", role: .destructive) {
                            context.delete(entry); try? context.save(); dismiss()
                        }
                    }
                }
            }
            .navigationTitle(entry == nil ? "Nuevo horario" : "Editar")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Guardar", action: save).disabled(name.isEmpty)
                }
            }
            .onAppear(perform: load)
        }
    }

    private func load() {
        guard let entry else {
            name = ""
            return
        }
        name = entry.name
        var comps = DateComponents()
        comps.hour = entry.hour
        comps.minute = entry.minute
        time = Calendar.current.date(from: comps) ?? .now
        daysMask = entry.daysOfWeekMask
        enabled = entry.enabled
        switch entry.command {
        case .flat: commandKind = .flat
        case .zeroG: commandKind = .zeroG
        case .antiSnore: commandKind = .antiSnore
        case .recallMemory(let n): commandKind = .recallMemory; commandValue = n
        case .headMove(let p): commandKind = .headMove; commandValue = Int(p)
        case .feetMove(let p): commandKind = .feetMove; commandValue = Int(p)
        case .motorStop: commandKind = .motorStop
        case .underBedLightToggle: commandKind = .underBedLightToggle
        default: break
        }
    }

    private func save() {
        let cal = Calendar.current
        let h = cal.component(.hour, from: time)
        let m = cal.component(.minute, from: time)
        let cmd: ReverieCommand = {
            switch commandKind {
            case .flat: return .flat
            case .zeroG: return .zeroG
            case .antiSnore: return .antiSnore
            case .recallMemory: return .recallMemory(commandValue)
            case .headMove: return .headMove(position: UInt8(min(commandValue, 100)))
            case .feetMove: return .feetMove(position: UInt8(min(commandValue, 100)))
            case .motorStop: return .motorStop
            case .underBedLightToggle: return .underBedLightToggle
            }
        }()

        if let entry {
            entry.name = name
            entry.hour = h
            entry.minute = m
            entry.daysOfWeekMask = daysMask
            entry.enabled = enabled
            entry.command = cmd
        } else {
            let new = ScheduleEntry(name: name, hour: h, minute: m, daysOfWeekMask: daysMask, command: cmd, enabled: enabled)
            context.insert(new)
        }
        try? context.save()
        ScheduleRunner.shared.scheduleNextBackgroundRefresh()
        dismiss()
    }
}

private struct DaysSelector: View {
    @Binding var mask: Int
    var body: some View {
        HStack {
            ForEach(1...7, id: \.self) { day in
                let bit = 1 << (day - 1)
                let on = (mask & bit) != 0
                Button(WeekdayMask.name(day)) {
                    mask = on ? mask & ~bit : mask | bit
                }
                .buttonStyle(.bordered)
                .tint(on ? .accentColor : .secondary)
                .frame(maxWidth: .infinity)
            }
        }
        HStack {
            Button("Todos") { mask = WeekdayMask.all }.buttonStyle(.bordered)
            Button("Lun-Vie") { mask = WeekdayMask.weekdays }.buttonStyle(.bordered)
            Button("Fin de semana") { mask = WeekdayMask.weekends }.buttonStyle(.bordered)
        }
    }
}
