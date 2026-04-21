import Foundation
import SwiftData

@Model
final class ScheduleEntry {
    @Attribute(.unique) var id: UUID
    var name: String
    var hour: Int
    var minute: Int
    var daysOfWeekMask: Int
    var commandData: Data
    var enabled: Bool
    var lastRunAt: Date?

    init(id: UUID = UUID(),
         name: String,
         hour: Int,
         minute: Int,
         daysOfWeekMask: Int = 0b1111111,
         command: ReverieCommand,
         enabled: Bool = true) {
        self.id = id
        self.name = name
        self.hour = hour
        self.minute = minute
        self.daysOfWeekMask = daysOfWeekMask
        self.commandData = (try? JSONEncoder().encode(command)) ?? Data()
        self.enabled = enabled
    }

    var command: ReverieCommand {
        get { (try? JSONDecoder().decode(ReverieCommand.self, from: commandData)) ?? .flat }
        set { commandData = (try? JSONEncoder().encode(newValue)) ?? Data() }
    }

    var time: DateComponents {
        var dc = DateComponents()
        dc.hour = hour
        dc.minute = minute
        return dc
    }

    func runsOn(weekday: Int) -> Bool {
        (daysOfWeekMask & (1 << (weekday - 1))) != 0
    }

    func nextFireDate(from now: Date = .now, calendar: Calendar = .current) -> Date? {
        for offset in 0...7 {
            guard let day = calendar.date(byAdding: .day, value: offset, to: now) else { continue }
            var comps = calendar.dateComponents([.year, .month, .day], from: day)
            comps.hour = hour
            comps.minute = minute
            comps.second = 0
            guard let candidate = calendar.date(from: comps) else { continue }
            let weekday = calendar.component(.weekday, from: candidate)
            if runsOn(weekday: weekday) && candidate > now { return candidate }
        }
        return nil
    }
}

enum WeekdayMask {
    static let all = 0b1111111
    static let weekdays = 0b0111110
    static let weekends = 0b1000001

    static func name(_ weekday: Int) -> String {
        ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][weekday - 1]
    }
}
