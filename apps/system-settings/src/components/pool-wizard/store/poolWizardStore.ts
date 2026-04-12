/**
 * Pool Wizard Store
 * Zustand store for pool creation wizard state management
 */

import { create } from 'zustand'
import { DetailsDisk, DiskDetailsResponse } from '@truenas/types/disk-types'
import { CreateVdevLayout, VDevType } from '@truenas/types/vdev-enum-types'
import { DiskType } from '@truenas/types/disk-type-enum-types'
import { diskService } from '@truenas/services/disk'
import { poolService } from '@truenas/services/pool'
import { automaticDiskSelection } from '../utils/disk-selection'
import { topologyToPayload } from '../utils/topology-utils'
import { validateStep } from '../utils/validation'

// ============ Types ============

export type EncryptionType = 'none' | 'software' | 'sed'

export interface PoolWizardTopologyCategory {
  layout: CreateVdevLayout | null
  width: number | null
  diskSize: number | null
  diskType: DiskType | null
  vdevsNumber: number | null
  treatDiskSizeAsMinimum: boolean
  vdevs: DetailsDisk[][]
  hasCustomDiskSelection: boolean
  draidDataDisks: number | null
  draidSpareDisks: number | null
}

export type PoolManagerTopology = Record<VDevType, PoolWizardTopologyCategory>

export interface Enclosure {
  id: string
  label: string
}

export interface PoolWizardState {
  // Navigation
  currentStep: number
  totalSteps: number
  isLoading: boolean
  isCreating: boolean
  error: string | null

  // General
  name: string
  encryption: boolean
  encryptionType: EncryptionType
  encryptionAlgorithm: string
  sedPassword: string | null

  // Enclosure
  enclosures: Enclosure[]
  useEnclosure: boolean
  limitToEnclosure: string | null
  dispersalStrategy: 'none' | 'maximize' | 'limit'
  allowNonUniqueSerialDisks: boolean

  // Topology
  topology: PoolManagerTopology

  // Disks
  allDisks: DetailsDisk[]
  availableDisks: DetailsDisk[]
  unusedDisks: DetailsDisk[]

  // Validation
  stepErrors: Record<number, Record<string, string>>
}

interface PoolWizardActions {
  // Initialization
  initialize: () => Promise<void>
  reset: () => void

  // Navigation
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  canProceed: () => boolean
  getStepErrors: (step: number) => Record<string, string>

  // General
  setName: (name: string) => void
  setEncryption: (enabled: boolean) => void
  setEncryptionType: (type: EncryptionType) => void
  setEncryptionAlgorithm: (algorithm: string) => void
  setSedPassword: (password: string | null) => void

  // Enclosure
  setUseEnclosure: (use: boolean) => void
  setLimitToEnclosure: (enclosureId: string | null) => void
  setDispersalStrategy: (strategy: 'none' | 'maximize' | 'limit') => void
  setAllowNonUniqueSerialDisks: (allow: boolean) => void

  // Topology
  setLayout: (type: VDevType, layout: CreateVdevLayout | null) => void
  setDiskSize: (type: VDevType, size: number | null) => void
  setDiskType: (type: VDevType, diskType: DiskType | null) => void
  setTreatDiskSizeAsMinimum: (type: VDevType, treat: boolean) => void
  setWidth: (type: VDevType, width: number | null) => void
  setVdevsNumber: (type: VDevType, number: number | null) => void
  setDraidDataDisks: (type: VDevType, disks: number | null) => void
  setDraidSpareDisks: (type: VDevType, disks: number | null) => void
  setManualDisks: (type: VDevType, vdevs: DetailsDisk[][]) => void

  // Auto selection
  runAutoSelection: (type: VDevType) => void

  // Pool creation
  createPool: () => Promise<void>
}

type PoolWizardStore = PoolWizardState & PoolWizardActions

// ============ Layout Constraints ============

