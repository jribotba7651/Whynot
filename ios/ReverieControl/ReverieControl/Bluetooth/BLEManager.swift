import CoreBluetooth
import Combine
import Foundation
import os

@MainActor
final class BLEManager: NSObject, ObservableObject {
    static let shared = BLEManager()

    enum State: Equatable {
        case poweredOff
        case unauthorized
        case unsupported
        case ready
        case scanning
        case connecting(String)
        case connected(String)
        case disconnected
    }

    @Published private(set) var state: State = .poweredOff
    @Published private(set) var lastError: String?
    @Published private(set) var discoveredPeripherals: [CBPeripheral] = []

    private var central: CBCentralManager!
    private var peripheral: CBPeripheral?
    private var writeCharacteristic: CBCharacteristic?
    private var pendingCommands: [Data] = []
    private let log = Logger(subsystem: "com.reverie.ReverieControl", category: "BLE")

    private let savedPeripheralKey = "ReverieSavedPeripheralUUID"

    override private init() {
        super.init()
        central = CBCentralManager(delegate: self, queue: .main, options: [
            CBCentralManagerOptionRestoreIdentifierKey: "com.reverie.ReverieControl.central",
            CBCentralManagerOptionShowPowerAlertKey: true
        ])
    }

    func startScan() {
        guard central.state == .poweredOn else { return }
        discoveredPeripherals.removeAll()
        state = .scanning
        central.scanForPeripherals(withServices: [ReverieProtocol.serviceUUID],
                                   options: [CBCentralManagerScanOptionAllowDuplicatesKey: false])
        DispatchQueue.main.asyncAfter(deadline: .now() + 15) { [weak self] in
            guard let self else { return }
            if case .scanning = self.state { self.stopScan() }
        }
    }

    func stopScan() {
        central.stopScan()
        if case .scanning = state {
            state = peripheral == nil ? .ready : .connected(peripheral?.name ?? "Cama")
        }
    }

    func connect(_ peripheral: CBPeripheral) {
        stopScan()
        self.peripheral = peripheral
        peripheral.delegate = self
        state = .connecting(peripheral.name ?? "Cama")
        central.connect(peripheral, options: [
            CBConnectPeripheralOptionNotifyOnDisconnectionKey: true,
            CBConnectPeripheralOptionNotifyOnConnectionKey: true,
            CBConnectPeripheralOptionNotifyOnNotificationKey: true
        ])
        UserDefaults.standard.set(peripheral.identifier.uuidString, forKey: savedPeripheralKey)
    }

    func disconnect() {
        if let p = peripheral { central.cancelPeripheralConnection(p) }
        peripheral = nil
        writeCharacteristic = nil
        state = .disconnected
    }

    func reconnectSavedIfNeeded() {
        guard case .ready = state, peripheral == nil else { return }
        guard let str = UserDefaults.standard.string(forKey: savedPeripheralKey),
              let uuid = UUID(uuidString: str) else {
            startScan(); return
        }
        let known = central.retrievePeripherals(withIdentifiers: [uuid])
        if let p = known.first {
            connect(p)
        } else {
            startScan()
        }
    }

    func send(_ command: ReverieCommand) {
        let data = command.data
        log.debug("send \(command.displayName) bytes=\(data.map { String(format: "%02x", $0) }.joined())")
        guard let peripheral, peripheral.state == .connected, let ch = writeCharacteristic else {
            pendingCommands.append(data)
            if peripheral == nil { reconnectSavedIfNeeded() }
            return
        }
        let kind: CBCharacteristicWriteType = ch.properties.contains(.writeWithoutResponse) ? .withoutResponse : .withResponse
        peripheral.writeValue(data, for: ch, type: kind)
    }

    func sendAndWait(_ command: ReverieCommand, timeout: TimeInterval = 5) async throws {
        try await ensureConnected(timeout: timeout)
        send(command)
        try await Task.sleep(nanoseconds: 150_000_000)
    }

    private func ensureConnected(timeout: TimeInterval) async throws {
        if case .connected = state, writeCharacteristic != nil { return }
        reconnectSavedIfNeeded()
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if case .connected = state, writeCharacteristic != nil { return }
            try await Task.sleep(nanoseconds: 200_000_000)
        }
        throw NSError(domain: "BLEManager", code: -1, userInfo: [NSLocalizedDescriptionKey: "No se pudo conectar a la cama"])
    }

    private func flushPending() {
        guard let peripheral, let ch = writeCharacteristic else { return }
        let kind: CBCharacteristicWriteType = ch.properties.contains(.writeWithoutResponse) ? .withoutResponse : .withResponse
        for data in pendingCommands { peripheral.writeValue(data, for: ch, type: kind) }
        pendingCommands.removeAll()
    }
}

extension BLEManager: CBCentralManagerDelegate {
    nonisolated func centralManagerDidUpdateState(_ central: CBCentralManager) {
        Task { @MainActor in
            switch central.state {
            case .poweredOn: self.state = .ready; self.reconnectSavedIfNeeded()
            case .poweredOff: self.state = .poweredOff
            case .unauthorized: self.state = .unauthorized
            case .unsupported: self.state = .unsupported
            default: break
            }
        }
    }

    nonisolated func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
        Task { @MainActor in
            if !self.discoveredPeripherals.contains(where: { $0.identifier == peripheral.identifier }) {
                self.discoveredPeripherals.append(peripheral)
            }
            if self.peripheral == nil { self.connect(peripheral) }
        }
    }

    nonisolated func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        Task { @MainActor in
            self.state = .connected(peripheral.name ?? "Cama")
            peripheral.discoverServices([ReverieProtocol.serviceUUID])
        }
    }

    nonisolated func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        Task { @MainActor in
            self.writeCharacteristic = nil
            self.state = .disconnected
            self.lastError = error?.localizedDescription
            try? await Task.sleep(nanoseconds: 1_500_000_000)
            self.reconnectSavedIfNeeded()
        }
    }

    nonisolated func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        Task { @MainActor in
            self.lastError = error?.localizedDescription
            self.state = .ready
        }
    }

    nonisolated func centralManager(_ central: CBCentralManager, willRestoreState dict: [String : Any]) {
        Task { @MainActor in
            if let restored = dict[CBCentralManagerRestoredStatePeripheralsKey] as? [CBPeripheral],
               let p = restored.first {
                self.peripheral = p
                p.delegate = self
                self.state = .connecting(p.name ?? "Cama")
            }
        }
    }
}

extension BLEManager: CBPeripheralDelegate {
    nonisolated func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        Task { @MainActor in
            guard let svc = peripheral.services?.first(where: { $0.uuid == ReverieProtocol.serviceUUID }) else { return }
            peripheral.discoverCharacteristics([ReverieProtocol.writeCharacteristicUUID], for: svc)
        }
    }

    nonisolated func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        Task { @MainActor in
            guard let ch = service.characteristics?.first(where: { $0.uuid == ReverieProtocol.writeCharacteristicUUID }) else { return }
            self.writeCharacteristic = ch
            self.flushPending()
        }
    }

    nonisolated func peripheral(_ peripheral: CBPeripheral, didWriteValueFor characteristic: CBCharacteristic, error: Error?) {
        if let error { Task { @MainActor in self.lastError = error.localizedDescription } }
    }
}
