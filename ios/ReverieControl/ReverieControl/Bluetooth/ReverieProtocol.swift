import CoreBluetooth
import Foundation

enum ReverieProtocol {
    static let serviceUUID = CBUUID(string: "1b1d9641-b942-4da8-89cc-98e6a58fbd93")
    static let writeCharacteristicUUID = CBUUID(string: "6af87926-dc79-412e-a3e0-5f85c2d55de2")

    static let frameHeader: UInt8 = 0x55

    static func buildCommand(_ payload: [UInt8]) -> Data {
        let checksum = payload.reduce(frameHeader) { $0 ^ $1 }
        return Data([frameHeader] + payload + [checksum])
    }
}

enum ReverieCommand {
    case flat
    case zeroG
    case antiSnore
    case recallMemory(Int)
    case programMemory(Int)
    case headMove(position: UInt8)
    case feetMove(position: UInt8)
    case motorStop
    case massageHead(level: UInt8)
    case massageFoot(level: UInt8)
    case massageWave(level: UInt8)
    case underBedLightToggle

    var payload: [UInt8] {
        switch self {
        case .flat: return [0x05]
        case .zeroG: return [0x15]
        case .antiSnore: return [0x16]
        case .recallMemory(let n):
            let clamped = max(1, min(4, n))
            return [UInt8(0x10 + clamped)]
        case .programMemory(let n):
            let clamped = max(1, min(4, n))
            return [UInt8(0x20 + clamped)]
        case .headMove(let pos): return [0x51, pos]
        case .feetMove(let pos): return [0x52, pos]
        case .motorStop: return [0xff]
        case .massageHead(let level): return [0x53, min(level, 10)]
        case .massageFoot(let level): return [0x54, min(level, 10)]
        case .massageWave(let level): return [0x40, max(1, min(level, 4))]
        case .underBedLightToggle: return [0x5b, 0x00]
        }
    }

    var data: Data { ReverieProtocol.buildCommand(payload) }
}

extension ReverieCommand: Codable, Equatable, Hashable {
    enum CodingKeys: String, CodingKey { case kind, value }

    enum Kind: String, Codable {
        case flat, zeroG, antiSnore, recallMemory, programMemory
        case headMove, feetMove, motorStop
        case massageHead, massageFoot, massageWave, underBedLightToggle
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let kind = try c.decode(Kind.self, forKey: .kind)
        let value = try c.decodeIfPresent(Int.self, forKey: .value) ?? 0
        switch kind {
        case .flat: self = .flat
        case .zeroG: self = .zeroG
        case .antiSnore: self = .antiSnore
        case .recallMemory: self = .recallMemory(value)
        case .programMemory: self = .programMemory(value)
        case .headMove: self = .headMove(position: UInt8(value))
        case .feetMove: self = .feetMove(position: UInt8(value))
        case .motorStop: self = .motorStop
        case .massageHead: self = .massageHead(level: UInt8(value))
        case .massageFoot: self = .massageFoot(level: UInt8(value))
        case .massageWave: self = .massageWave(level: UInt8(value))
        case .underBedLightToggle: self = .underBedLightToggle
        }
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .flat: try c.encode(Kind.flat, forKey: .kind)
        case .zeroG: try c.encode(Kind.zeroG, forKey: .kind)
        case .antiSnore: try c.encode(Kind.antiSnore, forKey: .kind)
        case .recallMemory(let n):
            try c.encode(Kind.recallMemory, forKey: .kind); try c.encode(n, forKey: .value)
        case .programMemory(let n):
            try c.encode(Kind.programMemory, forKey: .kind); try c.encode(n, forKey: .value)
        case .headMove(let p):
            try c.encode(Kind.headMove, forKey: .kind); try c.encode(Int(p), forKey: .value)
        case .feetMove(let p):
            try c.encode(Kind.feetMove, forKey: .kind); try c.encode(Int(p), forKey: .value)
        case .motorStop: try c.encode(Kind.motorStop, forKey: .kind)
        case .massageHead(let l):
            try c.encode(Kind.massageHead, forKey: .kind); try c.encode(Int(l), forKey: .value)
        case .massageFoot(let l):
            try c.encode(Kind.massageFoot, forKey: .kind); try c.encode(Int(l), forKey: .value)
        case .massageWave(let l):
            try c.encode(Kind.massageWave, forKey: .kind); try c.encode(Int(l), forKey: .value)
        case .underBedLightToggle: try c.encode(Kind.underBedLightToggle, forKey: .kind)
        }
    }

    var displayName: String {
        switch self {
        case .flat: return "Flat"
        case .zeroG: return "Zero-G"
        case .antiSnore: return "Anti-Snore"
        case .recallMemory(let n): return "Memoria \(n)"
        case .programMemory(let n): return "Programar M\(n)"
        case .headMove(let p): return "Cabeza → \(p)"
        case .feetMove(let p): return "Pies → \(p)"
        case .motorStop: return "Stop"
        case .massageHead(let l): return "Masaje cabeza \(l)"
        case .massageFoot(let l): return "Masaje pies \(l)"
        case .massageWave(let l): return "Wave \(l)"
        case .underBedLightToggle: return "Luz cama"
        }
    }
}
