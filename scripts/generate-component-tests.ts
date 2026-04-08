#!/usr/bin/env node

/**
 * Component Test Scaffold Generator
 *
 * Scans component directories and generates test templates
 *
 * Usage:
 *   node scripts/generate-component-tests.ts                    # Scan all components
 *   node scripts/generate-component-tests.ts --component Taskbar # Generate for specific component
 *   node scripts/generate-component-tests.ts --list             # List all components
 */

/* eslint-disable no-console */

import * as fs from 'fs'
import * as path from 'path'
import * as parser from '@typescript-eslint/typescript-estree'

// Configuration
const COMPONENT_DIRS = [
  'src/desktop/components',
  'src/truenas/components',
]

const TEST_TEMPLATE = `/**
 * {{ComponentName}} Component Tests
 *
 * Tests for {{ComponentName}} component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
{{imports}}

describe('{{ComponentName}}', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render without crashing', () => {
      // TODO: Implement test
      expect(true).toBe(true)
    })

    it('should match snapshot', () => {
      // TODO: Implement snapshot test
    })
  })
{{tests}}
})
`

const TEST_NAME_TEMPLATE = `

  describe('{{testGroupName}}', () => {
    it('should {{testDescription}}', () => {
      // TODO: Implement test
      expect(true).toBe(true)
    })
  })
`

interface ComponentInfo {
  name: string
  filePath: string
  exports: string[]
  props?: string
}

/**
 * Parse a TSX file and extract component information
 */
function parseComponent(filePath: string): ComponentInfo | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const ast = parser.parse(content, {
      jsx: true,
      sourceType: 'module',
    })

    const exports: string[] = []
    let propsInterface: string | undefined

    // Find exports (function declarations, interface declarations)
    for (const node of ast.body) {
      if (node.type === 'ExportNamedDeclaration') {
        const decl = node.declaration
        if (decl) {
          if (decl.type === 'TSInterfaceDeclaration') {
            propsInterface = decl.id.name
          } else if (decl.type === 'FunctionDeclaration') {
            exports.push(decl.id?.name || 'Anonymous')
          }
        }
        // Handle "export { Component }" syntax
        if (node.specifiers.length > 0) {
          for (const spec of node.specifiers) {
            if (spec.exported) {
              exports.push(spec.exported.name)
            }
          }
        }
      } else if (node.type === 'Declaration') {
        if (node.declaration?.type === 'FunctionDeclaration') {
          const fn = node.declaration
          const name = fn.id?.name
          if (name && (name.endsWith('Props') || name.endsWith('Container'))) {
            // This might be a component based on naming convention
          }
        }
      }
    }

    // Try to extract props from component function
    const componentNameMatch = content.match(/function\s+(\w+)\s*\(/g)
    const interfaceMatch = content.match(/interface\s+(\w+Props)\s*\{[^}]+\}/gs)

    if (componentNameMatch) {
      for (const match of componentNameMatch) {
        const name = match.replace(/function\s+/, '').replace(/\s*\(/, '')
        if (!name.startsWith('_') && !name.startsWith('use')) {
          exports.push(name)
        }
      }
    }

    if (interfaceMatch) {
      for (const match of interfaceMatch) {
        const name = match.match(/interface\s+(\w+Props)/)?.[1]
        if (name) {
          propsInterface = name
        }
      }
    }

    const fileName = path.basename(filePath, path.extname(filePath))

    return {
      name: fileName,
      filePath,
      exports,
      props: propsInterface,
    }
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error)
    return null
  }
}

/**
 * Scan directory for components
 */
function scanComponents(dir: string): ComponentInfo[] {
  const components: ComponentInfo[] = []

  if (!fs.existsSync(dir)) {
    return components
  }

  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)

    if (fs.statSync(filePath).isDirectory()) {
      // Check for index.tsx in directory
      const indexPath = path.join(filePath, 'index.tsx')
      if (fs.existsSync(indexPath)) {
        const info = parseComponent(indexPath)
        if (info) components.push(info)
      }
    } else if (file.endsWith('.tsx')) {
      const info = parseComponent(filePath)
      if (info) components.push(info)
    }
  }

  return components
}

/**
 * Generate test file content
 */