export const minDisksPerLayout: Record<CreateVdevLayout, number> = {
  [CreateVdevLayout.Stripe]: 1,
  [CreateVdevLayout.Mirror]: 2,
  [CreateVdevLayout.Raidz1]: 3,
  [CreateVdevLayout.Raidz2]: 4,
  [CreateVdevLayout.Raidz3]: 5,
  [CreateVdevLayout.Draid1]: 2,
  [CreateVdevLayout.Draid2]: 3,
  [CreateVdevLayout.Draid3]: 4,
}

export const isDraidLayout = (layout: CreateVdevLayout | null): boolean => {
  return layout?.startsWith('DRAID') ?? false
}

// ============ Layout Options Per VDev Type ============

export const LAYOUT_OPTIONS: Record<VDevType, CreateVdevLayout[]> = {
  [VDevType.Data]: [
    CreateVdevLayout.Stripe,
    CreateVdevLayout.Mirror,
    CreateVdevLayout.Raidz1,
    CreateVdevLayout.Raidz2,
    CreateVdevLayout.Raidz3,
    CreateVdevLayout.Draid1,
    CreateVdevLayout.Draid2,
    CreateVdevLayout.Draid3,
  ],
  [VDevType.Log]: [CreateVdevLayout.Mirror, CreateVdevLayout.Stripe],
  [VDevType.Spare]: [CreateVdevLayout.Stripe],
  [VDevType.Cache]: [CreateVdevLayout.Stripe],
  [VDevType.Special]: [
    CreateVdevLayout.Stripe,
    CreateVdevLayout.Mirror,
  ],
  [VDevType.Dedup]: [CreateVdevLayout.Mirror, CreateVdevLayout.Stripe],
}

// ============ Create Initial Topology Category ============

const createInitialCategory = (): PoolWizardTopologyCategory => ({
  layout: null,
  width: null,
  diskSize: null,
  diskType: null,
  vdevsNumber: null,
  treatDiskSizeAsMinimum: false,
  vdevs: [],
  hasCustomDiskSelection: false,
  draidDataDisks: null,
  draidSpareDisks: null,
})

// ============ Create Initial Topology ============

const createInitialTopology = (): PoolManagerTopology => ({
  [VDevType.Data]: createInitialCategory(),
  [VDevType.Log]: createInitialCategory(),
  [VDevType.Spare]: createInitialCategory(),
  [VDevType.Cache]: createInitialCategory(),
  [VDevType.Special]: createInitialCategory(),
  [VDevType.Dedup]: createInitialCategory(),
})

// ============ Step Definitions ============

export interface StepDefinition {
  id: number
  title: string
  vdevType?: VDevType
  isOptional?: boolean
}

export const WIZARD_STEPS: StepDefinition[] = [
  { id: 0, title: '基本信息' },
  { id: 1, title: '数据', vdevType: VDevType.Data },
  { id: 2, title: '日志', vdevType: VDevType.Log, isOptional: true },
  { id: 3, title: '备用', vdevType: VDevType.Spare, isOptional: true },
  { id: 4, title: '缓存', vdevType: VDevType.Cache, isOptional: true },
  { id: 5, title: '元数据', vdevType: VDevType.Special, isOptional: true },
  { id: 6, title: '去重', vdevType: VDevType.Dedup, isOptional: true },
  { id: 7, title: '评审' },
]

// ============ Store ============

