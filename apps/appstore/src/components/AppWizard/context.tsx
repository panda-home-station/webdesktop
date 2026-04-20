/**
 * Wizard Context - provides form helpers to nested field components
 */

import React, { createContext, useContext } from 'react';
import { ChartFormValue, ChartSchemaNode } from '@truenas/types/app-types';
import type { FormValues, WizardContextValue } from './types';

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizardContext(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) {
    throw new Error('useWizardContext must be used within WizardContextProvider');
  }
  return ctx;
}

interface ProviderProps {
  value: WizardContextValue;
  children: React.ReactNode;
}

export function WizardContextProvider({ value, children }: ProviderProps) {
  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Helper functions (used by context value and also exported for direct use)
// ---------------------------------------------------------------------------

export function getNestedValue(
  formValues: FormValues,
  path: string,
  fallback: ChartFormValue = ''
): ChartFormValue {
  if (!path.includes('.')) {
    return formValues[path] ?? fallback;
  }
  const parts = path.split('.');
  let current: ChartFormValue = formValues[parts[0]];
  for (let i = 1; i < parts.length; i++) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== 'object'
    ) {
      return fallback;
    }
    current = (current as Record<string, ChartFormValue>)[parts[i]];
  }
  return current ?? fallback;
}

export function isFieldHidden(
  field: ChartSchemaNode,
  formValues: FormValues
): boolean {
  if (field.schema.hidden) return true;

  if (field.schema.show_if && Array.isArray(field.schema.show_if)) {
    for (const condition of field.schema.show_if) {
      if (Array.isArray(condition) && condition.length >= 3) {
        const [fieldName, operator, value] = condition;
        const currentValue = getNestedValue(formValues, fieldName as string);
        if (operator === '=') {
          if (currentValue !== value) return true;
        } else if (operator === '!=') {
          if (currentValue === value) return true;
        }
      }
    }
  }

  return false;
}

export function hasValidationError(
  controlName: string,
  validationErrors: Set<string>
): boolean {
  return validationErrors.has(controlName);
}

export function isFieldRequired(field: ChartSchemaNode): boolean {
  return (
    field.schema.required ||
    (field.schema.empty !== undefined && !field.schema.empty)
  );
}

export function buildSetNestedValue(
  formValues: FormValues,
  name: string,
  value: ChartFormValue
): FormValues {
  const newValues = { ...formValues };

  if (name.includes('.')) {
    const parts = name.split('.');
    const root = parts[0];

    if (!(root in newValues) || typeof newValues[root] !== 'object') {
      newValues[root] = {};
    }

    const setNested = (
      obj: Record<string, ChartFormValue>,
      path: string[],
      val: ChartFormValue
    ) => {
      if (path.length === 1) {
        obj[path[0]] = val;
        return;
      }
      const key = path[0];
      if (!(key in obj) || typeof obj[key] !== 'object') {
        obj[key] = {};
      }
      setNested(obj[key] as Record<string, ChartFormValue>, path.slice(1), val);
    };

    setNested(newValues[root] as Record<string, ChartFormValue>, parts.slice(1), value);
  } else {
    newValues[name] = value;
  }

  return newValues;
}
