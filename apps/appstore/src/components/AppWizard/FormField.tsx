/**
 * FormField - Unified field rendering components
 *
 * Consolidates renderFormField, renderNestedField, and renderListItemField
 * into a set of focused, composable components.
 */

import { Fragment } from 'react';
import { ChartFormValue, ChartSchemaNode } from '@truenas/types/app-types';

import { useWizardContext } from './context';
import { fieldStyles, baseStyles } from './styles';
import type { WizardContextValue } from './types';

// ---------------------------------------------------------------------------
// InputWidget - renders just the <input>/<select> element
// ---------------------------------------------------------------------------

interface InputWidgetProps {
  schema: ChartSchemaNode;
  value: ChartFormValue;
  onChange: (value: ChartFormValue) => void;
  hasError?: boolean;
}

function InputWidget({ schema, value, onChange, hasError }: InputWidgetProps) {
  const inputStyle = hasError ? fieldStyles.inputError : fieldStyles.input;
  const selectStyle = hasError ? fieldStyles.selectError : fieldStyles.select;

  if (schema.schema.type === 'string' && schema.schema.enum) {
    return (
      <select
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        style={selectStyle}
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
          style={inputStyle}
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
          style={inputStyle}
          min={schema.schema.min as number}
          max={schema.schema.max as number}
          placeholder={schema.label}
        />
      );

    case 'boolean':
      return (
        <label style={fieldStyles.checkboxLabel}>
          <input
            type="checkbox"
            checked={value as boolean}
            onChange={(e) => onChange(e.target.checked)}
            style={fieldStyles.checkbox}
          />
          <span>{schema.description || schema.label}</span>
        </label>
      );

    case 'select':
      return (
        <select
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          style={selectStyle}
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
          style={inputStyle}
          placeholder={schema.label}
        />
      );
  }
}

// ---------------------------------------------------------------------------
// ListField - renders ix-list equivalent
// ---------------------------------------------------------------------------

interface ListFieldProps {
  field: ChartSchemaNode & { controlName: string };
}

