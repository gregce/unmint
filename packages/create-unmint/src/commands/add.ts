import chalk from 'chalk'
import ora from 'ora'
import path from 'path'
import fs from 'fs-extra'
import { execa } from 'execa'
import { detectProject, validateProjectForAdd, type ProjectInfo } from '../utils/detect-project.js'
import {
  mergeDependencies,
  mergeGlobalsCss,
  wrapNextConfig,
  createSourceConfig,
  createMdxComponents,
  lightenColor,
  UNMINT_DEPENDENCIES,
} from '../utils/merge.js'
import { promptAddConfig, type AddConfig } from '../prompts.js'

export interface AddOptions {
  yes?: boolean
  path?: string
}

/**
 * Add Unmint docs to an existing Next.js project
 */
export async function add(options: AddOptions = {}): Promise<void> {
  const cwd = process.cwd()

  // Step 1: Detect project
  const spinner = ora('Detecting project...').start()
  const projectInfo = await detectProject(cwd)

  // Step 2: Validate project
  const validation = validateProjectForAdd(projectInfo)
  if (!validation.valid) {
    spinner.fail(validation.error)
    process.exit(1)
  }

  spinner.succeed(`Detected Next.js project (App Router)`)
  console.log(chalk.dim(`  Using ${projectInfo.useSrcDir ? 'src/app' : 'app'} directory structure`))
  console.log()

  // Step 3: Check for existing docs route
  if (projectInfo.hasExistingDocs && !options.path) {
    console.log(chalk.yellow('⚠ A /docs route already exists in this project.'))
    console.log(chalk.dim('  Use --path to specify a different route (e.g., --path /documentation)'))
    console.log()
  }

  // Step 4: Get configuration
  const config = options.yes
    ? getDefaultAddConfig(options.path)
    : await promptAddConfig(projectInfo.hasExistingDocs, options.path)

  // Step 5: Check for route conflict
  const docsRoutePath = path.join(cwd, projectInfo.appDir, config.docsRoute.replace(/^\//, ''))
  if (await fs.pathExists(docsRoutePath)) {
    console.log(chalk.red(`\n✖ The route ${config.docsRoute} already exists at ${docsRoutePath}`))
    console.log(chalk.dim('  Choose a different route or manually merge the directories.'))
    process.exit(1)
  }

  console.log()
  console.log(chalk.cyan('  Adding Unmint to your project...'))
  console.log()

  // Step 6: Copy docs files
  await copyDocsFiles(cwd, projectInfo, config)

  // Step 7: Merge configurations
  await mergeConfigurations(cwd, projectInfo, config)

  // Step 8: Install dependencies
  await installDependencies(cwd, projectInfo.packageManager)

  // Step 9: Print success message
  printSuccessMessage(config, projectInfo.packageManager)
}

/**
 * Get default configuration for --yes mode
 */
function getDefaultAddConfig(customPath?: string): AddConfig {
  return {
    docsRoute: customPath || '/docs',
    title: 'Documentation',
    description: 'Documentation for your project',
    accentColor: '#0891b2',
  }
}

/**
 * Copy docs-specific files to the project
 */
async function copyDocsFiles(cwd: string, projectInfo: ProjectInfo, config: AddConfig): Promise<void> {
  const spinner = ora('Copying docs files...').start()

  // Resolve template directory (bundled or development)
  const templateDir = await resolveTemplateDir()

  const appDir = projectInfo.appDir
  const routeName = config.docsRoute.replace(/^\//, '')

  // Determine lib directory - should be src/lib if using src/app
  const libDir = projectInfo.useSrcDir ? 'src/lib' : 'lib'

  // Files to copy
  const copyOperations = [
    // Docs route
    {
      from: path.join(templateDir, 'app/docs'),
      to: path.join(cwd, appDir, routeName),
    },
    // Docs components
    {
      from: path.join(templateDir, 'app/components/docs'),
      to: path.join(cwd, appDir, 'components/docs'),
    },
    // Providers (theme provider)
    {
      from: path.join(templateDir, 'app/providers'),
      to: path.join(cwd, appDir, 'providers'),
    },
    // API routes
    {
      from: path.join(templateDir, 'app/api/search'),
      to: path.join(cwd, appDir, 'api/search'),
    },
    {
      from: path.join(templateDir, 'app/api/og'),
      to: path.join(cwd, appDir, 'api/og'),
    },
    // Content (always at root)
    {
      from: path.join(templateDir, 'content/docs'),
      to: path.join(cwd, 'content/docs'),
    },
    // Lib files (in src/lib if using src directory)
    {
      from: path.join(templateDir, 'lib/docs-source.ts'),
      to: path.join(cwd, libDir, 'docs-source.ts'),
    },
    {
      from: path.join(templateDir, 'lib/theme-config.ts'),
      to: path.join(cwd, libDir, 'unmint-config.ts'),
    },
    // Logo files (copy to public directory if not present)
    {
      from: path.join(templateDir, 'public/logo.svg'),
      to: path.join(cwd, 'public/logo.svg'),
    },
    {
      from: path.join(templateDir, 'public/logo.png'),
      to: path.join(cwd, 'public/logo.png'),
    },
  ]

  // Ensure lib and public directories exist
  await fs.ensureDir(path.join(cwd, 'public'))

  // Ensure lib directory exists
  await fs.ensureDir(path.join(cwd, libDir))

  for (const op of copyOperations) {
    if (await fs.pathExists(op.from)) {
      await fs.copy(op.from, op.to, { overwrite: false })
    }
  }

  // Copy utils.ts if it doesn't exist
  const utilsPath = path.join(cwd, libDir, 'utils.ts')
  if (!await fs.pathExists(utilsPath)) {
    await fs.copy(
      path.join(templateDir, 'lib/utils.ts'),
      utilsPath
    )
  }

  // Fix docs-source.ts import path for src directory structure
  if (projectInfo.useSrcDir) {
    const docsSourcePath = path.join(cwd, libDir, 'docs-source.ts')
    if (await fs.pathExists(docsSourcePath)) {
      let content = await fs.readFile(docsSourcePath, 'utf-8')
      // Change from '../.source/server' to '../../.source/server' for src/lib/
      content = content.replace(
        /from ['"]\.\.\/\.source\/server['"]/,
        "from '../../.source/server'"
      )
      await fs.writeFile(docsSourcePath, content)
    }
  }

  // Update all docs files to use unmint-config instead of theme-config
  await updateDocsImports(cwd, appDir, routeName)

  // Update theme-config with user values
  await updateThemeConfig(cwd, config)

  spinner.succeed(`Added ${appDir}/${routeName}/ route with layout`)
  ora().succeed(`Added docs components to ${appDir}/components/docs/`)
  ora().succeed('Added content/docs/ directory with sample content')
}

/**
 * Resolve the template directory
 */
async function resolveTemplateDir(): Promise<string> {
  // Check for bundled template (npm package)
  const bundledPath = path.join(import.meta.dirname, '../../template')
  if (await fs.pathExists(bundledPath)) {
    return bundledPath
  }

  // Development: template is sibling package
  const devPath = path.join(import.meta.dirname, '../../../template')
  if (await fs.pathExists(devPath)) {
    return devPath
  }

  throw new Error('Could not find template directory')
}

/**
 * Update all docs files to use unmint-config instead of theme-config
 */
async function updateDocsImports(cwd: string, appDir: string, routeName: string): Promise<void> {
  // Files that might have theme-config imports
  const filesToUpdate = [
    path.join(cwd, appDir, routeName, 'layout.tsx'),
    path.join(cwd, appDir, routeName, '[[...slug]]', 'page.tsx'),
    path.join(cwd, appDir, 'components/docs/docs-sidebar.tsx'),
    path.join(cwd, appDir, 'components/docs/docs-header.tsx'),
    path.join(cwd, appDir, 'components/docs/mobile-sidebar.tsx'),
    path.join(cwd, appDir, 'components/docs/search-dialog.tsx'),
    path.join(cwd, appDir, 'api/og/route.tsx'),
  ]

  for (const filePath of filesToUpdate) {
    if (await fs.pathExists(filePath)) {
      let content = await fs.readFile(filePath, 'utf-8')

      // Update to use unmint-config instead of theme-config
      if (content.includes('@/lib/theme-config')) {
        content = content.replace(
          /@\/lib\/theme-config/g,
          '@/lib/unmint-config'
        )
        await fs.writeFile(filePath, content)
      }
    }
  }
}

/**
 * Update theme config with user values
 */
async function updateThemeConfig(cwd: string, config: AddConfig): Promise<void> {
  const configPath = path.join(cwd, 'lib/unmint-config.ts')

  if (!await fs.pathExists(configPath)) return

  let content = await fs.readFile(configPath, 'utf-8')

  // Update name
  content = content.replace(
    /name:\s*['"][^'"]*['"]/,
    `name: '${config.title}'`
  )

  // Update description
  content = content.replace(
    /description:\s*['"][^'"]*['"]/,
    `description: '${config.description}'`
  )

  await fs.writeFile(configPath, content)
}

/**
 * Merge configuration files
 */
async function mergeConfigurations(cwd: string, projectInfo: ProjectInfo, config: AddConfig): Promise<void> {
  // Merge dependencies
  const packageJsonPath = path.join(cwd, 'package.json')
  const { added } = await mergeDependencies(packageJsonPath)
  if (added.length > 0) {
    ora().succeed(`Merged ${added.length} dependencies into package.json`)
  }

  // Merge globals.css
  if (projectInfo.globalsCssPath) {
    const darkAccent = lightenColor(config.accentColor, 30)
    const merged = await mergeGlobalsCss(projectInfo.globalsCssPath, config.accentColor, darkAccent)
    if (merged) {
      ora().succeed('Added CSS variables to globals.css')
    }
  }

  // Wrap next.config
  if (projectInfo.nextConfigPath) {
    const wrapped = await wrapNextConfig(projectInfo.nextConfigPath)
    if (wrapped) {
      ora().succeed('Updated next.config for MDX support')
    }
  }

  // Create source.config.ts
  await createSourceConfig(cwd)
  ora().succeed('Created source.config.ts')

  // Create mdx-components.tsx
  await createMdxComponents(cwd, projectInfo.appDir)
  ora().succeed('Created mdx-components.tsx')
}

/**
 * Install dependencies
 */
async function installDependencies(cwd: string, packageManager: string): Promise<void> {
  const spinner = ora('Installing dependencies...').start()

  try {
    const installCmd = packageManager === 'npm' ? 'install' : 'install'
    await execa(packageManager, [installCmd], { cwd, stdio: 'pipe' })
    spinner.succeed(`Installed ${Object.keys(UNMINT_DEPENDENCIES).join(', ')}`)
  } catch (error) {
    spinner.warn('Could not install dependencies automatically')
    console.log(chalk.dim(`  Run "${packageManager} install" manually`))
  }
}

/**
 * Print success message
 */
function printSuccessMessage(config: AddConfig, packageManager: string): void {
  console.log()
  console.log(chalk.green('  Success! Unmint docs added to your project.'))
  console.log()
  console.log('  Next steps:')
  console.log(chalk.cyan(`    ${packageManager} run dev`))
  console.log()
  console.log(`  Your docs will be at ${chalk.cyan(`http://localhost:3000${config.docsRoute}`)}`)
  console.log()
}
