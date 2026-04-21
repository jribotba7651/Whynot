// Port of the Reverie BLE protocol used by https://github.com/richardhopton/smartbed-mqtt
// (src/Reverie/simple/Commands.ts and src/Reverie/simple/controllerBuilder.ts)

export const REVERIE_SERVICE_UUID = '1b1d9641-b942-4da8-89cc-98e6a58fbd93';
export const REVERIE_WRITE_CHARACTERISTIC_UUID = '6af87926-dc79-412e-a3e0-5f85c2d55de2';

const HEADER = 0x55;

export function buildCommand(payload: number[]): Buffer {
  const checksum = payload.reduce((acc, byte) => acc ^ byte, HEADER);
  return Buffer.from([HEADER, ...payload, checksum]);
}

export type CommandKind =
  | { kind: 'flat' }
  | { kind: 'zeroG' }
  | { kind: 'antiSnore' }
  | { kind: 'recallMemory'; value: number }
  | { kind: 'programMemory'; value: number }
  | { kind: 'headMove'; value: number }
  | { kind: 'feetMove'; value: number }
  | { kind: 'motorStop' }
  | { kind: 'massageHead'; value: number }
  | { kind: 'massageFoot'; value: number }
  | { kind: 'massageWave'; value: number }
  | { kind: 'underBedLightToggle' };

export function payloadFor(cmd: CommandKind): number[] {
  switch (cmd.kind) {
    case 'flat': return [0x05];
    case 'zeroG': return [0x15];
    case 'antiSnore': return [0x16];
    case 'recallMemory': return [0x10 + clamp(cmd.value, 1, 4)];
    case 'programMemory': return [0x20 + clamp(cmd.value, 1, 4)];
    case 'headMove': return [0x51, clamp(cmd.value, 0, 100)];
    case 'feetMove': return [0x52, clamp(cmd.value, 0, 100)];
    case 'motorStop': return [0xff];
    case 'massageHead': return [0x53, clamp(cmd.value, 0, 10)];
    case 'massageFoot': return [0x54, clamp(cmd.value, 0, 10)];
    case 'massageWave': return [0x40, clamp(cmd.value, 1, 4)];
    case 'underBedLightToggle': return [0x5b, 0x00];
  }
}

export function bufferFor(cmd: CommandKind): Buffer {
  return buildCommand(payloadFor(cmd));
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function describe(cmd: CommandKind): string {
  switch (cmd.kind) {
    case 'recallMemory': return `Memory ${cmd.value}`;
    case 'programMemory': return `Program memory ${cmd.value}`;
    case 'headMove': return `Head → ${cmd.value}`;
    case 'feetMove': return `Feet → ${cmd.value}`;
    case 'massageHead': return `Massage head ${cmd.value}`;
    case 'massageFoot': return `Massage foot ${cmd.value}`;
    case 'massageWave': return `Wave ${cmd.value}`;
    default: return cmd.kind;
  }
}
