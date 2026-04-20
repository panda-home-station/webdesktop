/**
 * AppWizard - Thin presentational wrapper
 *
 * All state and logic delegated to useWizard hook.
 * Renders page mode (isPage=true) or modal mode (default).
 */

import { useMemo } from 'react';

import { useWizard } from './useWizard';
import { WizardContextProvider } from './context';
import { WizardFormBody } from './FormField';
import { modalStyles, pageStyles } from './styles';
import type { WizardProps } from './types';

export function AppWizard(props: WizardProps) {
  const wizard = useWizard(props);

  // Must be called before any early returns (Rules of Hooks)
  const contextValue = useMemo(
    () => ({
      catalogApp: wizard.catalogApp,
      loading: wizard.loading,
      submitting: wizard.submitting,
      error: wizard.error,
      formValues: wizard.formValues,
      releaseName: wizard.releaseName,
      selectedVersion: wizard.selectedVersion,
      dynamicSection: wizard.dynamicSection,
      rootDynamicSection: wizard.rootDynamicSection,
      advancedFields: wizard.advancedFields,
      searchValue: wizard.searchValue,
      jobProgress: wizard.jobProgress,
      validationErrors: wizard.validationErrors,
      visibleSections: wizard.visibleSections,
      visibleAdvancedFields: wizard.visibleAdvancedFields,
      searchOptions: wizard.searchOptions,
      sectionRefs: wizard.sectionRefs,
      setFormValues: wizard.setFormValues,
      setReleaseName: wizard.setReleaseName,
      setSelectedVersion: wizard.setSelectedVersion,
      setSearchValue: wizard.setSearchValue,
      setJobProgress: wizard.setJobProgress,
      setValidationErrors: wizard.setValidationErrors,
      getNestedValue: wizard.getNestedValue,
      handleFieldChange: wizard.handleFieldChange,
      handleSubmit: wizard.handleSubmit,
      handleVersionChange: wizard.handleVersionChange,
      loadApplicationForCreation: wizard.loadApplicationForCreation,
      loadApplicationForEdit: wizard.loadApplicationForEdit,
      hasValidationError: (controlName: string) =>
        wizard.validationErrors.has(controlName),
      isFieldHidden: (field: { schema: { hidden?: boolean; show_if?: string[][] } }) =>
        wizardIsFieldHidden(field, wizard.formValues),
    }),
    [wizard]
  );

  const isNew = !props.editingApp;
  const { isPage = false, showHeader = true } = props;

  // Page mode
  if (isPage) {
    return (
      <WizardContextProvider value={contextValue}>
        <div style={pageStyles.container}>
          {showHeader && (
            <div style={pageStyles.header}>
              <div style={pageStyles.headerInfo}>
                <h2 style={pageStyles.title}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  {isNew ? '安装' : '编辑'}{' '}
                  {wizard.catalogApp?.title ||
                    props.app?.title ||
                    props.editingApp?.metadata?.title ||
                    ''}
                </h2>
                <p style={pageStyles.subtitle}>
                  {wizard.catalogApp?.description ||
                    (isNew ? `从 ${props.app?.train} 目录安装` : '更新应用配置')}
                </p>
              </div>
            </div>
          )}

          <div style={pageStyles.form}>
            <WizardFormBody ctx={contextValue} />
          </div>

          <div style={pageStyles.submitContainer}>
            <button
              type="button"
              style={{
                ...pageStyles.submitButton,
                ...(wizard.submitting ? pageStyles.submitButtonDisabled : {}),
              }}
              disabled={wizard.submitting}
              onClick={() => {
                const event = new Event('submit', { cancelable: true }) as unknown as React.FormEvent;
                wizard.handleSubmit(event);
              }}
            >
              {wizard.submitting ? (
                <>
                  <div style={pageStyles.buttonSpinner} />
                  {isNew ? '安装中...' : '保存中...'}
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  {isNew ? '开始安装' : '保存更新'}
                </>
              )}
            </button>
          </div>
        </div>
      </WizardContextProvider>
    );
  }

  // Modal mode
  return (
    <WizardContextProvider value={contextValue}>
      <div style={modalStyles.overlay} onClick={props.onClose}>
        <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div style={modalStyles.header}>
            <div style={modalStyles.headerInfo}>
              <h2 style={modalStyles.title}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {isNew ? '安装' : '编辑'}{' '}
                {wizard.catalogApp?.title ||
                  props.app?.title ||
                  props.editingApp?.metadata?.title ||
                  ''}
              </h2>
              <p style={modalStyles.subtitle}>
                {wizard.catalogApp?.description ||
                  (isNew ? `从 ${props.app?.train} 目录安装` : '更新应用配置')}
              </p>
            </div>
            <button style={modalStyles.closeButton} onClick={props.onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div style={modalStyles.form}>
            <WizardFormBody ctx={contextValue} />
          </div>

          {/* Footer */}
          {!wizard.loading && (
            <div style={modalStyles.footer}>
              <button
                type="button"
                style={modalStyles.cancelButton}
                onClick={props.onClose}
                disabled={wizard.submitting}
              >
                取消
              </button>
              <button
                type="button"
                style={{
                  ...modalStyles.submitButton,
                  ...(wizard.submitting ? modalStyles.submitButtonDisabled : {}),
                }}
                disabled={wizard.submitting}
                onClick={() => {
                  const event = new Event('submit', { cancelable: true }) as unknown as React.FormEvent;
                  wizard.handleSubmit(event);
                }}
              >
                {wizard.submitting ? (
                  <>
                    <div style={modalStyles.buttonSpinner} />
                    {isNew ? '安装中...' : '更新中...'}
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    {isNew ? '开始安装' : '保存更新'}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </WizardContextProvider>
  );
}

// Inline helper (mirrors the one in context.ts to avoid circular deps)
function wizardIsFieldHidden(
  field: { schema: { hidden?: boolean; show_if?: string[][] } },
  formValues: Record<string, unknown>
): boolean {
  if (field.schema.hidden) return true;

  if (field.schema.show_if && Array.isArray(field.schema.show_if)) {
    for (const condition of field.schema.show_if) {
      if (Array.isArray(condition) && condition.length >= 3) {
        const [fieldName, operator, value] = condition;
        const getVal = (path: string): unknown => {
          if (!path.includes('.')) return formValues[path] ?? '';
          const parts = path.split('.');
          let current: unknown = formValues[parts[0]];
          for (let i = 1; i < parts.length; i++) {
            if (current === null || current === undefined || typeof current !== 'object') return '';
            current = (current as Record<string, unknown>)[parts[i]];
          }
          return current ?? '';
        };
        const currentValue = getVal(fieldName as string);
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
