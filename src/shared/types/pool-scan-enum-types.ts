/**
 * Pool scan enums
 * Ported from webui/src/app/enums/pool-scan-function.enum.ts and pool-scan-state.enum.ts
 */

/**
 * Pool scan function
 */
export enum PoolScanFunction {
  Scrub = 'SCRUB',
  Resilver = 'RESILVER',
}

/**
 * Pool scan state
 */
export enum PoolScanState {
  None = 'NONE',
  Scanning = 'SCANNING',
  Finished = 'FINISHED',
  Cancelled = 'CANCELLED',
}

/**
 * Get scan function label
 */
export function getPoolScanFunctionLabel(fn: PoolScanFunction): string {
  switch (fn) {
    case PoolScanFunction.Scrub:
      return 'Scrub';
    case PoolScanFunction.Resilver:
      return 'Resilver';
    default:
      return fn;
  }
}

/**
 * Get scan state label
 */
export function getPoolScanStateLabel(state: PoolScanState): string {
  switch (state) {
    case PoolScanState.None:
      return 'None';
    case PoolScanState.Scanning:
      return 'Scanning';
    case PoolScanState.Finished:
      return 'Finished';
    case PoolScanState.Cancelled:
      return 'Cancelled';
    default:
      return state;
  }
}

/**
 * Check if scan is active
 */
export function isScanActive(state: PoolScanState): boolean {
  return state === PoolScanState.Scanning;
}
