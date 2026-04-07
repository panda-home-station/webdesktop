/**
 * Yes/No enum
 * Ported from webui/src/app/enums/yes-no.enum.ts
 */
export enum YesNo {
  Yes = 'YES',
  No = 'NO',
}

/**
 * Convert boolean to YesNo
 */
export function booleanToYesNo(value: boolean): YesNo {
  return value ? YesNo.Yes : YesNo.No;
}

/**
 * Convert YesNo to boolean
 */
export function yesNoToBoolean(value: YesNo): boolean {
  return value === YesNo.Yes;
}
