/**
 * Disk bus enum
 * Ported from webui/src/app/enums/disk-bus.enum.ts
 */
export enum DiskBus {
  Spi = 'SPI',
  Usb = 'USB',
  Ata = 'ATA',
  Sata = 'SATA',
  Sas = 'SAS',
  Scsci = 'SCSI',
  Ide = 'IDE',
  Unknown = 'UNKNOWN',
}

/**
 * Get disk bus display name
 */
export function getDiskBusLabel(bus: DiskBus): string {
  switch (bus) {
    case DiskBus.Sata:
      return 'SATA';
    case DiskBus.Sas:
      return 'SAS';
    case DiskBus.Scsci:
      return 'SCSI';
    case DiskBus.Ide:
      return 'IDE';
    case DiskBus.Usb:
      return 'USB';
    case DiskBus.Spi:
      return 'SPI';
    case DiskBus.Ata:
      return 'ATA';
    default:
      return 'Unknown';
  }
}
