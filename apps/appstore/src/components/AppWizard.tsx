/**
 * App Wizard Component
 * Ported from webui's AppWizardComponent
 * Handles app installation and editing with dynamic form generation
 */

import { useEffect, useState, useRef, useCallback, useMemo, Fragment } from 'react';
import { useAppsStore } from '@truenas/stores/apps';
import { useDockerStore } from '@truenas/stores/docker';
import { appService } from '@truenas/services/app';
import { AvailableApp, CatalogApp, ChartFormValue, ChartSchemaNode, AppCreate, App } from '@truenas/types/app-types';
import { useToastStore } from '@truenas/stores/toast';

interface AppWizardProps {
  app?: AvailableApp;
  editingApp?: App;
  onClose: () => void;
  onSuccess: () => void;
  isPage?: boolean;
  showHeader?: boolean;
}

interface DynamicSection {
  name: string;
  description: string;
  help: string;
  schema: ChartSchemaNode[];
}

type FormValues = Record<string, ChartFormValue>;

const customApp = 'ix-custom';

// Page mode styles
const pageStyles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#f5f5f7',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '24px 24px 20px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
    backgroundColor: '#ffffff',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 20,
    fontWeight: 700,
    color: '#1d1d1f',
    margin: 0,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
  },
  subtitle: {
    fontSize: 13,
    color: '#86868b',
    margin: '6px 0 0 30px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 24px',
    backgroundColor: '#f5f5f7',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0, 113, 227, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0071e3',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: 12,
    color: '#86868b',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    minWidth: 80,
    textAlign: 'right' as const,
  },
  form: {
    flex: 1,
    padding: 24,
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    color: '#86868b',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid rgba(0, 0, 0, 0.1)',
    borderTopColor: '#0071e3',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: 12,
  },
  errorState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 12,
    padding: 32,
    color: '#ff3b30',
    textAlign: 'center' as const,
  },
  appInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 24,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#f5f5f7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  appIconImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain' as const,
  },
  appMeta: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  appVersion: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1d1d1f',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
  },
  appTrain: {
    fontSize: 13,
    color: '#86868b',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: '10px 14px',
    gap: 10,
    border: '1px solid rgba(0, 0, 0, 0.08)',
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: 14,
    outline: 'none',
    color: '#1d1d1f',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  submitContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '16px 0',
    marginTop: 24,
    borderTop: '1px solid rgba(0, 0, 0, 0.08)',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 32px',
    fontSize: 15,
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#0071e3',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(0, 113, 227, 0.3)',
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  buttonSpinner: {
    width: 14,
    height: 14,
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

export function AppWizard({ app, editingApp, onClose, onSuccess, isPage = false, showHeader = true }: AppWizardProps) {
  const isNew = !editingApp;
  const { installApp, loadInstalledApps } = useAppsStore();
  const { selectedPool } = useDockerStore();

  const [catalogApp, setCatalogApp] = useState<CatalogApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formValues, setFormValues] = useState<FormValues>({});
  const [releaseName, setReleaseName] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<string>('');

  // Dynamic form sections
  const [dynamicSection, setDynamicSection] = useState<DynamicSection[]>([]);
  const [rootDynamicSection, setRootDynamicSection] = useState<DynamicSection[]>([]);

  // Advanced fields (have defaults or not required)
  const [advancedFields, setAdvancedFields] = useState<(ChartSchemaNode & { controlName: string })[]>([]);

  // Search state
  const [searchValue, setSearchValue] = useState('');

  // Job progress
  const [jobProgress, setJobProgress] = useState<{ percent: number; description?: string } | null>(null);

  // Forbidden app names for validation
  const [forbiddenAppNames, setForbiddenAppNames] = useState<string[]>([]);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Load catalog app details for new installation
  const loadApplicationForCreation = useCallback(async () => {
    if (!app) return;

    setLoading(true);
    try {
      const details = await appService.getCatalogAppDetails(app.name, app.train);
      setCatalogApp(details);

      // Get all installed app names for forbidden validation
      const allApps = await appService.query();
      setForbiddenAppNames(allApps.map((a) => a.name));

      // Set initial version
      if (details.latest_version) {
        setSelectedVersion(details.latest_version);
      }

      // Build the form - webui constructs schema from versions[latest_version].schema
      const schemaFromVersion = details.versions?.[details.latest_version || '']?.schema;
      setAppForCreation(details, schemaFromVersion);
    } catch (err) {
      console.error('[AppWizard] Failed to load app:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [app]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load app for editing
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
  }, [editingApp]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set up app for creation
  // Note: webui constructs schema from versions[latest_version].schema
  const setAppForCreation = (catalog: CatalogApp, catalogSchema?: ChartSchema) => {
    const newRootSection: DynamicSection[] = [];
    const hideVersion = catalog.name === customApp;

    // Get healthy versions
    const versionKeys: string[] = [];
    Object.keys(catalog.versions || {}).forEach((versionKey) => {
      if (catalog.versions[versionKey].healthy) {
        versionKeys.push(versionKey);
      }
    });

    // Build name group
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
          tooltip: 'Application name must have the following: 1) Lowercase alphanumeric characters can be specified 2) Name must start with an alphabetic character and can end with alphanumeric character 3) Hyphen \'-\' is allowed but not as the first or last character',
          variable: 'release_name',
        },
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

    // Set initial release name
    if (catalog.name !== customApp) {
      setReleaseName(catalog.name);
      // Check if name is forbidden
      const isForbidden = forbiddenAppNames.includes(catalog.name);
      if (isForbidden) {
        // Name will be auto-generated or user must change
      }
    }

    // Build dynamic form from version schema
    if (catalogSchema) {
      buildDynamicForm(catalogSchema);
    }
  };

  // Set up app for editing
  const setAppForEdit = (appData: App) => {
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
        },
      ],
    });

    setRootDynamicSection(newRootSection);

    if (appData.version_details?.schema) {
      buildDynamicForm(appData.version_details.schema);
    }
  };

  // Build dynamic form from schema
  const buildDynamicForm = (schema: { groups: { name: string; description: string }[]; questions: ChartSchemaNode[] }) => {
    const sections: DynamicSection[] = [];

    // Add groups
    schema.groups?.forEach((group) => {
      sections.push({
        name: group.name,
        description: group.description,
        help: group.description,
        schema: [],
      });
    });

    // Separate basic and advanced fields
    const advanced: (ChartSchemaNode & { controlName: string })[] = [];

    // Collect all questions first, then post-process sections
    const questionsByGroup: Record<string, (ChartSchemaNode & { controlName: string })[]> = {};

    // Build a mapping from variable to controlName for show_if resolution
    // This is done in TWO PASSES to ensure all mappings are available before transforming show_if

    // First pass: collect all top-level questions
    const topLevelVariables: string[] = [];
    schema.questions?.forEach((question) => {
      topLevelVariables.push(question.variable);
    });

    // First pass: build initial mapping for top-level questions
    const variableToControlName: Record<string, string> = {};
    topLevelVariables.forEach((variable) => {
      variableToControlName[variable] = variable;
    });

    // First pass: identify dict fields and their attrs
    const dictFields: { dictField: ChartSchemaNode; attrs: ChartSchemaNode[] }[] = [];
    schema.questions?.forEach((question) => {
      if (question.schema.type === 'dict' && question.schema.attrs) {
        dictFields.push({ dictField: question, attrs: question.schema.attrs });
        // Add dict attrs to mapping
        question.schema.attrs.forEach((attr) => {
          variableToControlName[attr.variable] = `${question.variable}.${attr.variable}`;
        });
      }
    });

    // Helper to transform show_if to use controlName paths
    const transformShowIf = (showIf: string[][] | undefined): string[][] | undefined => {
      if (!showIf) return undefined;
      return showIf.map((condition: string[]) => {
        if (Array.isArray(condition) && condition.length >= 3) {
          const [fieldName, operator, value] = condition;
          // Use the controlName path if available, otherwise use the original fieldName
          const resolvedFieldName = variableToControlName[fieldName] || fieldName;
          return [resolvedFieldName, operator, value];
        }
        return condition;
      });
    };

    // Second pass: add questions to groups with transformed show_if
    schema.questions?.forEach((question) => {
      const groupName = question.group || '';
      const controlName = variableToControlName[question.variable];

      const transformedQuestion = {
        ...question,
        controlName,
        schema: {
          ...question.schema,
          show_if: transformShowIf(question.schema.show_if),
        },
      };

      // Check if field should be in advanced settings
      const isAdvancedField = isFieldAdvanced(transformedQuestion);

      if (isAdvancedField) {
        advanced.push(transformedQuestion);
      } else {
        if (!questionsByGroup[groupName]) {
          questionsByGroup[groupName] = [];
        }
        questionsByGroup[groupName].push(transformedQuestion);
      }
    });

    // Process sections: expand single dict fields
    sections.forEach((section) => {
      const groupQuestions = questionsByGroup[section.name] || [];

      // If section has only one dict field, expand its attrs
      if (groupQuestions.length === 1 && groupQuestions[0].schema.type === 'dict') {
        const dictField = groupQuestions[0];
        const attrs = dictField.schema.attrs || [];
        // Add all attrs as fields with the dict's variable as prefix for nested values
        attrs.forEach((attr) => {
          const attrControlName = `${dictField.variable}.${attr.variable}`;

          section.schema.push({
            ...attr,
            controlName: attrControlName,
            // Store original variable for nested rendering
            originalVariable: attr.variable,
            schema: {
              ...attr.schema,
              show_if: transformShowIf(attr.schema.show_if),
            },
          } as ChartSchemaNode & { controlName: string });
        });
      } else {
        section.schema.push(...groupQuestions);
      }
    });

    // Filter out empty sections
    const filteredSections = sections.filter((s) => s.schema.length > 0);
    setDynamicSection(filteredSections);
    setAdvancedFields(advanced);

    // Initialize form values from schema defaults (including nested dict defaults)
    const initialValues: FormValues = {};

    // Helper to recursively extract defaults from questions
    const extractDefaults = (questions: ChartSchemaNode[], parentPath: string = '') => {
      questions.forEach((q) => {
        const fullPath = parentPath ? `${parentPath}.${q.variable}` : q.variable;

        if (q.schema.type === 'dict' && q.schema.attrs) {
          // For dict type, recursively extract defaults from attrs
          extractDefaults(q.schema.attrs, fullPath);
        } else if (q.schema.default !== undefined) {
          // Set the default value using nested path
          if (!fullPath.includes('.')) {
            initialValues[fullPath] = q.schema.default as ChartFormValue;
          } else {
            // Handle nested path like "openclaw.auth_mode"
            const parts = fullPath.split('.');
            let current: Record<string, ChartFormValue> = initialValues;
            for (let i = 0; i < parts.length - 1; i++) {
              if (!(parts[i] in current)) {
                current[parts[i]] = {};
              }
              current = current[parts[i]] as Record<string, ChartFormValue>;
            }
            current[parts[parts.length - 1]] = q.schema.default as ChartFormValue;
          }
        }
      });
    };

    extractDefaults(schema.questions || []);
    setFormValues((prev) => ({ ...prev, ...initialValues }));
  };

  // Handle version change
  const handleVersionChange = (version: string) => {
    setSelectedVersion(version);
    if (catalogApp?.versions?.[version]?.schema) {
      buildDynamicForm(catalogApp.versions[version].schema);
    }
  };

  // Get nested value from formValues using dot notation path (e.g., "openclaw.trusted_proxies")
  const getNestedValue = (path: string, fallback: ChartFormValue = ''): ChartFormValue => {
    if (!path.includes('.')) {
      return formValues[path] ?? fallback;
    }
    const parts = path.split('.');
    let current: ChartFormValue = formValues[parts[0]];
    for (let i = 1; i < parts.length; i++) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return fallback;
      }
      current = (current as Record<string, ChartFormValue>)[parts[i]];
    }
    return current ?? fallback;
  };

  // Handle field change with nested path support (e.g., "openclaw.trusted_proxies")
  const handleFieldChange = (name: string, value: ChartFormValue) => {
    setFormValues((prev) => {
      const newValues = { ...prev };

      if (name.includes('.')) {
        const parts = name.split('.');
        const root = parts[0];
        const rest = parts.slice(1).join('.');

        // Initialize root if needed
        if (!(root in newValues) || typeof newValues[root] !== 'object') {
          newValues[root] = {};
        }

        // Create nested path
        const setNested = (obj: Record<string, ChartFormValue>, path: string[], val: ChartFormValue) => {
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

        setNested(newValues[root] as Record<string, ChartFormValue>, rest.split('.'), value);
      } else {
        newValues[name] = value;
      }

      return newValues;
    });
  };

  // Subscribe to job updates
  useEffect(() => {
    const unsubscribe = appService.subscribeJobs((event) => {
      if (event.fields.method === 'app.create' || event.fields.method === 'app.update') {
        const args = event.fields.arguments as [unknown];
        const appNameFromJob = args[0] && typeof args[0] === 'object' && 'app_name' in args[0]
          ? (args[0] as { app_name: string }).app_name
          : null;

        if (appNameFromJob === releaseName || event.fields.method === 'app.update') {
          if (event.fields.result) {
            const result = event.fields.result as { state?: string; progress?: { percent: number; description?: string }; error?: string };

            if (result.state === 'SUCCESS') {
              setJobProgress({ percent: 100, description: '安装完成' });
              useToastStore.getState().success(isNew ? '应用安装成功' : '应用更新成功');
              setTimeout(() => {
                loadInstalledApps();
                onSuccess();
                onClose();
              }, 1000);
            } else if (result.state === 'FAILED') {
              setSubmitting(false);
              setJobProgress(null);
              useToastStore.getState().error(`操作失败: ${result.error || '未知错误'}`);
            } else if (result.progress) {
              setJobProgress(result.progress);
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, [releaseName, isNew, onSuccess, onClose, loadInstalledApps]);

  // Initial load
  useEffect(() => {
    if (isNew) {
      loadApplicationForCreation();
    } else {
      loadApplicationForEdit();
    }
  }, [isNew, loadApplicationForCreation, loadApplicationForEdit]);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!catalogApp) return;

    // Validate release name
    const namePattern = /^[a-z]([a-z0-9-]*[a-z0-9])?$/;
    if (!namePattern.test(releaseName)) {
      useToastStore.getState().error('应用名称格式不正确，请使用小写字母、数字和连字符，以字母开头');
      return;
    }

    // Check if pool is set
    if (!selectedPool) {
      useToastStore.getState().error('请先配置应用池');
      return;
    }

    setSubmitting(true);
    setJobProgress({ percent: 0, description: isNew ? '正在安装...' : '正在更新...' });

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
        // For update, we'd call app.update
        // await appService.update(releaseName, { values: formValues });
        useToastStore.getState().error('更新功能尚未实现');
        setSubmitting(false);
        setJobProgress(null);
      }
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
      setJobProgress(null);
      useToastStore.getState().error(`安装失败: ${(err as Error).message}`);
    }
  };

  // Navigate to section on search
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    const section = dynamicSection.find(
      (s) => s.name.toLowerCase().includes(value.toLowerCase())
    );
    if (section && sectionRefs.current[section.name]) {
      sectionRefs.current[section.name]?.scrollIntoView({ block: 'center' });
    }
  };

  // Get search options for autocomplete
  const getSearchOptions = () => {
    const options: { value: string; label: string }[] = [];
    dynamicSection.forEach((section) => {
      options.push({ value: section.name, label: section.name });
      section.schema.forEach((field) => {
        options.push({ value: `${section.name}.${field.variable}`, label: field.label || field.variable });
      });
    });
    return options;
  };

  // Render list field (ix-list equivalent)
  const renderListField = (field: ChartSchemaNode & { controlName: string }) => {
    const items = (getNestedValue(field.controlName) as ChartFormValue[]) || [];
    const itemsSchema = field.schema.items || [];

    const handleAddItem = () => {
      const newItems = [...items];
      // For simple types, add empty string. For dict types, add empty object.
      if (itemsSchema.length > 0) {
        const firstItem = itemsSchema[0];
        if (firstItem.schema.type === 'dict') {
          const emptyObj: Record<string, ChartFormValue> = {};
          (firstItem.schema.attrs || []).forEach((attr: ChartSchemaNode) => {
            emptyObj[attr.variable] = attr.schema.default ?? '';
          });
          newItems.push(emptyObj);
        } else {
          newItems.push('');
        }
      } else {
        newItems.push('');
      }
      handleFieldChange(field.controlName, newItems);
    };

    const handleRemoveItem = (index: number) => {
      const newItems = items.filter((_, i) => i !== index);
      handleFieldChange(field.controlName, newItems);
    };

    const handleItemChange = (index: number, value: ChartFormValue) => {
      const newItems = [...items];
      newItems[index] = value;
      handleFieldChange(field.controlName, newItems);
    };

    return (
      <div style={styles.listContainer}>
        {items.length === 0 && (
          <span style={styles.listEmpty}>尚未添加任何项目。</span>
        )}
        {items.map((item, index) => (
          <div key={index} style={styles.listItem}>
            {itemsSchema.length > 0 && itemsSchema[0].schema.type === 'dict' ? (
              // Dict type items
              <div style={styles.listItemContent}>
                {(itemsSchema[0].schema.attrs || []).map((attr: ChartSchemaNode) => {
                  const itemObj = item as Record<string, ChartFormValue>;
                  const attrValue = itemObj[attr.variable] ?? attr.schema.default ?? '';
                  return (
                    <div key={attr.variable} style={styles.listItemField}>
                      <label style={styles.listItemLabel}>
                        {attr.label || attr.variable}
                        {attr.schema.required && <span style={styles.required}>*</span>}
                      </label>
                      {renderListItemField(attr, attrValue, (val) => {
                        const newItems = [...items];
                        const newItem = { ...(newItems[index] as Record<string, ChartFormValue>) };
                        newItem[attr.variable] = val;
                        newItems[index] = newItem;
                        handleFieldChange(field.controlName, newItems);
                      })}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Simple type items (string, number, etc.)
              <div style={styles.listItemSimple}>
                <input
                  type="text"
                  value={item as string}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  style={styles.listItemInput}
                  placeholder={field.label}
                />
              </div>
            )}
            <button
              type="button"
              style={styles.listItemDelete}
              onClick={() => handleRemoveItem(index)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        ))}
        <button
          type="button"
          style={styles.listAddButton}
          onClick={handleAddItem}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          添加 {field.label}
        </button>
      </div>
    );
  };

  // Render field for list item
  const renderListItemField = (
    schema: ChartSchemaNode,
    value: ChartFormValue,
    onChange: (value: ChartFormValue) => void
  ) => {
    // String type with enum should render as select dropdown
    if (schema.schema.type === 'string' && schema.schema.enum) {
      return (
        <select
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          style={styles.select}
        >
          <option value="">选择...</option>
          {schema.schema.enum.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.description || opt.value}
            </option>
          ))}
        </select>
      );
    }

    switch (schema.schema.type) {
      case 'string':
      case 'hostname':
      case 'ipaddr':
      case 'cidr':
        return (
          <input
            type={schema.schema.private ? 'password' : 'text'}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            style={styles.input}
            placeholder={schema.label}
          />
        );
      case 'int':
      case 'number':
        return (
          <input
            type="number"
            value={value as number}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            style={styles.input}
            min={schema.schema.min as number}
            max={schema.schema.max as number}
            placeholder={schema.label}
          />
        );
      case 'boolean':
        return (
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => onChange(e.target.checked)}
              style={styles.checkbox}
            />
            <span>{schema.description || schema.label}</span>
          </label>
        );
      case 'select':
        return (
          <select
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            style={styles.select}
          >
            <option value="">选择...</option>
            {schema.schema.enum?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.description || opt.value}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            style={styles.input}
            placeholder={schema.label}
          />
        );
    }
  };

  // Render nested form fields (for dict attrs)
  const renderNestedField = (nestedField: ChartSchemaNode) => {
    const value = formValues[nestedField.variable] ?? nestedField.schema.default ?? '';

    // String type with enum should render as select dropdown
    if (nestedField.schema.type === 'string' && nestedField.schema.enum) {
      return (
        <select
          value={value as string}
          onChange={(e) => handleFieldChange(nestedField.variable, e.target.value)}
          style={styles.select}
        >
          <option value="">选择...</option>
          {nestedField.schema.enum.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.description || opt.value}
            </option>
          ))}
        </select>
      );
    }

    switch (nestedField.schema.type) {
      case 'string':
      case 'hostname':
      case 'ipaddr':
      case 'cidr':
        return (
          <input
            type={nestedField.schema.private ? 'password' : 'text'}
            value={value as string}
            onChange={(e) => handleFieldChange(nestedField.variable, e.target.value)}
            style={styles.input}
            placeholder={nestedField.label}
          />
        );

      case 'int':
      case 'number':
        return (
          <input
            type="number"
            value={value as number}
            onChange={(e) => handleFieldChange(nestedField.variable, parseInt(e.target.value) || 0)}
            style={styles.input}
            min={nestedField.schema.min as number}
            max={nestedField.schema.max as number}
            placeholder={nestedField.label}
          />
        );

      case 'boolean':
        return (
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => handleFieldChange(nestedField.variable, e.target.checked)}
              style={styles.checkbox}
            />
            <span>{nestedField.description || nestedField.label}</span>
          </label>
        );

      case 'select':
        return (
          <select
            value={value as string}
            onChange={(e) => handleFieldChange(nestedField.variable, e.target.value)}
            style={styles.select}
          >
            <option value="">选择...</option>
            {nestedField.schema.enum?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.description || opt.value}
              </option>
            ))}
          </select>
        );

      case 'list':
        return renderListField({ ...nestedField, controlName: nestedField.variable } as ChartSchemaNode & { controlName: string });

      case 'dict':
        return (
          <div style={styles.dictContainer}>
            {(nestedField.schema.attrs || []).map((attr: ChartSchemaNode) => (
              <div key={attr.variable} style={styles.nestedFormGroup}>
                <label style={styles.nestedLabel}>
                  {attr.label || attr.variable}
                  {(attr.schema.required || (attr.schema.empty !== undefined && !attr.schema.empty)) && (
                    <span style={styles.required}>*</span>
                  )}
                </label>
                {attr.description && (
                  <p style={styles.nestedDescription}>{attr.description}</p>
                )}
                {renderNestedField(attr)}
              </div>
            ))}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => handleFieldChange(nestedField.variable, e.target.value)}
            style={styles.input}
            placeholder={nestedField.label}
          />
        );
    }
  };

  // Render form field based on schema type
  const renderFormField = (field: ChartSchemaNode & { controlName: string }) => {
    const value = getNestedValue(field.controlName, field.schema.default ?? '');

    // String type with enum should render as select dropdown
    if (field.schema.type === 'string' && field.schema.enum) {
      return (
        <select
          value={value as string}
          onChange={(e) => handleFieldChange(field.controlName, e.target.value)}
          style={styles.select}
        >
          <option value="">选择...</option>
          {field.schema.enum.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.description || opt.value}
            </option>
          ))}
        </select>
      );
    }

    switch (field.schema.type) {
      case 'string':
      case 'hostname':
      case 'ipaddr':
      case 'cidr':
        return (
          <input
            type={field.schema.private ? 'password' : 'text'}
            value={value as string}
            onChange={(e) => handleFieldChange(field.controlName, e.target.value)}
            style={styles.input}
            placeholder={field.label}
          />
        );

      case 'int':
      case 'number':
        return (
          <input
            type="number"
            value={value as number}
            onChange={(e) => handleFieldChange(field.controlName, parseInt(e.target.value) || 0)}
            style={styles.input}
            min={field.schema.min as number}
            max={field.schema.max as number}
            placeholder={field.label}
          />
        );

      case 'boolean':
        return (
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => handleFieldChange(field.controlName, e.target.checked)}
              style={styles.checkbox}
            />
            <span>{field.description || field.label}</span>
          </label>
        );

      case 'select':
        return (
          <select
            value={value as string}
            onChange={(e) => handleFieldChange(field.controlName, e.target.value)}
            style={styles.select}
          >
            <option value="">选择...</option>
            {field.schema.enum?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.description || opt.value}
              </option>
            ))}
          </select>
        );

      case 'dict':
        // Render dict's attrs as nested fields
        return (
          <div style={styles.dictContainer}>
            {(field.schema.attrs || []).map((nestedField) => (
              <div key={nestedField.variable} style={styles.nestedFormGroup}>
                <label style={styles.nestedLabel}>
                  {nestedField.label || nestedField.variable}
                  {(nestedField.schema.required || (nestedField.schema.empty !== undefined && !nestedField.schema.empty)) && (
                    <span style={styles.required}>*</span>
                  )}
                </label>
                {nestedField.description && (
                  <p style={styles.nestedDescription}>{nestedField.description}</p>
                )}
                {renderNestedField(nestedField)}
              </div>
            ))}
          </div>
        );

      case 'list':
        return renderListField(field);

      default:
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => handleFieldChange(field.controlName, e.target.value)}
            style={styles.input}
            placeholder={field.label}
          />
        );
    }
  };

  // Check if field should be shown (based on show_if conditions)
  const isFieldHidden = useCallback((field: ChartSchemaNode): boolean => {
    // Hidden field is always hidden
    if (field.schema.hidden) return true;

    // Check show_if conditions
    if (field.schema.show_if && Array.isArray(field.schema.show_if)) {
      for (const condition of field.schema.show_if) {
        if (Array.isArray(condition) && condition.length >= 3) {
          const [fieldName, operator, value] = condition;
          const currentValue = getNestedValue(fieldName as string);
          if (operator === '=') {
            if (currentValue !== value) return true;
          } else if (operator === '!=') {
            if (currentValue === value) return true;
          }
        }
      }
    }

    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues]);

  // Check if field is required
  const isFieldRequired = (field: ChartSchemaNode): boolean => {
    return field.schema.required || (field.schema.empty !== undefined && !field.schema.empty);
  };

  // Check if field should be in advanced settings
  const isFieldAdvanced = (field: ChartSchemaNode): boolean => {
    // Hidden fields go to advanced
    if (field.schema.hidden) return true;
    // dict and list types are NOT advanced - they render their children
    if (field.schema.type === 'dict' || field.schema.type === 'list') return false;
    // Fields with defaults go to advanced
    if (field.schema.default !== undefined) return true;
    // Fields that are not required go to advanced
    if (!field.schema.required) return true;
    // Fields where empty is allowed go to advanced
    if (field.schema.empty !== undefined && field.schema.empty) return true;
    return false;
  };

  // Memoize visible fields based on formValues (for show_if support)
  const visibleSections = useMemo(() => {
    return dynamicSection
      .map((section) => ({
        ...section,
        schema: section.schema.filter((field) => !isFieldHidden(field)),
      }))
      .filter((section) => section.schema.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicSection, formValues]);

  const visibleAdvancedFields = useMemo(() => {
    return advancedFields.filter((field) => !isFieldHidden(field));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advancedFields, formValues]);

  const searchOptions = getSearchOptions();

  // Page mode - render full page without overlay/modal
  if (isPage) {
    return (
      <div style={pageStyles.container}>
        {/* Header - only show if showHeader is true */}
        {showHeader && (
          <div style={pageStyles.header}>
            <div style={pageStyles.headerInfo}>
              <h2 style={pageStyles.title}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                {isNew ? '安装' : '编辑'} {catalogApp?.title || app?.title || editingApp?.metadata?.title || ''}
              </h2>
              <p style={pageStyles.subtitle}>
                {catalogApp?.description || (isNew ? `从 ${app?.train} 目录安装` : '更新应用配置')}
              </p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {jobProgress && (
          <div style={pageStyles.progressContainer}>
            <div style={pageStyles.progressBar}>
              <div
                style={{
                  ...pageStyles.progressFill,
                  width: `${jobProgress.percent}%`,
                }}
              />
            </div>
            <span style={pageStyles.progressText}>
              {jobProgress.description || `${jobProgress.percent}%`}
            </span>
          </div>
        )}

        {/* Content */}
        <form onSubmit={handleSubmit} style={pageStyles.form}>
          {loading && (
            <div style={pageStyles.loadingState}>
              <div style={pageStyles.spinner} />
              <p>正在加载应用配置...</p>
            </div>
          )}

          {error && !loading && (
            <div style={pageStyles.errorState}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && catalogApp && (
            <>
              {/* Search */}
              {dynamicSection.length > 3 && (
                <div style={pageStyles.searchContainer}>
                  <div style={pageStyles.searchWrapper}>
                    <svg style={pageStyles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="2">
                      <circle cx="11" cy="11" r="7"/>
                      <path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="搜索配置项..."
                      value={searchValue}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      style={pageStyles.searchInput}
                      list="wizard-search-options-page"
                    />
                    <datalist id="wizard-search-options-page">
                      {searchOptions.map((opt) => (
                        <option key={opt.value} value={opt.label} />
                      ))}
                    </datalist>
                  </div>
                </div>
              )}

              {/* Release Name */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  应用名称 <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={releaseName}
                  onChange={(e) => setReleaseName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  style={{
                    ...styles.input,
                    ...(editingApp ? styles.inputDisabled : {}),
                  }}
                  placeholder="my-app"
                  title="只能使用小写字母、数字和连字符，以字母开头"
                  required
                  disabled={!!editingApp}
                />
                <p style={styles.fieldHint}>
                  只能使用小写字母、数字和连字符，以字母开头
                </p>
              </div>

              {/* Version Selector */}
              {rootDynamicSection[0]?.schema.find((f) => f.variable === 'version') && !editingApp && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    版本 <span style={styles.required}>*</span>
                  </label>
                  <select
                    value={selectedVersion}
                    onChange={(e) => handleVersionChange(e.target.value)}
                    style={styles.select}
                  >
                    {Object.keys(catalogApp.versions || {})
                      .filter((v) => catalogApp.versions[v].healthy)
                      .map((version) => (
                        <option key={version} value={version}>
                          {version}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Dynamic Form Sections */}
              {visibleSections.map((section) => (
                <Fragment key={section.name}>
                  <div style={styles.sectionTitleOutside}>{section.name}</div>
                  <div
                    ref={(el) => { sectionRefs.current[section.name] = el; }}
                    style={styles.sectionFields}
                  >
                    {section.schema.map((field) => {
                      return (
                        <div key={field.variable} style={styles.formGroup}>
                          <label style={styles.label}>
                            {field.label || field.variable}
                            {isFieldRequired(field) && !field.schema.default && (
                              <span style={styles.required}>*</span>
                            )}
                          </label>
                          {field.description && (
                            <p style={styles.fieldDescription}>{field.description}</p>
                          )}
                          {renderFormField(field)}
                        </div>
                      );
                    })}
                  </div>
                </Fragment>
              ))}

              {visibleAdvancedFields.length > 0 && (
                visibleAdvancedFields.map((field) => {
                  return (
                    <div key={field.variable} style={styles.formGroup}>
                      <label style={styles.label}>
                        {field.label || field.variable}
                        {isFieldRequired(field) && !field.schema.default && (
                          <span style={styles.required}>*</span>
                        )}
                      </label>
                      {field.description && (
                        <p style={styles.fieldDescription}>{field.description}</p>
                      )}
                      {renderFormField(field)}
                    </div>
                  );
                })
              )}

              {/* Submit */}
              <div style={pageStyles.submitContainer}>
                <button
                  type="submit"
                  style={{
                    ...pageStyles.submitButton,
                    ...(submitting ? pageStyles.submitButtonDisabled : {}),
                  }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div style={pageStyles.buttonSpinner} />
                      {isNew ? '安装中...' : '保存中...'}
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                      {isNew ? '开始安装' : '保存更新'}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    );
  }

  // Modal mode (default)
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerInfo}>
            <h2 style={styles.title}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              {isNew ? '安装' : '编辑'} {catalogApp?.title || app?.title || editingApp?.metadata?.title || ''}
            </h2>
            <p style={styles.subtitle}>
              {catalogApp?.description || (isNew ? `从 ${app?.train} 目录安装` : '更新应用配置')}
            </p>
          </div>
          <button style={styles.closeButton} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        {jobProgress && (
          <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${jobProgress.percent}%`,
                }}
              />
            </div>
            <span style={styles.progressText}>
              {jobProgress.description || `${jobProgress.percent}%`}
            </span>
          </div>
        )}

        {/* Content */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {loading && (
            <div style={styles.loadingState}>
              <div style={styles.spinner} />
              <p>正在加载应用配置...</p>
            </div>
          )}

          {error && !loading && (
            <div style={styles.errorState}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && catalogApp && (
            <>
              {/* Search */}
              {dynamicSection.length > 3 && (
                <div style={styles.searchContainer}>
                  <div style={styles.searchWrapper}>
                    <svg style={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="2">
                      <circle cx="11" cy="11" r="7"/>
                      <path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="搜索配置项..."
                      value={searchValue}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      style={styles.searchInput}
                      list="wizard-search-options"
                    />
                    <datalist id="wizard-search-options">
                      {searchOptions.map((opt) => (
                        <option key={opt.value} value={opt.label} />
                      ))}
                    </datalist>
                  </div>
                </div>
              )}

              {/* App Info */}
              <div style={styles.appInfo}>
                <div style={styles.appIcon}>
                  {(app?.icon_url || catalogApp.icon_url) ? (
                    <img
                      src={app?.icon_url || catalogApp.icon_url}
                      alt=""
                      style={styles.appIconImg}
                    />
                  ) : (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="4"/>
                      <path d="M8 12h8M12 8v8"/>
                    </svg>
                  )}
                </div>
                <div style={styles.appMeta}>
                  <span style={styles.appVersion}>版本 {selectedVersion}</span>
                  <span style={styles.appTrain}>来源: {app?.train || editingApp?.metadata?.train || 'stable'}</span>
                </div>
              </div>

              {/* Release Name */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  应用名称 <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={releaseName}
                  onChange={(e) => setReleaseName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  style={{
                    ...styles.input,
                    ...(editingApp ? styles.inputDisabled : {}),
                  }}
                  placeholder="my-app"
                  title="只能使用小写字母、数字和连字符，以字母开头"
                  required
                  disabled={!!editingApp}
                />
                <p style={styles.fieldHint}>
                  只能使用小写字母、数字和连字符，以字母开头
                </p>
              </div>

              {/* Version Selector */}
              {rootDynamicSection[0]?.schema.find((f) => f.variable === 'version') && !editingApp && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    版本 <span style={styles.required}>*</span>
                  </label>
                  <select
                    value={selectedVersion}
                    onChange={(e) => handleVersionChange(e.target.value)}
                    style={styles.select}
                  >
                    {Object.keys(catalogApp.versions || {})
                      .filter((v) => catalogApp.versions[v].healthy)
                      .map((version) => (
                        <option key={version} value={version}>
                          {version}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Dynamic Form Sections */}
              {visibleSections.map((section) => (
                <Fragment key={section.name}>
                  <div style={styles.sectionTitleOutside}>{section.name}</div>
                  <div
                    ref={(el) => { sectionRefs.current[section.name] = el; }}
                    style={styles.sectionFields}
                  >
                    {section.schema.map((field) => {
                      return (
                        <div key={field.variable} style={styles.formGroup}>
                          <label style={styles.label}>
                            {field.label || field.variable}
                            {isFieldRequired(field) && !field.schema.default && (
                              <span style={styles.required}>*</span>
                            )}
                          </label>
                          {field.description && (
                            <p style={styles.fieldDescription}>{field.description}</p>
                          )}
                          {renderFormField(field)}
                        </div>
                      );
                    })}
                  </div>
                </Fragment>
              ))}

              {visibleAdvancedFields.length > 0 && (
                visibleAdvancedFields.map((field) => {
                  return (
                    <div key={field.variable} style={styles.formGroup}>
                      <label style={styles.label}>
                        {field.label || field.variable}
                        {isFieldRequired(field) && !field.schema.default && (
                          <span style={styles.required}>*</span>
                        )}
                      </label>
                      {field.description && (
                        <p style={styles.fieldDescription}>{field.description}</p>
                      )}
                      {renderFormField(field)}
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* Footer */}
          {!loading && (
            <div style={styles.footer}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={onClose}
                disabled={submitting}
              >
                取消
              </button>
              <button
                type="submit"
                style={{
                  ...styles.submitButton,
                  ...(submitting ? styles.submitButtonDisabled : {}),
                }}
                disabled={submitting || !selectedPool}
              >
                {submitting ? (
                  <>
                    <div style={styles.buttonSpinner} />
                    {isNew ? '安装中...' : '更新中...'}
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    {isNew ? '开始安装' : '保存更新'}
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: 640,
    maxHeight: '90vh',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '24px 24px 20px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 20,
    fontWeight: 700,
    color: '#1d1d1f',
    margin: 0,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
  },
  subtitle: {
    fontSize: 13,
    color: '#86868b',
    margin: '6px 0 0 30px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  closeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    border: 'none',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    cursor: 'pointer',
    color: '#86868b',
    transition: 'all 0.2s ease',
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 24px',
    backgroundColor: '#f5f5f7',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0, 113, 227, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0071e3',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: 12,
    color: '#86868b',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    minWidth: 80,
    textAlign: 'right',
  },
  form: {
    flex: 1,
    overflow: 'auto',
    padding: 24,
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    color: '#86868b',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid rgba(0, 0, 0, 0.1)',
    borderTopColor: '#0071e3',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: 12,
  },
  errorState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: 32,
    color: '#ff3b30',
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f5f5f7',
    borderRadius: 10,
    padding: '10px 14px',
    gap: 10,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: 14,
    outline: 'none',
    color: '#1d1d1f',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  appInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    marginBottom: 24,
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  appIconImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  appMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  appVersion: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1d1d1f',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
  },
  appTrain: {
    fontSize: 13,
    color: '#86868b',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#1d1d1f',
    marginBottom: 6,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  required: {
    color: '#ff3b30',
    marginLeft: 2,
  },
  fieldDescription: {
    fontSize: 12,
    color: '#86868b',
    margin: '0 0 8px 0',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  fieldHint: {
    fontSize: 11,
    color: '#86868b',
    margin: '4px 0 0 0',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: 15,
    border: '1px solid rgba(0, 0, 0, 0.12)',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    color: '#1d1d1f',
    outline: 'none',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f7',
    cursor: 'not-allowed',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    fontSize: 15,
    border: '1px solid rgba(0, 0, 0, 0.12)',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    color: '#1d1d1f',
    outline: 'none',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    boxSizing: 'border-box',
    cursor: 'pointer',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: '#1d1d1f',
    cursor: 'pointer',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  checkbox: {
    width: 18,
    height: 18,
    cursor: 'pointer',
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fafafa',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1d1d1f',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
  },
  sectionFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 16,
    backgroundColor: '#fafafa',
    borderRadius: 12,
  },
  sectionTitleOutside: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1d1d1f',
    marginBottom: 8,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  },
  advancedToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '12px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: '#0071e3',
    backgroundColor: '#f5f5f7',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
  },
  advancedSection: {
    marginTop: 8,
  },
  listField: {
    padding: 12,
    backgroundColor: '#f5f5f7',
    borderRadius: 8,
    textAlign: 'center',
  },
  listFieldHint: {
    fontSize: 12,
    color: '#86868b',
    margin: 0,
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  listEmpty: {
    fontSize: 13,
    color: '#86868b',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  listItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: '#f5f5f7',
    borderRadius: 8,
  },
  listItemContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  listItemField: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  listItemLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1d1d1f',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  listItemSimple: {
    flex: 1,
  },
  listItemInput: {
    width: '100%',
    padding: '8px 12px',
    fontSize: 14,
    border: '1px solid rgba(0, 0, 0, 0.12)',
    borderRadius: 6,
    backgroundColor: '#ffffff',
    color: '#1d1d1f',
    outline: 'none',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    boxSizing: 'border-box',
  },
  listItemDelete: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    border: 'none',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 6,
    cursor: 'pointer',
    color: '#86868b',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  listAddButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 500,
    color: '#0071e3',
    backgroundColor: 'rgba(0, 113, 227, 0.08)',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  dictField: {
    padding: 12,
    backgroundColor: '#f5f5f7',
    borderRadius: 8,
    textAlign: 'center',
  },
  dictFieldHint: {
    fontSize: 12,
    color: '#86868b',
    margin: 0,
  },
  dictContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 12,
    backgroundColor: '#f5f5f7',
    borderRadius: 8,
  },
  nestedFormGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  nestedLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#1d1d1f',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  nestedDescription: {
    fontSize: 11,
    color: '#86868b',
    margin: '0 0 6px 0',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    padding: '16px 24px',
    borderTop: '1px solid rgba(0, 0, 0, 0.08)',
    backgroundColor: '#fafafa',
  },
  cancelButton: {
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 500,
    color: '#1d1d1f',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0, 0, 0, 0.12)',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    transition: 'all 0.2s ease',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#0071e3',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    transition: 'all 0.2s ease',
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  buttonSpinner: {
    width: 14,
    height: 14,
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
