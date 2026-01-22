import fs from 'fs-extra'
import path from 'path'

/**
 * Dependencies required for Unmint docs
 * These versions are compatible with Next.js 16
 */
export const UNMINT_DEPENDENCIES = {
  'fumadocs-core': '^16.4.7',
  'fumadocs-mdx': '^14.2.5',
}

/**
 * Merge dependencies into existing package.json
 */
export async function mergeDependencies(
  packageJsonPath: string,
  depsToAdd: Record<string, string> = UNMINT_DEPENDENCIES
): Promise<{ added: string[]; skipped: string[] }> {
  const pkg = await fs.readJson(packageJsonPath)
  const added: string[] = []
  const skipped: string[] = []

  pkg.dependencies = pkg.dependencies || {}

  for (const [name, version] of Object.entries(depsToAdd)) {
    if (pkg.dependencies[name] || pkg.devDependencies?.[name]) {
      skipped.push(name)
    } else {
      pkg.dependencies[name] = version
      added.push(name)
    }
  }

  // Sort dependencies alphabetically
  pkg.dependencies = Object.fromEntries(
    Object.entries(pkg.dependencies).sort(([a], [b]) => a.localeCompare(b))
  )

  await fs.writeJson(packageJsonPath, pkg, { spaces: 2 })

  return { added, skipped }
}

/**
 * CSS variables to add for Unmint docs accent colors
 * Scoped to .unmint-docs class to avoid conflicts with existing site --accent variables
 */
export function getUnmintCssVariables(accentColor: string, darkAccentColor: string): string {
  return `
/* Unmint Docs - Scoped accent colors */
.unmint-docs {
  --accent: ${accentColor};
  --accent-foreground: #ffffff;
  --accent-muted: ${hexToRgba(accentColor, 0.1)};
}

.dark .unmint-docs {
  --accent: ${darkAccentColor};
  --accent-foreground: #0f172a;
  --accent-muted: ${hexToRgba(darkAccentColor, 0.1)};
}

/* Syntax highlighting - Shiki integration for docs */
.unmint-docs pre code span {
  color: var(--shiki-light);
}

.dark .unmint-docs pre code span {
  color: var(--shiki-dark);
}
`
}

/**
 * Append CSS variables to globals.css if not already present
 */
export async function mergeGlobalsCss(
  globalsCssPath: string,
  accentColor: string,
  darkAccentColor: string
): Promise<boolean> {
  const existing = await fs.readFile(globalsCssPath, 'utf-8')

  // Check if unmint scoped styles already exist
  if (existing.includes('.unmint-docs')) {
    return false
  }

  const cssToAdd = getUnmintCssVariables(accentColor, darkAccentColor)
  await fs.appendFile(globalsCssPath, cssToAdd)

  return true
}

/**
 * Wrap next.config with fumadocs MDX
 * Handles .ts, .js, and .mjs config files
 */
export async function wrapNextConfig(nextConfigPath: string): Promise<boolean> {
  const existing = await fs.readFile(nextConfigPath, 'utf-8')

  // Check if already wrapped with fumadocs
  if (existing.includes('fumadocs-mdx') || existing.includes('createMDX')) {
    return false
  }

  const ext = path.extname(nextConfigPath)
  let modified: string

  if (ext === '.ts') {
    modified = wrapTypescriptConfig(existing)
  } else {
    modified = wrapJavascriptConfig(existing)
  }

  await fs.writeFile(nextConfigPath, modified)
  return true
}

/**
 * Wrap a TypeScript next.config.ts
 */
function wrapTypescriptConfig(existing: string): string {
  // Add import at the top
  const importLine = "import { createMDX } from 'fumadocs-mdx/next'\n"

  // Find the export default line and wrap it
  const exportMatch = existing.match(/export\s+default\s+(\w+)/)

  if (exportMatch) {
    const configName = exportMatch[1]
    let modified = importLine + existing

    // Replace the export with wrapped version
    modified = modified.replace(
      /export\s+default\s+\w+/,
      `const withMDX = createMDX()\n\nexport default withMDX(${configName})`
    )

    return modified
  }

  // Handle inline export default { ... }
  if (existing.includes('export default {')) {
    let modified = importLine + existing.replace(
      'export default {',
      'const nextConfig = {'
    )

    // Add wrapper at the end
    modified = modified.trimEnd() + '\n\nconst withMDX = createMDX()\n\nexport default withMDX(nextConfig)\n'

    return modified
  }

  // Fallback: just prepend import and hope for the best
  return importLine + existing
}

