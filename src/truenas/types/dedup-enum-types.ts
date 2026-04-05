/**
 * Deduplication setting enum
 * Ported from webui/src/app/enums/deduplication-setting.enum.ts
 */
export enum DeduplicationSetting {
  Off = 'OFF',
  On = 'ON',
  Verify = 'VERIFY',
}

/**
 * Get deduplication setting label
 */
export function getDeduplicationLabel(setting: DeduplicationSetting): string {
  switch (setting) {
    case DeduplicationSetting.Off:
      return 'Off';
    case DeduplicationSetting.On:
      return 'On';
    case DeduplicationSetting.Verify:
      return 'Verify';
    default:
      return setting;
  }
}