export const usePoolWizardStore = create<PoolWizardStore>((set, get) => ({
  // Initial State
  currentStep: 0,
  totalSteps: WIZARD_STEPS.length,
  isLoading: false,
  isCreating: false,
  error: null,

  name: '',
  encryption: false,
  encryptionType: 'none',
  encryptionAlgorithm: 'AES-128-GCM',
  sedPassword: null,

  enclosures: [],
  useEnclosure: false,
  limitToEnclosure: null,
  dispersalStrategy: 'none',
  allowNonUniqueSerialDisks: false,

  topology: createInitialTopology(),

  allDisks: [],
  availableDisks: [],
  unusedDisks: [],

  stepErrors: {},

  // ============ Initialization ============

  initialize: async () => {
    set({ isLoading: true, error: null })
    try {
      const diskDetails: DiskDetailsResponse = await diskService.details({ join_partitions: true })
      set({
        allDisks: [...diskDetails.used, ...diskDetails.unused],
        unusedDisks: diskDetails.unused,
        availableDisks: diskDetails.unused,
        isLoading: false,
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '加载硬盘失败',
        isLoading: false,
      })
    }
  },

  reset: () => {
    set({
      currentStep: 0,
      isLoading: false,
      isCreating: false,
      error: null,
      name: '',
      encryption: false,
      encryptionType: 'none',
      encryptionAlgorithm: 'AES-128-GCM',
      sedPassword: null,
      useEnclosure: false,
      limitToEnclosure: null,
      dispersalStrategy: 'none',
      allowNonUniqueSerialDisks: false,
      topology: createInitialTopology(),
      stepErrors: {},
    })
  },

  // ============ Navigation ============

  setStep: (step: number) => {
    const { totalSteps } = get()
    if (step >= 0 && step < totalSteps) {
      set({ currentStep: step })
    }
  },

  nextStep: () => {
    const { currentStep, totalSteps } = get()
    if (currentStep < totalSteps - 1) {
      set({ currentStep: currentStep + 1 })
    }
  },

  prevStep: () => {
    const { currentStep } = get()
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 })
    }
  },

  canProceed: () => {
    const state = get()
    const errors = validateStep(state, state.currentStep)
    return Object.keys(errors).length === 0
  },

  getStepErrors: (step: number) => {
    const state = get()
    return validateStep(state, step)
  },

  // ============ General ============

  setName: (name: string) => {
    set({ name })
  },

  setEncryption: (enabled: boolean) => {
    set({ encryption: enabled })
  },

  setEncryptionType: (type: EncryptionType) => {
    set({ encryptionType: type })
  },

  setEncryptionAlgorithm: (algorithm: string) => {
    set({ encryptionAlgorithm: algorithm })
  },

  setSedPassword: (password: string | null) => {
    set({ sedPassword: password })
  },

  // ============ Enclosure ============

  setUseEnclosure: (use: boolean) => {
    set({ useEnclosure: use })
  },

  setLimitToEnclosure: (enclosureId: string | null) => {
    set({ limitToEnclosure: enclosureId })
  },

  setDispersalStrategy: (strategy: 'none' | 'maximize' | 'limit') => {
    set({ dispersalStrategy: strategy })
  },

  setAllowNonUniqueSerialDisks: (allow: boolean) => {
    set({ allowNonUniqueSerialDisks: allow })
  },

  // ============ Topology ============

  setLayout: (type: VDevType, layout: CreateVdevLayout | null) => {
    set((state) => {
      const newTopology = { ...state.topology }
      newTopology[type] = {
        ...newTopology[type],
        layout,
        // Reset vdevs when layout changes
        vdevs: [],
        width: null,
        vdevsNumber: null,
        hasCustomDiskSelection: false,
      }
      return { topology: newTopology }
    })
  },

  setDiskSize: (type: VDevType, size: number | null) => {
    set((state) => {
      const newTopology = { ...state.topology }
      newTopology[type] = { ...newTopology[type], diskSize: size }
      return { topology: newTopology }
    })
  },

  setDiskType: (type: VDevType, diskType: DiskType | null) => {
    set((state) => {
      const newTopology = { ...state.topology }
      newTopology[type] = { ...newTopology[type], diskType: diskType }
      return { topology: newTopology }
    })
  },

  setTreatDiskSizeAsMinimum: (type: VDevType, treat: boolean) => {
    set((state) => {
      const newTopology = { ...state.topology }
      newTopology[type] = { ...newTopology[type], treatDiskSizeAsMinimum: treat }
      return { topology: newTopology }
    })
  },

  setWidth: (type: VDevType, width: number | null) => {
    set((state) => {
      const newTopology = { ...state.topology }
      newTopology[type] = { ...newTopology[type], width }
      return { topology: newTopology }
    })
  },

  setVdevsNumber: (type: VDevType, number: number | null) => {
    set((state) => {
      const newTopology = { ...state.topology }
      newTopology[type] = { ...newTopology[type], vdevsNumber: number }
      return { topology: newTopology }
    })
  },

  setDraidDataDisks: (type: VDevType, disks: number | null) => {
    set((state) => {
      const newTopology = { ...state.topology }
      newTopology[type] = { ...newTopology[type], draidDataDisks: disks }
      return { topology: newTopology }
    })
  },

  setDraidSpareDisks: (type: VDevType, disks: number | null) => {
    set((state) => {
      const newTopology = { ...state.topology }
      newTopology[type] = { ...newTopology[type], draidSpareDisks: disks }
      return { topology: newTopology }
    })
  },

  setManualDisks: (type: VDevType, vdevs: DetailsDisk[][]) => {
    set((state) => {
      const newTopology = { ...state.topology }
      newTopology[type] = {
        ...newTopology[type],
        vdevs,
        hasCustomDiskSelection: true,
      }
      return { topology: newTopology }
    })
  },

  // ============ Auto Selection ============

  runAutoSelection: (type: VDevType) => {
    const state = get()
    const category = state.topology[type]

    if (!category.layout || !category.diskSize || !category.diskType) {
      return
    }

    // Calculate unused disks for this category
    const usedDisks = getUsedDisksExcluding(state.topology, type)
    const availableForThisCategory = state.unusedDisks.filter(
      (disk) => !usedDisks.some((d) => d.devname === disk.devname)
    )

    const result = automaticDiskSelection(availableForThisCategory, {
      layout: category.layout,
      diskSize: category.diskSize,
      diskType: category.diskType,
      treatDiskSizeAsMinimum: category.treatDiskSizeAsMinimum,
      width: category.width,
      vdevsNumber: category.vdevsNumber,
      draidDataDisks: category.draidDataDisks,
      draidSpareDisks: category.draidSpareDisks,
    })

    set((state) => {
      const newTopology = { ...state.topology }
      newTopology[type] = {
        ...newTopology[type],
        vdevs: result.vdevs,
        width: result.suggestedWidth,
        vdevsNumber: result.suggestedVdevsNumber,
        hasCustomDiskSelection: false,
      }
      return { topology: newTopology }
    })
  },

  // ============ Pool Creation ============

  createPool: async () => {
    const state = get()
    set({ isCreating: true, error: null })

    try {
      const payload = {
        name: state.name,
        topology: topologyToPayload(state.topology),
        encryption: state.encryption,
        encryption_options: state.encryption
          ? {
              generate_key: true,
              algorithm: state.encryptionAlgorithm,
              passphrase: state.sedPassword || undefined,
            }
          : undefined,
        allow_duplicate_serials: state.allowNonUniqueSerialDisks,
      }

      await poolService.create(payload)
      set({ isCreating: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '创建池失败',
        isCreating: false,
      })
    }
  },
}))

