import Foundation
import Combine

@MainActor
final class BedController: ObservableObject {
    nonisolated(unsafe) static let shared = BedController()

    private let ble: BLEManager
    private var holdTask: Task<Void, Never>?

    @Published var headMassageLevel: UInt8 = 0
    @Published var feetMassageLevel: UInt8 = 0
    @Published var waveLevel: UInt8 = 1

    init(ble: BLEManager = .shared) { self.ble = ble }

    func send(_ command: ReverieCommand) { ble.send(command) }

    func flat() { send(.flat) }
    func zeroG() { send(.zeroG) }
    func antiSnore() { send(.antiSnore) }
    func recall(_ n: Int) { send(.recallMemory(n)) }
    func program(_ n: Int) { send(.programMemory(n)) }
    func toggleLight() { send(.underBedLightToggle) }

    func startHoldHead(up: Bool) { startHold(direction: up ? .headUp : .headDown) }
    func startHoldFeet(up: Bool) { startHold(direction: up ? .feetUp : .feetDown) }

    func stopHold() {
        holdTask?.cancel()
        holdTask = nil
        send(.motorStop)
    }

    private enum HoldDirection { case headUp, headDown, feetUp, feetDown }

    private func startHold(direction: HoldDirection) {
        holdTask?.cancel()
        holdTask = Task { [weak self] in
            guard let self else { return }
            var pos: UInt8 = direction == .headUp || direction == .feetUp ? 100 : 0
            while !Task.isCancelled {
                switch direction {
                case .headUp, .headDown: self.send(.headMove(position: pos))
                case .feetUp, .feetDown: self.send(.feetMove(position: pos))
                }
                try? await Task.sleep(nanoseconds: 100_000_000)
                pos = direction == .headUp || direction == .feetUp ? min(pos &+ 5, 100) : (pos >= 5 ? pos - 5 : 0)
            }
        }
    }

    func setHeadMassage(_ level: UInt8) {
        headMassageLevel = min(level, 10)
        send(.massageHead(level: headMassageLevel))
    }

    func setFeetMassage(_ level: UInt8) {
        feetMassageLevel = min(level, 10)
        send(.massageFoot(level: feetMassageLevel))
    }

    func setWave(_ level: UInt8) {
        waveLevel = max(1, min(level, 4))
        send(.massageWave(level: waveLevel))
    }
}
