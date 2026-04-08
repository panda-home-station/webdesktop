/**
 * Pool Manager Store
 * Manages pool creation wizard state
 */

import { create } from 'zustand';

interface VdevGroup {
  type: string;
  vdevs: Vdev[];
}

interface Vdev {
  id: string;
  type: string;
  disks: string[];
}

interface PoolManagerState {
  // Step management
  currentStep: number;
  totalSteps: number;

  // General configuration
  name: string;
  encryption: boolean;
  encryptionAlgorithm: string;
  encryptionPassphrase: string;
  generateKey: boolean;
  allowDuplicateSerials: boolean;

  // VDEV configuration
  vdevGroups: VdevGroup[];
  availableDisks: Record<string, unknown>[];

  // Deduplication
  deduplication: string;

  // Validation
  errors: Record<string, string>;

  // Actions
  initialize: () => void;
  reset: () => void;
  setName: (name: string) => void;
  setEncryption: (enabled: boolean) => void;
  setEncryptionAlgorithm: (algorithm: string) => void;
  setEncryptionPassphrase: (passphrase: string) => void;
  setGenerateKey: (generate: boolean) => void;
  setAllowDuplicateSerials: (allow: boolean) => void;
  addVdev: (type: string, layout: string) => void;
  removeVdev: (id: string) => void;
  setDeduplication: (dedup: string) => void;
  loadAvailableDisks: () => Promise<void>;
  validate: () => boolean;
  canProceed: () => boolean;
  createPool: () => Promise<void>;
}

export const usePoolManagerStore = create<PoolManagerState>((set, get) => ({
  // Initial state
  currentStep: 0,
  totalSteps: 8,
  name: '',
  encryption: false,
  encryptionAlgorithm: 'AES-256-GCM',
  encryptionPassphrase: '',
  generateKey: false,
  allowDuplicateSerials: false,
  vdevGroups: [],
  availableDisks: [],
  deduplication: 'OFF',
  errors: {},

  // Initialize store
  initialize: () => {
    set({
      currentStep: 0,
      name: '',
      encryption: false,
      encryptionAlgorithm: 'AES-256-GCM',
      encryptionPassphrase: '',
      generateKey: false,
      allowDuplicateSerials: false,
      vdevGroups: [],
      deduplication: 'OFF',
      errors: {},
    });
  },

  // Reset store
  reset: () => {
    get().initialize();
  },

  // Set pool name
  setName: (name) => {
    set({ name });
    get().validate();
  },

  // Set encryption
  setEncryption: (enabled) => {
    set({ encryption: enabled });
  },

  // Set encryption algorithm
  setEncryptionAlgorithm: (algorithm) => {
    set({ encryptionAlgorithm: algorithm });
  },

  // Set encryption passphrase
  setEncryptionPassphrase: (passphrase) => {
    set({ encryptionPassphrase: passphrase });
    get().validate();
  },

  // Set generate key
  setGenerateKey: (generate) => {
    set({ generateKey: generate });
  },

  // Set allow duplicate serials
  setAllowDuplicateSerials: (allow) => {
    set({ allowDuplicateSerials: allow });
  },

  // Add VDEV
  addVdev: (type, layout) => {
    const vdevs = get().vdevs;
    set({ vdevs: [...vdevs, { id: crypto.randomUUID(), type: layout, disks: [] }] });
  },

  // Remove VDEV
  removeVdev: (id) => {
    const vdevs = get().vdevs.filter((v) => v.id !== id);
    set({ vdevs });
  },

  // Set deduplication
  setDeduplication: (dedup) => {
    set({ deduplication: dedup });
  },

  // Load available disks
  loadAvailableDisks: async () => {
    // TODO: Implement disk loading from service
    set({ availableDisks: [] });
  },

  // Validate current step
  validate: () => {
    const { name, encryption, encryptionPassphrase, generateKey, vdevs } = get();
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Pool name is required';
    }

    if (encryption && !generateKey && !encryptionPassphrase.trim()) {
      errors.passphrase = 'Passphrase is required when encryption is enabled';
    }

    if (vdevs.length === 0) {
      errors.vdevs = 'At least one data VDEV is required';
    }

    set({ errors });
    return Object.keys(errors).length === 0;
  },

  // Check if can proceed to next step
  canProceed: () => {
    const { currentStep, name, encryption, encryptionPassphrase, generateKey, vdevs } = get();

    switch (currentStep) {
      case 0: // General step
        return name.trim() && (!encryption || generateKey || encryptionPassphrase.trim());
      case 1: // Data step
        return vdevs.length > 0;
      default:
        return true;
    }
  },

  // Create pool
  createPool: async () => {
    const { name, encryption, encryptionAlgorithm, encryptionPassphrase, generateKey, allowDuplicateSerials, vdevGroups, deduplication } = get();

    if (!get().validate()) {
      throw new Error('Validation failed');
    }

    // TODO: Implement pool creation via service
    const _params = {
      name,
      encryption: encryption ? {
        algorithm: encryptionAlgorithm,
        ...(generateKey ? { generate_key: true } : { passphrase: encryptionPassphrase }),
      } : undefined,
      allow_duplicate_serials: allowDuplicateSerials,
      topology: vdevGroups,
      deduplication: deduplication,
    };

    // await poolService.create(params);
    // Debug: console.log('Creating pool:', params);
  },
}));
