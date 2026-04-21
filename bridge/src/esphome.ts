import pino from 'pino';
// @ts-ignore - the package has no types
import { Client } from '@2colors/esphome-native-api';
import {
  REVERIE_SERVICE_UUID,
  REVERIE_WRITE_CHARACTERISTIC_UUID,
  bufferFor,
  type CommandKind,
} from './reverie.js';

const log = pino({ name: 'esphome' });

export interface EsphomeOptions {
  host: string;
  port?: number;
  password?: string;
  encryptionKey?: string;
  bedAddress: string; // BLE MAC of the Reverie controller, e.g. "AA:BB:CC:DD:EE:FF"
}

export class EsphomeBridge {
  private client: any;
  private connected = false;

  constructor(private opts: EsphomeOptions) {
    this.client = new Client({
      host: opts.host,
      port: opts.port ?? 6053,
      password: opts.password,
      encryptionKey: opts.encryptionKey,
      reconnect: true,
      reconnectInterval: 15_000,
    });

    this.client.on('connected', () => {
      log.info({ host: opts.host }, 'esphome connected');
      this.connected = true;
    });
    this.client.on('disconnected', () => {
      log.warn('esphome disconnected');
      this.connected = false;
    });
    this.client.on('error', (err: Error) => log.error({ err }, 'esphome error'));
  }

  async start(): Promise<void> {
    this.client.connect();
  }

  async sendCommand(command: CommandKind): Promise<void> {
    if (!this.connected) throw new Error('ESPHome bridge not connected');
    const data = bufferFor(command);
    log.debug({ command, hex: data.toString('hex') }, 'writing BLE command');

    await this.client.connectBluetoothDevice(this.opts.bedAddress);
    try {
      const services = await this.client.listBluetoothGATTServices(this.opts.bedAddress);
      const service = services.find((s: any) => s.uuid?.toLowerCase() === REVERIE_SERVICE_UUID);
      if (!service) throw new Error('Reverie service not found on peripheral');
      const characteristic = service.characteristics.find(
        (c: any) => c.uuid?.toLowerCase() === REVERIE_WRITE_CHARACTERISTIC_UUID,
      );
      if (!characteristic) throw new Error('Reverie write characteristic not found');

      await this.client.writeBluetoothGATTCharacteristic(
        this.opts.bedAddress,
        characteristic.handle,
        data,
        true,
      );
    } finally {
      // Leave the connection open briefly to allow back-to-back commands; ESPHome times out idle.
    }
  }
}
