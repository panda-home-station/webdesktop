/**
 * AppWizard Types
 */

import { AvailableApp, CatalogApp, ChartFormValue, ChartSchemaNode, App } from '@truenas/types/app-types';

export interface DynamicSection {
  name: string;
  description: string;
  help: string;
  schema: (ChartSchemaNode & { controlName: string })[];
}

export interface WizardProps {
  app?: AvailableApp;
  editingApp?: App;
  onClose: () => void;
  onSuccess: () => void;
  isPage?: boolean;
  showHeader?: boolean;
}

export type FormValues = Record<string, ChartFormValue>;

export interface WizardState {
  catalogApp: CatalogApp | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  formValues: FormValues;
  releaseName: string;
  selectedVersion: string;
  dynamicSection: DynamicSection[];
  rootDynamicSection: DynamicSection[];
  advancedFields: (ChartSchemaNode & { controlName: string })[];
  searchValue: string;
  jobProgress: { percent: number; description?: string } | null;
  validationErrors: Set<string>;
}

export interface WizardActions {
  setFormValues: (values: FormValues) => void;
  setReleaseName: (name: string) => void;
  setSelectedVersion: (version: string) => void;
  setSearchValue: (value: string) => void;
  setJobProgress: (progress: { percent: number; description?: string } | null) => void;
  setValidationErrors: (errors: Set<string>) => void;
  getNestedValue: (path: string, fallback?: ChartFormValue) => ChartFormValue;
  handleFieldChange: (name: string, value: ChartFormValue) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleVersionChange: (version: string) => void;
  loadApplicationForCreation: () => Promise<void>;
  loadApplicationForEdit: () => Promise<void>;
  hasValidationError: (controlName: string) => boolean;
  isFieldHidden: (field: ChartSchemaNode) => boolean;
}

export type WizardContextValue = WizardState & WizardActions;

export interface BuildDynamicFormResult {
  sections: DynamicSection[];
  advancedFields: (ChartSchemaNode & { controlName: string })[];
  initialValues: FormValues;
}

export interface CatalogSchema {
  groups?: { name: string; description: string }[];
  questions?: ChartSchemaNode[];
}
