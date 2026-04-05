/**
 * On/Off enum
 * Ported from webui/src/app/enums/on-off.enum.ts
 */
export enum OnOff {
  On = 'ON',
  Off = 'OFF',
}

/**
 * Convert boolean to OnOff
 */
export function booleanToOnOff(value: boolean): OnOff {
  return value ? OnOff.On : OnOff.Off;
}

/**
 * Convert OnOff to boolean
 */
export function onOffToBoolean(value: OnOff): boolean {
  return value === OnOff.On;
}