function generateTest(component: ComponentInfo): string {
  const { name, exports: componentExports } = component

  // Determine if default export
  const hasDefault = componentExports.some(e =>
    e.toLowerCase() === name.toLowerCase() ||
    e === 'default'
  )

  const importStatement = hasDefault
    ? `import ${name} from './${name}'`
    : componentExports.length > 0
      ? `import { ${componentExports.join(', ')} } from './${name}'`
      : `import * as ${name}Component from './${name}'`

  // Generate test groups based on exports (deduplicated)
  const uniqueExports = [...new Set(
    componentExports
      .filter(e => !e.endsWith('Props') && !e.endsWith('Interface'))
      .map(e => e.replace(/Container$/, ''))
  )].slice(0, 3) // Limit to 3 test groups

  let tests = ''
  for (const exportName of uniqueExports) {
    const testGroupName = exportName
    tests += TEST_NAME_TEMPLATE
      .replace('{{testGroupName}}', testGroupName || 'Default')
      .replace('{{testDescription}}', `render ${testGroupName || 'component'}`)
  }

  // Add basic rendering test if no exports found
  if (!tests) {
    tests = `
  describe('Rendering', () => {
    it('should render without crashing', () => {
      expect(true).toBe(true)
    })
  })
`
  }

  const importLine = `// ${importStatement}`
  const importFix = `// TODO: Uncomment and fix import\n// ${importStatement}`

  let template = TEST_TEMPLATE
  template = template.split('{{ComponentName}}').join(name)
  template = template.split('{{imports}}').join(`${importLine}\n${importFix}`)
  template = template.split('{{tests}}').join(tests)
  return template
}

/**
 * Write test file
 */
function writeTest(component: ComponentInfo): string {
  const testContent = generateTest(component)

  // Output path is next to the component file
  const outputPath = component.filePath.replace('.tsx', '.test.tsx')

  // Check if test already exists
  if (fs.existsSync(outputPath)) {
    return `SKIP: ${outputPath} (already exists)`
  }

  fs.writeFileSync(outputPath, testContent)
  return outputPath
}

/**
 * List all components
 */
function listComponents(): void {
  console.log('\n📁 Available Components:\n')

  for (const dir of COMPONENT_DIRS) {
    const components = scanComponents(dir)
    if (components.length > 0) {
      console.log(`\n${dir}:`)
      for (const comp of components) {
        const status = fs.existsSync(comp.filePath.replace('.tsx', '.test.tsx'))
          ? '✅ tested'
          : '⬜ untested'
        console.log(`  - ${comp.name} ${status}`)
      }
    }
  }
  console.log()
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2)

  if (args.includes('--list') || args.includes('-l')) {
    listComponents()
    return
  }

  const componentArg = args.find(arg => arg.startsWith('--component='))
  const specificComponent = componentArg?.split('=')[1]

  console.log('\n🔧 Component Test Scaffold Generator\n')

  const testOutputs: string[] = []

  if (specificComponent) {
    // Generate for specific component
    for (const dir of COMPONENT_DIRS) {
      const componentPath = path.join(process.cwd(), dir, `${specificComponent}.tsx`)
      if (fs.existsSync(componentPath)) {
        const info = parseComponent(componentPath)
        if (info) {
          const output = writeTest(info)
          testOutputs.push(output)
        }
      }
    }
  } else {
    // Generate for all components
    for (const dir of COMPONENT_DIRS) {
      const components = scanComponents(dir)
      for (const comp of components) {
        const output = writeTest(comp)
        testOutputs.push(output)
      }
    }
  }

  // Report results
  console.log('\n📝 Generated Test Files:\n')
  for (const output of testOutputs) {
    if (output.startsWith('SKIP')) {
      console.log(`  ⏭️  ${output.replace('SKIP: ', '')}`)
    } else {
      console.log(`  ✅ ${output}`)
    }
  }
  console.log()

  // Summary
  const generated = testOutputs.filter(o => !o.startsWith('SKIP')).length
  const skipped = testOutputs.filter(o => o.startsWith('SKIP')).length

  console.log(`Summary: ${generated} generated, ${skipped} skipped (already exist)`)
  console.log()
}

main()
