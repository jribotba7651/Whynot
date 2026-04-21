import Foundation

actor BridgeClient {
    static let shared = BridgeClient()

    struct RemoteSchedule: Codable {
        let id: String
        let name: String
        let hour: Int
        let minute: Int
        let daysOfWeekMask: Int
        let command: ReverieCommand
        let enabled: Bool
    }

    private var baseURL: URL? {
        guard let s = UserDefaults.standard.string(forKey: "bridgeURL"),
              !s.isEmpty, let u = URL(string: s) else { return nil }
        return u
    }
    private var token: String? { UserDefaults.standard.string(forKey: "bridgeToken") }

    var isConfigured: Bool { baseURL != nil }

    func sync(schedules: [RemoteSchedule]) async throws {
        guard let baseURL else { return }
        let url = baseURL.appendingPathComponent("schedules")
        var req = URLRequest(url: url)
        req.httpMethod = "PUT"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        req.httpBody = try JSONEncoder().encode(["schedules": schedules])
        let (_, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw NSError(domain: "Bridge", code: -1)
        }
    }

    func sendCommand(_ command: ReverieCommand) async throws {
        guard let baseURL else { return }
        let url = baseURL.appendingPathComponent("command")
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        req.httpBody = try JSONEncoder().encode(["command": command])
        _ = try await URLSession.shared.data(for: req)
    }
}
