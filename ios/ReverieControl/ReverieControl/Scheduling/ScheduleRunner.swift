import Foundation
import BackgroundTasks
import UserNotifications
import SwiftData
import os

@MainActor
final class ScheduleRunner {
    nonisolated(unsafe) static let shared = ScheduleRunner()

    private let log = Logger(subsystem: "com.reverie.ReverieControl", category: "Schedule")
    private let taskIdentifier = "com.reverie.ReverieControl.schedule"
    private var modelContainer: ModelContainer?

    private init() {}

    func attach(container: ModelContainer) { self.modelContainer = container }

    nonisolated func registerBackgroundTask() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: taskIdentifier, using: nil) { task in
            guard let task = task as? BGAppRefreshTask else { return }
            Task { @MainActor in
                Self.shared.handleBackgroundTask(task)
            }
        }
    }

    func scheduleNextBackgroundRefresh() {
        let nextDate = nextScheduleDate() ?? Date().addingTimeInterval(15 * 60)
        let request = BGAppRefreshTaskRequest(identifier: taskIdentifier)
        request.earliestBeginDate = nextDate.addingTimeInterval(-60)
        do {
            try BGTaskScheduler.shared.submit(request)
            log.debug("BGAppRefresh scheduled for \(nextDate)")
        } catch {
            log.error("Failed to submit BGAppRefresh: \(error.localizedDescription)")
        }

        scheduleLocalNotificationsFallback()
    }

    private func handleBackgroundTask(_ task: BGAppRefreshTask) {
        scheduleNextBackgroundRefresh()
        let runTask = Task { @MainActor in
            await runDueSchedules()
            task.setTaskCompleted(success: !Task.isCancelled)
        }
        task.expirationHandler = { runTask.cancel() }
    }

    func runDueSchedules() async {
        guard let container = modelContainer else { return }
        let context = ModelContext(container)
        let descriptor = FetchDescriptor<ScheduleEntry>(predicate: #Predicate { $0.enabled })
        guard let all = try? context.fetch(descriptor) else { return }

        let now = Date()
        let cal = Calendar.current
        let weekday = cal.component(.weekday, from: now)
        let nowMinutes = cal.component(.hour, from: now) * 60 + cal.component(.minute, from: now)

        for entry in all where entry.runsOn(weekday: weekday) {
            let entryMinutes = entry.hour * 60 + entry.minute
            let delta = nowMinutes - entryMinutes
            guard delta >= 0, delta <= 5 else { continue }

            if let last = entry.lastRunAt, cal.isDate(last, inSameDayAs: now), cal.component(.minute, from: last) == entry.minute {
                continue
            }

            do {
                try await BLEManager.shared.sendAndWait(entry.command, timeout: 8)
                entry.lastRunAt = now
                try? context.save()
                log.info("Ran \(entry.name) command=\(entry.command.displayName)")
            } catch {
                log.error("Failed to run \(entry.name): \(error.localizedDescription)")
            }
        }
    }

    private func nextScheduleDate() -> Date? {
        guard let container = modelContainer else { return nil }
        let context = ModelContext(container)
        let descriptor = FetchDescriptor<ScheduleEntry>(predicate: #Predicate { $0.enabled })
        guard let all = try? context.fetch(descriptor) else { return nil }
        return all.compactMap { $0.nextFireDate() }.min()
    }

    private func scheduleLocalNotificationsFallback() {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ["reverie.next"])
        guard let next = nextScheduleDate() else { return }

        let content = UNMutableNotificationContent()
        content.title = "Reverie"
        content.body = "Aplicando ajuste programado…"
        content.sound = nil

        let comps = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: next)
        let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: false)
        let request = UNNotificationRequest(identifier: "reverie.next", content: content, trigger: trigger)
        center.add(request, withCompletionHandler: nil)
    }
}
