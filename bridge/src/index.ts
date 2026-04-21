import pino from 'pino';
import { EsphomeBridge } from './esphome.js';
import { Scheduler } from './scheduler.js';
import { ScheduleStore } from './store.js';
import { buildApi } from './api.js';

const log = pino({ name: 'main' });

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var ${key}`);
  return v;
}

async function main() {
  const bridge = new EsphomeBridge({
    host: requireEnv('ESPHOME_HOST'),
    port: process.env.ESPHOME_PORT ? Number(process.env.ESPHOME_PORT) : undefined,
    password: process.env.ESPHOME_PASSWORD,
    encryptionKey: process.env.ESPHOME_ENCRYPTION_KEY,
    bedAddress: requireEnv('REVERIE_BLE_ADDRESS'),
  });
  await bridge.start();

  const store = new ScheduleStore(process.env.SCHEDULES_FILE ?? './data/schedules.json');
  await store.load();

  const scheduler = new Scheduler(store, bridge);
  scheduler.reload();

  const api = await buildApi(
    {
      port: process.env.PORT ? Number(process.env.PORT) : 8080,
      token: process.env.API_TOKEN,
    },
    { store, scheduler, bridge },
  );
  await api.start();

  log.info('Reverie bridge ready');
}

main().catch((err) => {
  log.error({ err }, 'fatal');
  process.exit(1);
});
