import Fastify from 'fastify';
import pino from 'pino';
import type { EsphomeBridge } from './esphome.js';
import type { Scheduler } from './scheduler.js';
import type { CommandKind } from './reverie.js';
import type { ScheduleRecord, ScheduleStore } from './store.js';

const log = pino({ name: 'api' });

export interface ApiOptions {
  port: number;
  token?: string;
}

export async function buildApi(opts: ApiOptions, deps: {
  store: ScheduleStore;
  scheduler: Scheduler;
  bridge: EsphomeBridge;
}): Promise<{ start: () => Promise<void> }> {
  const app = Fastify({ logger: true });

  app.addHook('onRequest', async (req, reply) => {
    if (!opts.token) return;
    const auth = req.headers.authorization ?? '';
    if (auth !== `Bearer ${opts.token}`) reply.code(401).send({ error: 'unauthorized' });
  });

  app.get('/health', async () => ({ ok: true }));

  app.get('/schedules', async () => deps.store.list());

  app.put<{ Body: { schedules: ScheduleRecord[] } }>('/schedules', async (req) => {
    await deps.store.replaceAll(req.body.schedules);
    deps.scheduler.reload();
    return { count: req.body.schedules.length };
  });

  app.post<{ Body: ScheduleRecord }>('/schedules', async (req) => {
    await deps.store.upsert(req.body);
    deps.scheduler.reload();
    return req.body;
  });

  app.delete<{ Params: { id: string } }>('/schedules/:id', async (req) => {
    await deps.store.remove(req.params.id);
    deps.scheduler.reload();
    return { ok: true };
  });

  app.post<{ Body: { command: CommandKind } }>('/command', async (req) => {
    await deps.bridge.sendCommand(req.body.command);
    return { ok: true };
  });

  return {
    start: async () => {
      await app.listen({ port: opts.port, host: '0.0.0.0' });
      log.info(`API listening on :${opts.port}`);
    },
  };
}
