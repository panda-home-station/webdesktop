/**
 * Encryption key format enum
 * Ported from webui/src/app/enums/encryption-key-format.enum.ts
 */
export enum EncryptionKeyFormat {
  Hex = 'HEX',
  Passphrase = 'PASSPHRASE',
  Raw = 'RAW',
}

/**
 * Get encryption key format display name
 */
export function getEncryptionKeyFormatLabel(format: EncryptionKeyFormat): string {
  switch (format) {
    case EncryptionKeyFormat.Hex:
      return 'Hex';
    case EncryptionKeyFormat.Passphrase:
      return 'Passphrase';
    case EncryptionKeyFormat.Raw:
      return 'Raw';
    default:
      return format;
  }
}
