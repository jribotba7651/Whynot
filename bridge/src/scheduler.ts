import cron, { type ScheduledTask } from 'node-cron';
import pino from 'pino';
import type { EsphomeBridge } from './esphome.js';
import { describe } from './reverie.js';
import type { ScheduleRecord, ScheduleStore } from './store.js';

const log = pino({ name: 'scheduler' });

export class Scheduler {
  private tasks = new Map<string, ScheduledTask>();

  constructor(private store: ScheduleStore, private bridge: EsphomeBridge) {}

  reload(): void {
    this.clear();
    for (const record of this.store.list()) {
      if (!record.enabled) continue;
      this.register(record);
    }
  }

  clear(): void {
    for (const task of this.tasks.values()) task.stop();
    this.tasks.clear();
  }

  private register(record: ScheduleRecord): void {
    // node-cron uses Sun=0..Sat=6; our mask uses bit 0=Sun..bit 6=Sat (Calendar weekday 1=Sun).
    const days: number[] = [];
    for (let i = 0; i < 7; i++) if ((record.daysOfWeekMask & (1 << i)) !== 0) days.push(i);
    const dayList = days.length === 7 ? '*' : days.join(',');
    const expr = `0 ${record.minute} ${record.hour} * * ${dayList}`;

    if (!cron.validate(expr)) {
      log.error({ expr, record }, 'invalid cron expression, skipping');
      return;
    }

    const task = cron.schedule(expr, async () => {
      try {
        log.info({ id: record.id, name: record.name, command: describe(record.command) }, 'firing schedule');
        await this.bridge.sendCommand(record.command);
        await this.store.markRan(record.id, new Date());
      } catch (err) {
        log.error({ err, id: record.id }, 'schedule run failed');
      }
    });
    this.tasks.set(record.id, task);
  }
}