// ============ Helper Functions ============

function getUsedDisksExcluding(
  topology: PoolManagerTopology,
  excludeType: VDevType
): DetailsDisk[] {
  const usedDisks: DetailsDisk[] = []

  Object.entries(topology).forEach(([type, category]) => {
    if (type === excludeType) return
    category.vdevs.forEach((vdev) => {
      usedDisks.push(...vdev)
    })
  })

  return usedDisks
}

// ============ Selectors ============

export const selectCurrentStep = (state: PoolWizardState) => state.currentStep
export const selectTopology = (state: PoolWizardState) => state.topology
export const selectName = (state: PoolWizardState) => state.name
export const selectIsCreating = (state: PoolWizardState) => state.isCreating
export const selectError = (state: PoolWizardState) => state.error
export const selectUnusedDisks = (state: PoolWizardState) => state.unusedDisks
export const selectIsLoading = (state: PoolWizardState) => state.isLoading

/**
 * Get count of disks with non-unique serial numbers
 */
export function selectNonUniqueSerialDisksCount(state: PoolWizardState): number {
  const serialCount = new Map<string, number>()
  state.allDisks.forEach((disk) => {
    if (disk.serial) {
      serialCount.set(disk.serial, (serialCount.get(disk.serial) || 0) + 1)
    }
  })
  return Array.from(serialCount.values()).filter((count) => count > 1).length
}
