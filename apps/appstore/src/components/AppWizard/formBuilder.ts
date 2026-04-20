/**
 * Form Builder - Pure functions for building dynamic form from Chart schema
 */

import { ChartFormValue, ChartSchemaNode } from '@truenas/types/app-types';
import type { BuildDynamicFormResult, CatalogSchema, DynamicSection, FormValues } from './types';

// ---------------------------------------------------------------------------
// Pure function: isFieldAdvanced
// ---------------------------------------------------------------------------

export function isFieldAdvanced(field: ChartSchemaNode): boolean {
  if (field.schema.hidden) return true;
  if (field.schema.type === 'dict' || field.schema.type === 'list') return false;
  if (field.schema.default !== undefined) return true;
  if (!field.schema.required) return true;
  if (field.schema.empty !== undefined && field.schema.empty) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Pure function: buildDynamicForm
// ---------------------------------------------------------------------------

export function buildDynamicForm(
  schema: CatalogSchema
): BuildDynamicFormResult {
  const sections: DynamicSection[] = [];

  // Add groups as sections
  schema.groups?.forEach((group) => {
    sections.push({
      name: group.name,
      description: group.description,
      help: group.description,
      schema: [],
    });
  });

  // Collect advanced fields
  const advanced: (ChartSchemaNode & { controlName: string })[] = [];

  // Build variable → controlName mapping for show_if resolution
  const variableToControlName: Record<string, string> = {};

  // First pass: collect top-level variables and build initial mapping
  const topLevelVariables: string[] = [];
  schema.questions?.forEach((question) => {
    topLevelVariables.push(question.variable);
    variableToControlName[question.variable] = question.variable;
  });

  // Recursive helper to build all nested attr mappings
  const buildAllNestedAttrsMappings = (
    attrList: ChartSchemaNode[],
    parentPath: string
  ) => {
    attrList.forEach((attr) => {
      const attrControlName = `${parentPath}.${attr.variable}`;
      variableToControlName[attr.variable] = attrControlName;
      variableToControlName[attrControlName] = attrControlName;
      if (attr.schema.type === 'dict' && attr.schema.attrs) {
        buildAllNestedAttrsMappings(attr.schema.attrs, attrControlName);
      }
    });
  };

  // Process dict fields and build nested mappings
  schema.questions?.forEach((question) => {
    if (question.schema.type === 'dict' && question.schema.attrs) {
      buildAllNestedAttrsMappings(
        question.schema.attrs,
        question.variable
      );
    }
  });

  // Transform show_if to use controlName paths
  const transformShowIf = (
    showIf: string[][] | undefined
  ): string[][] | undefined => {
    if (!showIf) return undefined;
    return showIf.map((condition: string[]) => {
      if (Array.isArray(condition) && condition.length >= 3) {
        const [fieldName, operator, value] = condition;
        const resolvedFieldName =
          variableToControlName[fieldName] || fieldName;
        return [resolvedFieldName, operator, value];
      }
      return condition;
    });
  };

  // Collect questions by group, with transformed show_if
  const questionsByGroup: Record<string, (ChartSchemaNode & { controlName: string })[]> = {};

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

    if (isFieldAdvanced(transformedQuestion)) {
      advanced.push(transformedQuestion);
    } else {
      if (!questionsByGroup[groupName]) {
        questionsByGroup[groupName] = [];
      }
      questionsByGroup[groupName].push(transformedQuestion);
    }
  });

  // Populate sections
  sections.forEach((section) => {
    const groupQuestions = questionsByGroup[section.name] || [];

    // Recursively expand dict attrs into the section (at any nesting level)
    const expandAttrsIntoSection = (
      attrList: ChartSchemaNode[],
      parentPath: string
    ) => {
      attrList.forEach((attr) => {
        const attrControlName = `${parentPath}.${attr.variable}`;

        if (attr.schema.type === 'dict' && attr.schema.attrs) {
          // ALWAYS build nested mappings first, regardless of show_if
          buildAllNestedAttrsMappings(attr.schema.attrs, attrControlName);

          const hasShowIf = attr.schema.show_if && attr.schema.show_if.length > 0;
          if (hasShowIf) {
            // Dict attr WITH show_if: add as-is to section (FormField.render handles visibility)
            section.schema.push({
              ...attr,
              controlName: attrControlName,
              originalVariable: attr.variable,
              schema: {
                ...attr.schema,
                show_if: transformShowIf(attr.schema.show_if),
              },
            } as ChartSchemaNode & { controlName: string });
          } else {
            // Dict attr WITHOUT show_if: recursively expand its attrs into the same section
            expandAttrsIntoSection(attr.schema.attrs, attrControlName);
          }
        } else {
          // Non-dict attr: add directly to section
          section.schema.push({
            ...attr,
            controlName: attrControlName,
            originalVariable: attr.variable,
            schema: {
              ...attr.schema,
              show_if: transformShowIf(attr.schema.show_if),
            },
          } as ChartSchemaNode & { controlName: string });
        }
      });
    };

    if (
      groupQuestions.length === 1 &&
      groupQuestions[0].schema.type === 'dict'
    ) {
      const dictField = groupQuestions[0];
      const attrs = dictField.schema.attrs || [];
      buildAllNestedAttrsMappings(attrs, dictField.variable);
      expandAttrsIntoSection(attrs, dictField.variable);
    } else {
      section.schema.push(...groupQuestions);
    }
  });

  // Filter out empty sections
  const filteredSections = sections.filter((s) => s.schema.length > 0);

  // Extract initial values from schema defaults
  const initialValues: FormValues = {};

  const extractDefaults = (
    questions: ChartSchemaNode[],
    parentPath: string = ''
  ) => {
    questions.forEach((q) => {
      const fullPath = parentPath
        ? `${parentPath}.${q.variable}`
        : q.variable;

      if (q.schema.type === 'dict' && q.schema.attrs) {
        extractDefaults(q.schema.attrs, fullPath);
      } else if (q.schema.default !== undefined) {
        if (!fullPath.includes('.')) {
          initialValues[fullPath] = q.schema.default as ChartFormValue;
        } else {
          // Handle nested path: split and create intermediate objects
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

  return {
    sections: filteredSections,
    advancedFields: advanced,
    initialValues,
  };
}