function ListField({ field }: ListFieldProps) {
  const { getNestedValue, handleFieldChange } = useWizardContext();
  const items = (getNestedValue(field.controlName) as ChartFormValue[]) || [];
  const itemsSchema = field.schema.items || [];

  const handleAddItem = () => {
    const newItems = [...items];
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

  const handleItemAttrChange = (index: number, attrVariable: string, newValue: ChartFormValue) => {
    const newItems = [...items];
    const item = newItems[index] as Record<string, ChartFormValue>;
    newItems[index] = { ...item, [attrVariable]: newValue };
    handleFieldChange(field.controlName, newItems);
  };

  const handleSimpleItemChange = (index: number, value: ChartFormValue) => {
    const newItems = [...items];
    newItems[index] = value;
    handleFieldChange(field.controlName, newItems);
  };

  return (
    <div style={fieldStyles.listContainer}>
      {items.length === 0 && (
        <span style={fieldStyles.listEmpty}>尚未添加任何项目。</span>
      )}
      {items.map((item, index) => (
        <div key={index} style={fieldStyles.listItem}>
          {itemsSchema.length > 0 && itemsSchema[0].schema.type === 'dict' ? (
            <div style={fieldStyles.listItemContent}>
              {(itemsSchema[0].schema.attrs || []).map((attr: ChartSchemaNode) => {
                const itemObj = item as Record<string, ChartFormValue>;
                const attrValue = itemObj[attr.variable] ?? attr.schema.default ?? '';
                return (
                  <div key={attr.variable} style={fieldStyles.listItemField}>
                    <label style={fieldStyles.listItemLabel}>
                      {attr.label || attr.variable}
                      {attr.schema.required && (
                        <span style={fieldStyles.required}>*</span>
                      )}
                    </label>
                    <ListItemInputWidget
                      attr={attr}
                      value={attrValue}
                      onChange={(val) => handleItemAttrChange(index, attr.variable, val)}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={fieldStyles.listItemSimple}>
              <input
                type="text"
                value={item as string}
                onChange={(e) => handleSimpleItemChange(index, e.target.value)}
                style={fieldStyles.listItemInput}
                placeholder={field.label}
              />
            </div>
          )}
          <button
            type="button"
            style={fieldStyles.listItemDelete}
            onClick={() => handleRemoveItem(index)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        style={fieldStyles.listAddButton}
        onClick={handleAddItem}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
        添加 {field.label}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ListItemInputWidget - renders a single attr input inside a list item
// ---------------------------------------------------------------------------

function ListItemInputWidget({
  attr,
  value,
  onChange,
}: {
  attr: ChartSchemaNode;
  value: ChartFormValue;
  onChange: (val: ChartFormValue) => void;
}) {
  if (attr.schema.type === 'string' && attr.schema.enum) {
    return (
      <select
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        style={fieldStyles.select}
      >
        <option value="">选择...</option>
        {attr.schema.enum.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.description || opt.value}
          </option>
        ))}
      </select>
    );
  }

  switch (attr.schema.type) {
    case 'string':
    case 'hostname':
    case 'ipaddr':
    case 'cidr':
      return (
        <input
          type={attr.schema.private ? 'password' : 'text'}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          style={fieldStyles.input}
          placeholder={attr.label}
        />
      );
    case 'int':
    case 'number':
      return (
        <input
          type="number"
          value={value as number}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          style={fieldStyles.input}
          min={attr.schema.min as number}
          max={attr.schema.max as number}
          placeholder={attr.label}
        />
      );
    default:
      return (
        <input
          type="text"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          style={fieldStyles.input}
          placeholder={attr.label}
        />
      );
  }
}

// ---------------------------------------------------------------------------
// FormField - recursive field renderer
// ---------------------------------------------------------------------------

interface FormFieldProps {
  field: ChartSchemaNode & { controlName?: string };
  parentControlName?: string;
}

function FormField({ field, parentControlName }: FormFieldProps) {
  const ctx = useWizardContext();

  const fieldControlName = parentControlName
    ? `${parentControlName}.${field.variable}`
    : field.controlName || field.variable;

  if (ctx.isFieldHidden({ ...field, controlName: fieldControlName } as ChartSchemaNode)) {
    return null;
  }

  if (field.schema.type === 'dict') {
    return (
      <div style={fieldStyles.dictContainer}>
        {(field.schema.attrs || []).map((attr: ChartSchemaNode) => {
          const attrControlName = `${fieldControlName}.${attr.variable}`;

          const transformedShowIf = attr.schema.show_if?.map((condition: string[]) => {
            if (Array.isArray(condition) && condition.length >= 3) {
              const [fieldName, operator, value] = condition;
              let fullPath = fieldName;
              if (!fieldName.includes('.')) {
                fullPath = `${fieldControlName}.${fieldName}`;
              }
              return [fullPath, operator, value];
            }
            return condition;
          });

          const attrFieldWithControl = {
            ...attr,
            controlName: attrControlName,
            schema: {
              ...attr.schema,
              show_if: transformedShowIf,
            },
          } as ChartSchemaNode & { controlName: string };

          if (ctx.isFieldHidden(attrFieldWithControl)) {
            return null;
          }

          return (
            <div
              key={attr.variable}
              style={
                ctx.hasValidationError(attrControlName)
                  ? fieldStyles.nestedFormGroupError
                  : fieldStyles.nestedFormGroup
              }
            >
              <label style={fieldStyles.nestedLabel}>
                {attr.label || attr.variable}
                {(attr.schema.required ||
                  (attr.schema.empty !== undefined && !attr.schema.empty)) && (
                  <span style={fieldStyles.required}>*</span>
                )}
              </label>
              {attr.description && (
                <p style={fieldStyles.nestedDescription}>{attr.description}</p>
              )}
              <FormField field={attrFieldWithControl} />
            </div>
          );
        })}
      </div>
    );
  }

  if (field.schema.type === 'list') {
    return (
      <ListField field={{ ...field, controlName: fieldControlName }} />
    );
  }

  const value = ctx.getNestedValue(fieldControlName, field.schema.default ?? '');
  const error = ctx.hasValidationError(fieldControlName);

  return (
    <InputWidget
      schema={field}
      value={value}
      onChange={(val) => ctx.handleFieldChange(fieldControlName, val)}
      hasError={error}
    />
  );
}

// ---------------------------------------------------------------------------
// WizardFormBody - shared form content for both page and modal modes
// ---------------------------------------------------------------------------

interface WizardFormBodyProps {
  ctx: WizardContextValue;
}

export function WizardFormBody({ ctx }: WizardFormBodyProps) {
  const {
    catalogApp,
    loading,
    error,
    releaseName,
    setReleaseName,
    selectedVersion,
    rootDynamicSection,
    visibleSections,
    visibleAdvancedFields,
    searchValue,
    searchOptions,
    setSearchValue,
    handleSubmit,
    handleVersionChange,
    jobProgress,
    editingApp,
    sectionRefs,
  } = ctx;

  if (loading) {
    return (
      <div style={baseStyles.loadingState}>
        <div style={baseStyles.spinner} />
        <p>正在加载应用配置...</p>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div style={baseStyles.errorState}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Progress bar */}
      {jobProgress && (
        <div style={baseStyles.progressContainer}>
          <div style={baseStyles.progressBar}>
            <div
              style={{
                ...baseStyles.progressFill,
                width: `${jobProgress.percent}%`,
              }}
            />
          </div>
          <span style={baseStyles.progressText}>
            {jobProgress.description || `${jobProgress.percent}%`}
          </span>
        </div>
      )}

      {/* Search */}
      {visibleSections.length > 3 && (
        <div style={baseStyles.searchContainer}>
          <div style={baseStyles.searchWrapper}>
            <svg style={baseStyles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="搜索配置项..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={baseStyles.searchInput}
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
      <div style={baseStyles.appInfo}>
        <div style={baseStyles.appIcon}>
          {catalogApp?.icon_url ? (
            <img src={catalogApp.icon_url} alt="" style={baseStyles.appIconImg} />
          ) : (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <path d="M8 12h8M12 8v8" />
            </svg>
          )}
        </div>
        <div style={baseStyles.appMeta}>
          <span style={baseStyles.appVersion}>版本 {selectedVersion}</span>
          <span style={baseStyles.appTrain}>来源: {catalogApp?.train || 'stable'}</span>
        </div>
      </div>

      {/* Release Name */}
      <div style={fieldStyles.formGroup}>
        <label style={fieldStyles.label}>
          应用名称 <span style={fieldStyles.required}>*</span>
        </label>
        <input
          type="text"
          value={releaseName}
          onChange={(e) => setReleaseName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          style={{
            ...fieldStyles.input,
            ...(editingApp ? fieldStyles.inputDisabled : {}),
          }}
          placeholder="my-app"
          title="只能使用小写字母、数字和连字符，以字母开头"
          required
          disabled={!!editingApp}
        />
        <p style={fieldStyles.fieldHint}>
          只能使用小写字母、数字和连字符，以字母开头
        </p>
      </div>

      {/* Version Selector */}
      {rootDynamicSection[0]?.schema.find((f) => f.variable === 'version') && !editingApp && (
        <div style={fieldStyles.formGroup}>
          <label style={fieldStyles.label}>
            版本 <span style={fieldStyles.required}>*</span>
          </label>
          <select
            value={selectedVersion}
            onChange={(e) => handleVersionChange(e.target.value)}
            style={fieldStyles.select}
          >
            {Object.keys(catalogApp?.versions || {})
              .filter((v) => catalogApp?.versions[v].healthy)
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
          <div style={fieldStyles.sectionTitleOutside}>{section.name}</div>
          <div
            ref={(el) => { sectionRefs.current[section.name] = el; }}
            style={fieldStyles.sectionFields}
          >
            {section.schema.map((field) => (
              <div key={field.controlName || field.variable} style={fieldStyles.formGroup}>
                <label style={fieldStyles.label}>
                  {field.label || field.variable}
                  {(field.schema.required || (field.schema.empty !== undefined && !field.schema.empty)) && !field.schema.default && (
                    <span style={fieldStyles.required}>*</span>
                  )}
                </label>
                {field.description && (
                  <p style={fieldStyles.fieldDescription}>{field.description}</p>
                )}
                <FormField field={field} />
              </div>
            ))}
          </div>
        </Fragment>
      ))}

      {/* Advanced Fields */}
      {visibleAdvancedFields.length > 0 &&
        visibleAdvancedFields.map((field) => (
          <div key={field.controlName || field.variable} style={fieldStyles.formGroup}>
            <label style={fieldStyles.label}>
              {field.label || field.variable}
              {(field.schema.required || (field.schema.empty !== undefined && !field.schema.empty)) && !field.schema.default && (
                <span style={fieldStyles.required}>*</span>
              )}
            </label>
            {field.description && (
              <p style={fieldStyles.fieldDescription}>{field.description}</p>
            )}
            <FormField field={field} />
          </div>
        ))}
    </form>
  );
}
