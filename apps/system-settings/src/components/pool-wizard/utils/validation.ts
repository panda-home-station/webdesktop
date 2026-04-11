/**
 * Validation Utilities
 * Step-by-step validation for pool wizard
 */

import { VDevType } from '@truenas/types/vdev-enum-types'
import { minDisksPerLayout, PoolWizardState } from '../store/poolWizardStore'

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  warnings: Record<string, string>
}

/**
 * Validate pool name
 */
function validatePoolName(name: string): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!name || !name.trim()) {
    errors.name = '池名称为必填项'
    return errors
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
    errors.name = '池名称必须以字母开头，只能包含字母、数字、下划线和连字符'
    return errors
  }

  if (name.length > 64) {
    errors.name = '池名称不能超过64个字符'
    return errors
  }

  return errors
}

/**
 * Validate encryption settings
 */
function validateEncryption(
  encryption: boolean,
  encryptionType: string,
  sedPassword: string | null
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (encryption && encryptionType === 'sed' && !sedPassword) {
    errors.sedPassword = 'SED密码为必填项'
  }

  if (encryption && encryptionType === 'sed' && sedPassword && sedPassword.length < 8) {
    errors.sedPassword = 'SED密码至少需要8个字符'
  }

  return errors
}

/**
 * Validate data vdev configuration
 */
function validateDataVdev(
  category: PoolWizardState['topology'][VDevType.Data]
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!category.layout) {
    errors.layout = '请选择数据布局'
    return errors
  }

  if (category.vdevs.length === 0) {
    errors.vdevs = '请至少选择一个硬盘'
    return errors
  }

  // Validate each vdev has minimum disks
  const minDisks = minDisksPerLayout[category.layout]
  category.vdevs.forEach((vdev, index) => {
    if (vdev.length < minDisks) {
      errors[`vdev_${index}`] = `${category.layout}布局至少需要${minDisks}块硬盘`
    }
  })

  return errors
}

/**
 * Validate optional vdev configuration
 */
function validateOptionalVdev(
  type: VDevType,
  category: PoolWizardState['topology'][VDevType]
): Record<string, string> {
  const errors: Record<string, string> = {}

  // If no layout is selected, it's optional and valid
  if (!category.layout) {
    return errors
  }

  // If layout is selected, vdevs should be configured
  if (category.vdevs.length === 0) {
    errors.vdevs = `请为${type}选择硬盘或清除布局`
    return errors
  }

  // Validate minimum disks
  const minDisks = minDisksPerLayout[category.layout]
  category.vdevs.forEach((vdev, index) => {
    if (vdev.length < minDisks) {
      errors[`vdev_${index}`] = `${category.layout}布局至少需要${minDisks}块硬盘`
    }
  })

  return errors
}

/**
 * Validate review step
 */
function validateReview(state: PoolWizardState): Record<string, string> {
  const errors: Record<string, string> = {}

  // Must have at least one data vdev
  const dataCategory = state.topology[VDevType.Data]
  if (!dataCategory.layout || dataCategory.vdevs.length === 0) {
    errors.data = '至少需要一个数据vdev'
  }

  return errors
}

/**
 * Validate a specific step
 */
export function validateStep(
  state: PoolWizardState,
  step: number
): Record<string, string> {
  switch (step) {
    case 0:
      // General step
      return {
        ...validatePoolName(state.name),
        ...validateEncryption(state.encryption, state.encryptionType, state.sedPassword),
      }

    case 1:
      // Data step
      return validateDataVdev(state.topology[VDevType.Data])

    case 2:
      // Log step
      return validateOptionalVdev(VDevType.Log, state.topology[VDevType.Log])

    case 3:
      // Spare step
      return validateOptionalVdev(VDevType.Spare, state.topology[VDevType.Spare])

    case 4:
      // Cache step
      return validateOptionalVdev(VDevType.Cache, state.topology[VDevType.Cache])

    case 5:
      // Metadata step
      return validateOptionalVdev(VDevType.Special, state.topology[VDevType.Special])

    case 6:
      // Dedup step
      return validateOptionalVdev(VDevType.Dedup, state.topology[VDevType.Dedup])

    case 7:
      // Review step
      return validateReview(state)

    default:
      return {}
  }
}

/**
 * Check if step has errors
 */
export function stepHasErrors(
  state: PoolWizardState,
  step: number
): boolean {
  const errors = validateStep(state, step)
  return Object.keys(errors).length > 0
}

/**
 * Check if step has warnings
 */
export function stepHasWarnings(
  state: PoolWizardState,
  step: number
): Record<string, string> {
  const warnings: Record<string, string> = {}

  if (step === 1) {
    // Data step - check for stripe warning
    const dataCategory = state.topology[VDevType.Data]
    if (dataCategory.layout === 'STRIPE' && dataCategory.vdevs.length > 0) {
      warnings.layout = 'Stripe布局没有冗余，一个硬盘故障可能导致数据丢失'
    }
  }

  if (step >= 2 && step <= 6) {
    // Optional vdev steps - check for stripe on log/dedup
    const vdevTypes: VDevType[] = [VDevType.Log, VDevType.Spare, VDevType.Cache, VDevType.Special, VDevType.Dedup]
    const typeIndex = step - 2
    if (typeIndex < vdevTypes.length) {
      const vdevType = vdevTypes[typeIndex]
      const category = state.topology[vdevType]
      if (category.layout === 'STRIPE' && category.vdevs.length > 0) {
        if (vdevType === VDevType.Log) {
          warnings.layout = 'Log vdev使用Stripe可能在电源故障时丢失数据'
        }
      }
    }
  }

  return warnings
}

/**
 * Validate all steps
 */
export function validateAllSteps(state: PoolWizardState): ValidationResult {
  const allErrors: Record<string, string> = {}
  const allWarnings: Record<string, string> = {}
  let isValid = true

  for (let step = 0; step < state.totalSteps; step++) {
    const errors = validateStep(state, step)
    const warnings = stepHasWarnings(state, step)

    if (Object.keys(errors).length > 0) {
      isValid = false
      Object.entries(errors).forEach(([key, value]) => {
        allErrors[`step${step}_${key}`] = value
      })
    }

    Object.entries(warnings).forEach(([key, value]) => {
      allWarnings[`step${step}_${key}`] = value
    })
  }

  return { isValid, errors: allErrors, warnings: allWarnings }
}
