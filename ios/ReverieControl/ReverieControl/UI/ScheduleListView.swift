import SwiftUI
import SwiftData

struct ScheduleListView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: [SortDescriptor(\ScheduleEntry.hour), SortDescriptor(\ScheduleEntry.minute)])
    private var entries: [ScheduleEntry]

    @State private var editingEntry: ScheduleEntry?
    @State private var showingNew = false

    var body: some View {
        NavigationStack {
            List {
                if entries.isEmpty {
                    ContentUnavailableView("Sin horarios",
                                          systemImage: "clock",
                                          description: Text("Toca + para añadir un ajuste programado para esta noche."))
                }
                ForEach(entries) { entry in
                    Button {
                        editingEntry = entry
                    } label: {
                        ScheduleRow(entry: entry)
                    }
                    .buttonStyle(.plain)
                    .swipeActions {
                        Button(role: .destructive) {
                            context.delete(entry)
                            try? context.save()
                            ScheduleRunner.shared.scheduleNextBackgroundRefresh()
                        } label: { Label("Borrar", systemImage: "trash") }

                        Button {
                            entry.enabled.toggle()
                            try? context.save()
                            ScheduleRunner.shared.scheduleNextBackgroundRefresh()
                        } label: {
                            Label(entry.enabled ? "Pausar" : "Activar",
                                  systemImage: entry.enabled ? "pause" : "play")
                        }
                        .tint(.orange)
                    }
                }
            }
            .navigationTitle("Horarios")
            .toolbar {
                Button { showingNew = true } label: { Image(systemName: "plus") }
            }
            .sheet(isPresented: $showingNew) {
                ScheduleEditView(entry: nil)
            }
            .sheet(item: $editingEntry) { entry in
                ScheduleEditView(entry: entry)
            }
            .onAppear {
                ScheduleRunner.shared.attach(container: context.container)
                ScheduleRunner.shared.scheduleNextBackgroundRefresh()
            }
        }
    }
}

private struct ScheduleRow: View {
    let entry: ScheduleEntry

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(timeString).font(.title2.monospacedDigit().bold())
                    Text(entry.name).foregroundStyle(.secondary)
                }
                Text(entry.command.displayName).font(.caption).foregroundStyle(.secondary)
                Text(daysString).font(.caption2).foregroundStyle(.tertiary)
            }
            Spacer()
            if !entry.enabled { Image(systemName: "pause.circle").foregroundStyle(.orange) }
        }
        .padding(.vertical, 4)
    }

    private var timeString: String {
        String(format: "%02d:%02d", entry.hour, entry.minute)
    }

    private var daysString: String {
        if entry.daysOfWeekMask == WeekdayMask.all { return "Todos los días" }
        if entry.daysOfWeekMask == WeekdayMask.weekdays { return "Lun-Vie" }
        if entry.daysOfWeekMask == WeekdayMask.weekends { return "Fin de semana" }
        return (1...7).filter { entry.runsOn(weekday: $0) }.map { WeekdayMask.name($0) }.joined(separator: " ")
    }
}
