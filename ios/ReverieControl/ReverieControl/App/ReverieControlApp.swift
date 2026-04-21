import SwiftUI
import SwiftData
import UserNotifications

@main
struct ReverieControlApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var ble = BLEManager.shared
    @StateObject private var bed = BedController.shared

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .environmentObject(ble)
                .environmentObject(bed)
        }
        .modelContainer(for: [ScheduleEntry.self])
    }
}

final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
        ScheduleRunner.shared.registerBackgroundTask()
        UNUserNotificationCenter.current().delegate = NotificationDelegate.shared
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
        return true
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        Task { @MainActor in
            BLEManager.shared.reconnectSavedIfNeeded()
        }
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        ScheduleRunner.shared.scheduleNextBackgroundRefresh()
    }
}

final class NotificationDelegate: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationDelegate()
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        Task { @MainActor in
            await ScheduleRunner.shared.runDueSchedules()
        }
        completionHandler([.banner])
    }
}
