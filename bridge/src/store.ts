import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import type { CommandKind } from './reverie.js';

export interface ScheduleRecord {
  id: string;
  name: string;
  hour: number;
  minute: number;
  daysOfWeekMask: number;
  command: CommandKind;
  enabled: boolean;
  lastRunAt?: string;
}

export class ScheduleStore {
  private cache: ScheduleRecord[] = [];

  constructor(private path: string) {}

  async load(): Promise<ScheduleRecord[]> {
    try {
      const raw = await fs.readFile(this.path, 'utf8');
      this.cache = JSON.parse(raw);
    } catch (err: any) {
      if (err.code === 'ENOENT') this.cache = [];
      else throw err;
    }
    return this.cache;
  }

  list(): ScheduleRecord[] {
    return [...this.cache];
  }

  async replaceAll(records: ScheduleRecord[]): Promise<void> {
    this.cache = records;
    await this.persist();
  }

  async upsert(record: ScheduleRecord): Promise<void> {
    const index = this.cache.findIndex((r) => r.id === record.id);
    if (index >= 0) this.cache[index] = record;
    else this.cache.push(record);
    await this.persist();
  }

  async remove(id: string): Promise<void> {
    this.cache = this.cache.filter((r) => r.id !== id);
    await this.persist();
  }

  async markRan(id: string, at: Date): Promise<void> {
    const record = this.cache.find((r) => r.id === id);
    if (!record) return;
    record.lastRunAt = at.toISOString();
    await this.persist();
  }

  private async persist(): Promise<void> {
    await fs.mkdir(dirname(this.path), { recursive: true });
    await fs.writeFile(this.path, JSON.stringify(this.cache, null, 2));
  }
}
