/**
 * Pool scrub types
 * Ported from webui/src/app/interfaces/pool-scrub.interface.ts
 */

import { PoolScrubAction } from './pool-scrub-action-enum-types';

/**
 * Schedule type
 */
export interface Schedule {
  minute?: string;
  hour?: string;
  dom?: string;
  month?: string;
  dow?: string;
  begin?: string;
  end?: string;
}

/**
 * Scrub task
 */
export interface ScrubTask {
  description: string;
  enabled: boolean;
  id: number;
  pool: number;
  pool_name: string;
  schedule: Schedule;
  threshold: number;
}

/**
 * Create scrub task parameters
 */
export type CreateScrubTask = Omit<ScrubTask, 'id' | 'pool_name'>;

/**
 * Pool scrub task parameters
 */
export type PoolScrubTaskParams = [
  poolId: number,
  params: PoolScrubAction,
];

/**
 * Scrub task update parameters
 */
export interface ScrubTaskUpdate {
  description?: string;
  enabled?: boolean;
  schedule?: Schedule;
  threshold?: number;
}

/**
 * Check if scrub task is enabled
 */
export function isScrubTaskEnabled(task: ScrubTask): boolean {
  return task.enabled;
}

/**
 * Get scrub task schedule display
 */
export function getScrubScheduleDisplay(schedule: Schedule): string {
  const parts: string[] = [];

  if (schedule.begin) {
    parts.push(`Start: ${schedule.begin}`);
  }

  if (schedule.end) {
    parts.push(`End: ${schedule.end}`);
  }

  if (schedule.dow) {
    parts.push(`Days: ${schedule.dow}`);
  }

  if (schedule.dom) {
    parts.push(`Dates: ${schedule.dom}`);
  }

  if (schedule.hour) {
    parts.push(`Hours: ${schedule.hour}`);
  }

  if (schedule.minute) {
    parts.push(`Minutes: ${schedule.minute}`);
  }

  return parts.join(' ');
}
