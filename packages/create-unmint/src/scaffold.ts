import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import type { ProjectConfig } from './prompts.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Files that should be transformed with user config
const TRANSFORM_FILES = [
  'lib/theme-config.ts',
  'package.json',
  'content/docs/index.mdx',
]

// Files/directories to exclude from copying
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  '.turbo',
  '.vercel',
]

export async function scaffoldProject(
  targetDir: string,
  config: ProjectConfig
): Promise<void> {
  // Template location depends on context:
  // - In npm package: ./template (bundled with package)
  // - In development: ../../template (monorepo sibling)
  const bundledTemplate = path.resolve(__dirname, '../template')
  const devTemplate = path.resolve(__dirname, '../../template')

  const templateDir = await fs.pathExists(bundledTemplate)
    ? bundledTemplate
    : devTemplate

  // Check if template exists
  if (!await fs.pathExists(templateDir)) {
    throw new Error(`Template not found. Please ensure you're running from a valid create-unmint installation.`)
  }

  // Create target directory
  await fs.ensureDir(targetDir)

  // Copy template files
  await copyTemplateFiles(templateDir, targetDir)

  // Transform files with user config
  await transformFiles(targetDir, config)

  // Create .unmint version tracking
  await createVersionFile(targetDir)
}

async function copyTemplateFiles(
  sourceDir: string,
  targetDir: string
): Promise<void> {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true })

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name)
    const targetPath = path.join(targetDir, entry.name)

    // Skip excluded patterns
    if (EXCLUDE_PATTERNS.some((pattern) => entry.name === pattern)) {
      continue
    }

    if (entry.isDirectory()) {
      await fs.ensureDir(targetPath)
      await copyTemplateFiles(sourcePath, targetPath)
    } else {
      await fs.copy(sourcePath, targetPath)
    }
  }
}

async function transformFiles(
  targetDir: string,
  config: ProjectConfig
): Promise<void> {
  // Transform package.json
  const packageJsonPath = path.join(targetDir, 'package.json')
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath)
    packageJson.name = config.projectName
    packageJson.description = config.description
    packageJson.version = '0.1.0'
    // Remove unmint-specific fields
    delete packageJson.repository
    delete packageJson.keywords
    delete packageJson.author
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })
  }

  // Transform theme-config.ts
  const themeConfigPath = path.join(targetDir, 'lib/theme-config.ts')
  if (await fs.pathExists(themeConfigPath)) {
    let content = await fs.readFile(themeConfigPath, 'utf-8')

    // Update site name
    content = content.replace(
      /name:\s*['"][^'"]*['"]/,
      `name: '${config.projectName}'`
    )

    // Update description
    content = content.replace(
      /description:\s*['"][^'"]*['"]/,
      `description: '${config.description}'`
    )

    // Update URL
    content = content.replace(
      /url:\s*['"][^'"]*['"]/,
      `url: '${config.siteUrl}'`
    )

    // Update GitHub URL if provided
    if (config.githubUrl) {
      content = content.replace(
        /github:\s*['"][^'"]*['"]/,
        `github: '${config.githubUrl}'`
      )
    }

    await fs.writeFile(themeConfigPath, content)
  }

  // Transform globals.css for accent color
  const globalsCssPath = path.join(targetDir, 'app/globals.css')
  if (await fs.pathExists(globalsCssPath)) {
    let content = await fs.readFile(globalsCssPath, 'utf-8')

    // Replace default accent color with user's choice
    content = content.replace(
      /--accent:\s*#[0-9a-fA-F]{6}/g,
      `--accent: ${config.accentColor}`
    )

    // Generate lighter version for dark mode (rough approximation)
    const lighterAccent = lightenColor(config.accentColor)
    content = content.replace(
      /\.dark\s*\{[^}]*--accent:\s*#[0-9a-fA-F]{6}/,
      (match) => match.replace(/--accent:\s*#[0-9a-fA-F]{6}/, `--accent: ${lighterAccent}`)
    )

    await fs.writeFile(globalsCssPath, content)
  }

  // Update welcome page
  const indexMdxPath = path.join(targetDir, 'content/docs/index.mdx')
  if (await fs.pathExists(indexMdxPath)) {
    let content = await fs.readFile(indexMdxPath, 'utf-8')

    // Update title
    content = content.replace(
      /title:\s*['"][^'"]*['"]/,
      `title: '${config.projectName}'`
    )

    // Update description
    content = content.replace(
      /description:\s*['"][^'"]*['"]/,
      `description: '${config.description}'`
    )

    await fs.writeFile(indexMdxPath, content)
  }

  // Create project README
  const readmePath = path.join(targetDir, 'README.md')
  await fs.writeFile(readmePath, generateReadme(config))
}

async function createVersionFile(targetDir: string): Promise<void> {
  const unmintDir = path.join(targetDir, '.unmint')
  await fs.ensureDir(unmintDir)

  const versionInfo = {
    version: '1.0.0',
    installedAt: new Date().toISOString(),
    generator: 'create-unmint',
  }

  await fs.writeJson(path.join(unmintDir, 'version.json'), versionInfo, { spaces: 2 })
}

function lightenColor(hex: string): string {
  // Simple color lightening for dark mode accent
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  const lighten = (c: number) => Math.min(255, Math.round(c + (255 - c) * 0.3))

  const lr = lighten(r).toString(16).padStart(2, '0')
  const lg = lighten(g).toString(16).padStart(2, '0')
  const lb = lighten(b).toString(16).padStart(2, '0')

  return `#${lr}${lg}${lb}`
}

function generateReadme(config: ProjectConfig): string {
  return `# ${config.projectName}

${config.description}

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

Your docs will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

\`\`\`
├── app/                  # Next.js app directory
├── content/
│   └── docs/            # Your documentation (MDX files)
├── lib/
│   └── theme-config.ts  # Site configuration
└── public/              # Static assets
\`\`\`

## Writing Documentation

Add MDX files to \`content/docs/\` to create new pages. The sidebar navigation is automatically generated based on your file structure.

## Built with Unmint

This documentation site was created with [Unmint](https://github.com/gregce/unmint), a free and open-source documentation system.
`
}