/**
 * Wrap a JavaScript next.config.js or next.config.mjs
 */
function wrapJavascriptConfig(existing: string): string {
  // Check if using ESM or CJS
  const isESM = existing.includes('export default') || existing.includes('import ')

  if (isESM) {
    const importLine = "import { createMDX } from 'fumadocs-mdx/next'\n"

    const exportMatch = existing.match(/export\s+default\s+(\w+)/)

    if (exportMatch) {
      const configName = exportMatch[1]
      let modified = importLine + existing

      modified = modified.replace(
        /export\s+default\s+\w+/,
        `const withMDX = createMDX()\n\nexport default withMDX(${configName})`
      )

      return modified
    }

    // Handle inline export
    if (existing.includes('export default {')) {
      let modified = importLine + existing.replace(
        'export default {',
        'const nextConfig = {'
      )

      modified = modified.trimEnd() + '\n\nconst withMDX = createMDX()\n\nexport default withMDX(nextConfig)\n'

      return modified
    }

    return importLine + existing
  }

  // CJS format
  const requireLine = "const { createMDX } = require('fumadocs-mdx/next')\n"

  if (existing.includes('module.exports')) {
    let modified = requireLine + existing.replace(
      /module\.exports\s*=\s*(\w+)/,
      (_, configName) => `const withMDX = createMDX()\n\nmodule.exports = withMDX(${configName})`
    )

    return modified
  }

  return requireLine + existing
}

/**
 * Convert hex color to rgba
 */
function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return `rgba(0, 0, 0, ${alpha})`

  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Lighten a hex color for dark mode
 */
export function lightenColor(hex: string, percent: number = 30): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex

  let r = parseInt(result[1], 16)
  let g = parseInt(result[2], 16)
  let b = parseInt(result[3], 16)

  r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)))
  g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)))
  b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)))

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Create source.config.ts for fumadocs
 */
export async function createSourceConfig(targetDir: string): Promise<void> {
  const sourceConfigPath = path.join(targetDir, 'source.config.ts')

  // Check if already exists
  if (await fs.pathExists(sourceConfigPath)) {
    return
  }

  const content = `import { defineConfig, defineDocs } from 'fumadocs-mdx/config'
import { rehypeCode } from 'fumadocs-core/mdx-plugins'

export const docs = defineDocs({
  dir: 'content/docs',
})

export default defineConfig({
  mdxOptions: {
    rehypePlugins: [
      [
        rehypeCode,
        {
          themes: {
            light: 'github-light',
            dark: 'github-dark',
          },
        },
      ],
    ],
  },
})
`

  await fs.writeFile(sourceConfigPath, content)
}

/**
 * Create mdx-components.tsx for fumadocs
 */
export async function createMdxComponents(targetDir: string, appDir: string): Promise<void> {
  const mdxComponentsPath = path.join(targetDir, 'mdx-components.tsx')

  // Check if already exists
  if (await fs.pathExists(mdxComponentsPath)) {
    // TODO: Could merge components in the future
    return
  }

  // The path to components depends on whether using src/app or app
  const componentsPath = appDir.includes('src') ? '@/app/components/docs/mdx' : '@/app/components/docs/mdx'

  const content = `import type { MDXComponents } from 'mdx/types'
import defaultComponents from 'fumadocs-ui/mdx'
import { Accordion } from '${componentsPath}/accordion'
import { Callout, Note, Tip, Warning, Info } from '${componentsPath}/callout'
import { Card, CardGroup } from '${componentsPath}/card'
import { CodeBlock } from '${componentsPath}/code-block'
import { Frame } from '${componentsPath}/frame'
import { Steps, Step } from '${componentsPath}/steps'
import { Tab, Tabs } from '${componentsPath}/tabs'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...defaultComponents,
    ...components,
    Accordion,
    Callout,
    Note,
    Tip,
    Warning,
    Info,
    Card,
    CardGroup,
    CodeBlock,
    Frame,
    Steps,
    Step,
    Tab,
    Tabs,
  }
}
`

  await fs.writeFile(mdxComponentsPath, content)
}
