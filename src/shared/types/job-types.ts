/**
 * Job types
 * Ported from webui/src/app/interfaces/job.interface.ts
 */

/**
 * Job state
 */
export type JobState = 'WAITING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'ABORTED';

/**
 * Core job interface
 */
export interface Job<T = unknown> {
  id: number;
  method: string;
  arguments: unknown[];
  progress: JobProgress;
  state: JobState;
  result?: T;
  error?: JobError;
  time_started: string;
  time_finished?: string;
}

/**
 * Job progress
 */
export interface JobProgress {
  percent: number;
  description?: string;
  details?: string;
}

/**
 * Job error
 */
export interface JobError {
  name?: string;
  message?: string;
  stack?: string;
  reason?: string;
  extra?: Record<string, unknown>;
}

/**
 * Job event from WebSocket
 */
export interface JobEvent {
  id: string | number;
  name: string;
  encoder?: string;
  msg: 'changed' | 'finished';
  extra?: Record<string, unknown>;
  error?: string;
  job?: Job;
}
