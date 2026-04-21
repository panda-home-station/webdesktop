/**
 * useWizard - Custom hook for AppWizard state and logic
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppsStore } from '@truenas/stores/apps';
import { useDockerStore, selectSelectedPool } from '@truenas/stores/docker';
import { appService } from '@truenas/services/app';
import { ChartFormValue, ChartSchemaNode } from '@truenas/types/app-types';
import { useToastStore } from '@truenas/stores/toast';

import { buildDynamicForm } from './formBuilder';
import {
  buildSetNestedValue,
  getNestedValue,
  hasValidationError,
  isFieldHidden,
  isFieldRequired,
} from './context';
import type {
  AppCreate,
  CatalogApp,
  CatalogSchema,
  DynamicSection,
  FormValues,
  WizardProps,
} from './types';

const customApp = 'ix-custom';

export function useWizard({ app, editingApp, onClose, onSuccess }: WizardProps) {
  const isNew = !editingApp;
  const { installApp, loadInstalledApps } = useAppsStore();
  const selectedPool = useDockerStore(selectSelectedPool);

  const [catalogApp, setCatalogApp] = useState<CatalogApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formValues, setFormValues] = useState<FormValues>({});
  const [releaseName, setReleaseName] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<string>('');

  const [dynamicSection, setDynamicSection] = useState<DynamicSection[]>([]);
  const [rootDynamicSection, setRootDynamicSection] = useState<DynamicSection[]>([]);
  const [advancedFields, setAdvancedFields] = useState<(ChartSchemaNode & { controlName: string })[]>([]);

  const [searchValue, setSearchValue] = useState('');
  const [jobProgress, setJobProgress] = useState<{ percent: number; description?: string } | null>(null);
  const [_forbiddenAppNames] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  const loadApplicationForCreation = useCallback(async () => {
    if (!app) return;

    setLoading(true);
    try {
      const details = await appService.getCatalogAppDetails(app.name, app.train);
      setCatalogApp(details);

      if (details.latest_version) {
        setSelectedVersion(details.latest_version);
      }

      const schemaFromVersion =
        details.versions?.[details.latest_version || '']?.schema;
      setAppForCreation(details, schemaFromVersion);
    } catch (err) {
      console.error('[AppWizard] Failed to load app:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [app]);

  const loadApplicationForEdit = useCallback(async () => {
    if (!editingApp) return;

    setLoading(true);
    try {
      const apps = await appService.get(editingApp.name);
      if (apps.length > 0) {
        setCatalogApp({
          name: apps[0].metadata?.name || apps[0].name,
          title: apps[0].metadata?.title,
          description: apps[0].metadata?.description,
          categories: apps[0].metadata?.categories || [],
          icon_url: apps[0].metadata?.icon || null,
          maintainers: apps[0].metadata?.maintainers || [],
          tags: apps[0].metadata?.tags || [],
          recommended: apps[0].metadata?.recommended || false,
          versions: {},
          latest_version: apps[0].version,
        });

        setReleaseName(editingApp.name);
        setFormValues(editingApp.config || {});
        setAppForEdit(apps[0]);
      }
    } catch (err) {
      console.error('[AppWizard] Failed to load app for edit:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingApp]);

  // ---------------------------------------------------------------------------
  // App setup helpers
  // ---------------------------------------------------------------------------

  const setAppForCreation = (
    catalog: CatalogApp,
    catalogSchema?: CatalogSchema
  ) => {
    const newRootSection: DynamicSection[] = [];
    const hideVersion = catalog.name === customApp;

    const versionKeys: string[] = [];
    Object.keys(catalog.versions || {}).forEach((versionKey) => {
      if (catalog.versions[versionKey].healthy) {
        versionKeys.push(versionKey);
      }
    });

    newRootSection.push({
      name: 'Application name',
      description: '',
      help: '',
      schema: [
        {
          controlName: 'release_name',
          type: 'input',
          title: 'Application Name',
          required: true,
          tooltip:
            'Application name must have the following: 1) Lowercase alphanumeric characters can be specified 2) Name must start with an alphabetic character and can end with alphanumeric character 3) Hyphen \'-\' is allowed but not as the first or last character',
          variable: 'release_name',
        } as ChartSchemaNode & { controlName: string },
        {
          controlName: 'version',
          type: 'select',
          title: 'Version',
          required: !hideVersion,
          options: versionKeys.map((v) => ({ value: v, label: v })),
          hidden: hideVersion,
          variable: 'version',
        } as ChartSchemaNode & { controlName: string; options: { value: string; label: string }[] },
      ],
    });

    setRootDynamicSection(newRootSection);

    if (catalog.name !== customApp) {
      setReleaseName(catalog.name);
    }

    if (catalogSchema) {
      buildFormFromSchema(catalogSchema);
    }
  };

  const setAppForEdit = (appData: { version_details?: { schema?: CatalogSchema } }) => {
    const newRootSection: DynamicSection[] = [];

    newRootSection.push({
      name: 'Application name',
      description: '',
      help: '',
      schema: [
        {
          controlName: 'release_name',
          type: 'input',
          title: 'Application Name',
          required: true,
          editable: false,
          variable: 'release_name',
        } as ChartSchemaNode & { controlName: string },
      ],
    });

    setRootDynamicSection(newRootSection);

    if (appData.version_details?.schema) {
      buildFormFromSchema(appData.version_details.schema);
    }
  };

  const buildFormFromSchema = (schema: CatalogSchema) => {
    const result = buildDynamicForm(schema);
    setDynamicSection(result.sections);
    setAdvancedFields(result.advancedFields);
    setFormValues((prev) => ({ ...prev, ...result.initialValues }));
  };

  // ---------------------------------------------------------------------------
  // Version change
  // ---------------------------------------------------------------------------

  const handleVersionChange = useCallback(
    (version: string) => {
      setSelectedVersion(version);
      if (catalogApp?.versions?.[version]?.schema) {
        buildFormFromSchema(catalogApp.versions[version].schema);
      }
    },
    [catalogApp]
  );

  // ---------------------------------------------------------------------------
  // Field change
  // ---------------------------------------------------------------------------

  const handleFieldChange = useCallback((name: string, value: ChartFormValue) => {
    setFormValues((prev) => buildSetNestedValue(prev, name, value));
  }, []);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validateRequiredFields = useCallback(() => {
    const missingFields: string[] = [];
    const errorControlNames: string[] = [];

    const isEmpty = (value: ChartFormValue): boolean => {
      if (value === null || value === undefined) return true;
      if (typeof value === 'string' && value.trim() === '') return true;
      if (Array.isArray(value) && value.length === 0) return true;
      if (typeof value === 'object' && Object.keys(value).length === 0) return true;
      return false;
    };

    const checkField = (
      field: ChartSchemaNode & { controlName?: string }
    ) => {
      if (isFieldHidden(field, formValues)) return;

      if (field.schema.type === 'dict' && field.schema.attrs) {
        field.schema.attrs.forEach((attr) => {
          checkField({
            ...attr,
            controlName: field.controlName
              ? `${field.controlName}.${attr.variable}`
              : attr.variable,
          });
        });
        return;
      }

      if (field.schema.type === 'list') return;

      if (isFieldRequired(field)) {
        const value = field.controlName
          ? getNestedValue(formValues, field.controlName)
          : formValues[field.variable];
        if (isEmpty(value)) {
          missingFields.push(field.label || field.variable);
          if (field.controlName) {
            errorControlNames.push(field.controlName);
          }
        }
      }
    };

    visibleSections.forEach((section) => {
      section.schema.forEach((field) => checkField(field));
    });

    visibleAdvancedFields.forEach((field) => checkField(field));

    return {
      valid: missingFields.length === 0,
      missingFields,
      errorControlNames,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues, dynamicSection, advancedFields]);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!catalogApp) {
        return;
      }

      const namePattern = /^[a-z]([a-z0-9-]*[a-z0-9])?$/;
      if (!namePattern.test(releaseName)) {
        useToastStore.getState().showError(
          '应用名称格式不正确，请使用小写字母、数字和连字符，以字母开头'
        );
        return;
      }

      if (!selectedPool) {
        useToastStore.getState().showError('请先配置应用池');
        return;
      }

      const validation = validateRequiredFields();
      if (!validation.valid) {
        setValidationErrors(new Set(validation.errorControlNames));
        useToastStore.getState().showError(
          `请填写必填项: ${validation.missingFields.join(', ')}`
        );
        // Scroll to first error field
        const firstErrorControlName = validation.errorControlNames[0];
        setTimeout(() => {
          const errorEl = document.querySelector(`[data-control-name="${firstErrorControlName}"]`);
          if (errorEl) {
            errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        return;
      }
      setValidationErrors(new Set());

      setSubmitting(true);
      setJobProgress({
        percent: 0,
        description: isNew ? '正在安装...' : '正在更新...',
      });

      try {
        const version = selectedVersion || catalogApp.latest_version;

        if (isNew) {
          await installApp({
            app_name: releaseName,
            catalog_app: catalogApp.name,
            train: app?.train || 'stable',
            version,
            values: formValues,
          } as AppCreate);
        } else {
          useToastStore.getState().showError('更新功能尚未实现');
          setSubmitting(false);
          setJobProgress(null);
        }
      } catch (err) {
        setError((err as Error).message);
        setSubmitting(false);
        setJobProgress(null);
        useToastStore.getState().showError(`安装失败: ${(err as Error).message}`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      catalogApp,
      releaseName,
      selectedVersion,
      formValues,
      selectedPool,
      isNew,
      app,
      validateRequiredFields,
    ]
  );

  // ---------------------------------------------------------------------------
  // Job subscription
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const unsubscribe = appService.subscribeJobs((event) => {
      if (
        event.fields.method === 'app.create' ||
        event.fields.method === 'app.update'
      ) {
        const args = event.fields.arguments as [unknown];
        const appNameFromJob =
          args[0] && typeof args[0] === 'object' && 'app_name' in args[0]
            ? (args[0] as { app_name: string }).app_name
            : null;

        if (appNameFromJob === releaseName || event.fields.method === 'app.update') {
          if (event.fields.result) {
            const result = event.fields.result as {
              state?: string;
              progress?: { percent: number; description?: string };
              error?: string;
            };

            if (result.state === 'SUCCESS') {
              setJobProgress({ percent: 100, description: '安装完成' });
              useToastStore.getState().showSuccess(
                isNew ? '应用安装成功' : '应用更新成功'
              );
              setTimeout(() => {
                loadInstalledApps();
                onSuccess();
                onClose();
              }, 1000);
            } else if (result.state === 'FAILED') {
              setSubmitting(false);
              setJobProgress(null);
              useToastStore
                .getState()
                .error(`操作失败: ${result.error || '未知错误'}`);
            } else if (result.progress) {
              setJobProgress(result.progress);
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, [releaseName, isNew, onSuccess, onClose, loadInstalledApps]);

  // ---------------------------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isNew) {
      loadApplicationForCreation();
    } else {
      loadApplicationForEdit();
    }
  }, [isNew, loadApplicationForCreation, loadApplicationForEdit]);

  // ---------------------------------------------------------------------------
  // Search navigation
  // ---------------------------------------------------------------------------

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      const section = dynamicSection.find((s) =>
        s.name.toLowerCase().includes(value.toLowerCase())
      );
      if (section && sectionRefs.current[section.name]) {
        sectionRefs.current[section.name]?.scrollIntoView({ block: 'center' });
      }
    },
    [dynamicSection]
  );

  // ---------------------------------------------------------------------------
  // Search options
  // ---------------------------------------------------------------------------

  const searchOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    dynamicSection.forEach((section) => {
      options.push({ value: section.name, label: section.name });
      section.schema.forEach((field) => {
        options.push({
          value: `${section.name}.${field.variable}`,
          label: field.label || field.variable,
        });
      });
    });
    return options;
  }, [dynamicSection]);

  // ---------------------------------------------------------------------------
  // Visible fields (filtered by show_if)
  // ---------------------------------------------------------------------------

  const visibleSections = useMemo(
    () =>
      dynamicSection
        .map((section) => ({
          ...section,
          schema: section.schema.filter((field) => !isFieldHidden(field, formValues)),
        }))
        .filter((section) => section.schema.length > 0),
    [dynamicSection, formValues]
  );

  const visibleAdvancedFields = useMemo(
    () => advancedFields.filter((field) => !isFieldHidden(field, formValues)),
    [advancedFields, formValues]
  );

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------

  const contextValue = useMemo(
    () => ({
      // State
      catalogApp,
      loading,
      submitting,
      error,
      formValues,
      releaseName,
      selectedVersion,
      dynamicSection,
      rootDynamicSection,
      advancedFields,
      searchValue,
      jobProgress,
      validationErrors,
      // Derived
      visibleSections,
      visibleAdvancedFields,
      searchOptions,
      sectionRefs,
      // Actions
      setFormValues,
      setReleaseName,
      setSelectedVersion,
      setSearchValue: handleSearchChange,
      setJobProgress,
      setValidationErrors,
      getNestedValue: (path: string, fallback?: ChartFormValue) =>
        getNestedValue(formValues, path, fallback),
      handleFieldChange,
      handleSubmit,
      handleVersionChange,
      loadApplicationForCreation,
      loadApplicationForEdit,
      hasValidationError: (controlName: string) =>
        hasValidationError(controlName, validationErrors),
      isFieldHidden: (field: ChartSchemaNode) =>
        isFieldHidden(field, formValues),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      catalogApp,
      loading,
      submitting,
      error,
      formValues,
      releaseName,
      selectedVersion,
      dynamicSection,
      rootDynamicSection,
      advancedFields,
      searchValue,
      jobProgress,
      validationErrors,
      visibleSections,
      visibleAdvancedFields,
      searchOptions,
      handleFieldChange,
      handleSubmit,
      handleVersionChange,
      handleSearchChange,
      formValues,
      validationErrors,
    ]
  );

  return contextValue;
}
