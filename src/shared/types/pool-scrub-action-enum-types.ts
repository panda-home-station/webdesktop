/**
 * Pool scrub action enum
 * Ported from webui/src/app/enums/pool-scrub-action.enum.ts
 */
export enum PoolScrubAction {
  Start = 'START',
  Stop = 'STOP',
  Pause = 'PAUSE',
}

/**
 * Get pool scrub action display name
 */
export function getPoolScrubActionLabel(action: PoolScrubAction): string {
  switch (action) {
    case PoolScrubAction.Start:
      return 'Start';
    case PoolScrubAction.Stop:
      return 'Stop';
    default:
      return action;
  }
}
