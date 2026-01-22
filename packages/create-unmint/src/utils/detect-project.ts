import fs from 'fs-extra'
import path from 'path'

export interface ProjectInfo {
  isExistingProject: boolean
  framework: 'next-app' | 'next-pages' | 'unknown'
  useSrcDir: boolean
  appDir: string
  hasExistingDocs: boolean
  hasFumadocs: boolean
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun'
  nextConfigPath: string | null
  globalsCssPath: string | null
  tailwindConfigPath: string | null
}

/**
 * Detect project structure and framework
 */
export async function detectProject(cwd: string): Promise<ProjectInfo> {
  const result: ProjectInfo = {
    isExistingProject: false,
    framework: 'unknown',
    useSrcDir: false,
    appDir: 'app',
    hasExistingDocs: false,
    hasFumadocs: false,
    packageManager: 'npm',
    nextConfigPath: null,
    globalsCssPath: null,
    tailwindConfigPath: null,
  }

  // Check for package.json
  const packageJsonPath = path.join(cwd, 'package.json')
  if (!await fs.pathExists(packageJsonPath)) {
    return result
  }

  result.isExistingProject = true

  // Check for Next.js config files
  const nextConfigExtensions = ['js', 'ts', 'mjs']
  for (const ext of nextConfigExtensions) {
    const configPath = path.join(cwd, `next.config.${ext}`)
    if (await fs.pathExists(configPath)) {
      result.nextConfigPath = configPath
      break
    }
  }

  if (!result.nextConfigPath) {
    return result
  }

  // Detect src/app vs app directory structure
  const srcAppPath = path.join(cwd, 'src/app')
  const appPath = path.join(cwd, 'app')

  if (await fs.pathExists(srcAppPath)) {
    result.useSrcDir = true
    result.appDir = 'src/app'
    result.framework = 'next-app'
  } else if (await fs.pathExists(appPath)) {
    result.useSrcDir = false
    result.appDir = 'app'
    result.framework = 'next-app'
  } else {
    // Check for pages directory (Pages Router)
    const pagesPath = path.join(cwd, 'pages')
    const srcPagesPath = path.join(cwd, 'src/pages')
    if (await fs.pathExists(pagesPath) || await fs.pathExists(srcPagesPath)) {
      result.framework = 'next-pages'
    }
    return result
  }

  // Check for existing /docs route
  const docsPath = path.join(cwd, result.appDir, 'docs')
  result.hasExistingDocs = await fs.pathExists(docsPath)

  // Check for fumadocs in dependencies
  try {
    const pkg = await fs.readJson(packageJsonPath)
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    }
    result.hasFumadocs = 'fumadocs-core' in allDeps || 'fumadocs-mdx' in allDeps
  } catch {
    // Ignore JSON parse errors
  }

  // Detect package manager
  result.packageManager = await detectPackageManager(cwd)

  // Find globals.css
  const globalsCssPaths = [
    path.join(cwd, result.appDir, 'globals.css'),
    path.join(cwd, 'src/styles/globals.css'),
    path.join(cwd, 'styles/globals.css'),
  ]
  for (const cssPath of globalsCssPaths) {
    if (await fs.pathExists(cssPath)) {
      result.globalsCssPath = cssPath
      break
    }
  }

  // Find tailwind.config
  const tailwindConfigExtensions = ['ts', 'js', 'mjs']
  for (const ext of tailwindConfigExtensions) {
    const configPath = path.join(cwd, `tailwind.config.${ext}`)
    if (await fs.pathExists(configPath)) {
      result.tailwindConfigPath = configPath
      break
    }
  }

  return result
}

/**
 * Detect package manager from lock files
 */
async function detectPackageManager(cwd: string): Promise<'npm' | 'pnpm' | 'yarn' | 'bun'> {
  if (await fs.pathExists(path.join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm'
  }
  if (await fs.pathExists(path.join(cwd, 'yarn.lock'))) {
    return 'yarn'
  }
  if (await fs.pathExists(path.join(cwd, 'bun.lockb'))) {
    return 'bun'
  }

  // Check npm_config_user_agent for the package manager that invoked us
  const userAgent = process.env.npm_config_user_agent || ''
  if (userAgent.includes('pnpm')) return 'pnpm'
  if (userAgent.includes('yarn')) return 'yarn'
  if (userAgent.includes('bun')) return 'bun'

  return 'npm'
}

/**
 * Validate project for adding Unmint docs
 */
export function validateProjectForAdd(info: ProjectInfo): { valid: boolean; error?: string } {
  if (!info.isExistingProject) {
    return {
      valid: false,
      error: 'No package.json found. Use "npx create-unmint my-docs" to create a new project.',
    }
  }

  if (!info.nextConfigPath) {
    return {
      valid: false,
      error: 'No Next.js config found. This directory does not appear to be a Next.js project.',
    }
  }

  if (info.framework === 'next-pages') {
    return {
      valid: false,
      error: 'Unmint requires App Router. Your project appears to use Pages Router.',
    }
  }

  if (info.framework === 'unknown') {
    return {
      valid: false,
      error: 'Could not detect app directory. Make sure your project uses the Next.js App Router.',
    }
  }

  return { valid: true }
}
