/**
 * ZFS property types
 * Ported from webui/src/app/interfaces/zfs-property.interface.ts
 */

/**
 * ZFS property source
 */
export enum ZfsPropertySource {
  Default = 'DEFAULT',
  Local = 'LOCAL',
  Temporary = 'TEMPORARY',
  Inherited = 'INHERITED',
}

/**
 * An object that contains both the original value from ZFS
 * and typed value parsed by middleware.
 *
 * @example
 * {
 *   parsed: 131072
 *   rawvalue: "131072"
 *   source: "DEFAULT"
 *   value: "128K"
 * }
 */
export interface ZfsProperty<V, P = unknown> {
  parsed: P;
  rawvalue: string;
  value: V;
  source: ZfsPropertySource;
}

/**
 * Check if property is locally set
 */
export function isPropertyLocal<V, P>(property: ZfsProperty<V, P>): boolean {
  return property.source === ZfsPropertySource.Local;
}

/**
 * Check if property is inherited
 */
export function isPropertyInherited<V, P>(property: ZfsProperty<V, P>): boolean {
  return property.source === ZfsPropertySource.Inherited;
}

/**
 * Check if property is default
 */
export function isPropertyDefault<V, P>(property: ZfsProperty<V, P>): boolean {
  return property.source === ZfsPropertySource.Default;
}

/**
 * Get property display value
 * Returns the parsed value if available, otherwise the string value
 */
export function getPropertyDisplayValue<V, P>(property: ZfsProperty<V, P>): P | V {
  return property.parsed !== undefined && property.parsed !== null
    ? property.parsed
    : property.value;
}

/**
 * Create a default ZFS property
 */
export function createDefaultZfsProperty<V, P>(
  value: V,
  parsed?: P,
): ZfsProperty<V, P> {
  return {
    value,
    rawvalue: String(value),
    parsed: parsed ?? value as unknown as P,
    source: ZfsPropertySource.Default,
  };
}
