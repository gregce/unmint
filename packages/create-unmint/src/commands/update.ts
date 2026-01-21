import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'

interface UpdateOptions {
  dryRun?: boolean
}

// Files that are protected and should never be auto-updated
const PROTECTED_FILES = [
  'lib/theme-config.ts',
  'content/**/*',
  'public/**/*',
  '.env',
  '.env.local',
]

// Files that are safe to update (core framework files)
const SAFE_UPDATE_FILES = [
  'app/api/**/*',
  'app/components/docs/mdx/**/*',
  'app/layout.tsx',
  'app/docs/**/*',
  'lib/source.ts',
  'tailwind.config.ts',
  'next.config.mjs',
]

export async function update(options: UpdateOptions = {}): Promise<void> {
  const cwd = process.cwd()
  const versionFilePath = path.join(cwd, '.unmint/version.json')

  // Check if this is an Unmint project
  if (!await fs.pathExists(versionFilePath)) {
    console.log(chalk.red('  Error: This does not appear to be an Unmint project.'))
    console.log(chalk.dim('  Run this command from the root of an Unmint documentation project.'))
    console.log()
    console.log(chalk.dim('  To create a new project, run:'))
    console.log(chalk.cyan('    npx create-unmint@latest my-docs'))
    process.exit(1)
  }

  const versionInfo = await fs.readJson(versionFilePath)
  const currentVersion = versionInfo.version

  console.log(chalk.dim(`  Current version: ${currentVersion}`))
  console.log()

  if (options.dryRun) {
    console.log(chalk.yellow('  Dry run mode - no changes will be made'))
    console.log()
  }

  const spinner = ora('Checking for updates...').start()

  try {
    // For now, we'll implement a simple update check
    // In production, this would fetch from npm registry or GitHub
    const latestVersion = '1.0.0' // TODO: Fetch from registry

    if (currentVersion === latestVersion) {
      spinner.succeed('Already up to date!')
      return
    }

    spinner.info(`Update available: ${currentVersion} → ${latestVersion}`)
    console.log()

    // Show what would be updated
    const changes = await analyzeChanges(cwd)

    if (changes.length === 0) {
      console.log(chalk.green('  No files need updating.'))
      return
    }

    console.log('  Changes:')
    for (const change of changes) {
      const icon = change.type === 'update' ? '↻' : change.type === 'add' ? '+' : '−'
      const color = change.type === 'update' ? chalk.blue : change.type === 'add' ? chalk.green : chalk.red
      const status = change.protected ? chalk.yellow(' (protected - skip)') : ''
      console.log(`    ${color(icon)} ${change.file}${status}`)
    }
    console.log()

    if (options.dryRun) {
      console.log(chalk.dim('  Dry run complete. No changes were made.'))
      return
    }

    // Confirm update
    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Proceed with update?',
        default: true,
      },
    ])

    if (!proceed) {
      console.log(chalk.dim('  Update cancelled.'))
      return
    }

    // Create backup
    const backupSpinner = ora('Creating backup...').start()
    const backupDir = await createBackup(cwd)
    backupSpinner.succeed(`Backup created at ${path.relative(cwd, backupDir)}`)

    // Apply updates
    const updateSpinner = ora('Applying updates...').start()
    const results = await applyUpdates(cwd, changes)
    updateSpinner.succeed('Updates applied')

    // Update version file
    versionInfo.version = latestVersion
    versionInfo.updatedAt = new Date().toISOString()
    await fs.writeJson(versionFilePath, versionInfo, { spaces: 2 })

    // Summary
    console.log()
    console.log(chalk.green.bold('  Update complete!'))
    console.log()
    console.log(`    Updated: ${results.updated}`)
    console.log(`    Skipped: ${results.skipped}`)
    console.log(`    Added:   ${results.added}`)
    console.log()

  } catch (error) {
    spinner.fail('Update failed')
    console.error(chalk.red(`  ${error instanceof Error ? error.message : error}`))
    process.exit(1)
  }
}

interface FileChange {
  file: string
  type: 'update' | 'add' | 'remove'
  protected: boolean
}

async function analyzeChanges(projectDir: string): Promise<FileChange[]> {
  // TODO: In production, this would compare against the latest template
  // For now, return empty array as placeholder
  return []
}

async function createBackup(projectDir: string): Promise<string> {
  const timestamp = new Date().toISOString().split('T')[0]
  const backupDir = path.join(projectDir, '.unmint/backup', timestamp)

  await fs.ensureDir(backupDir)

  // Copy key files to backup
  const filesToBackup = [
    'lib/theme-config.ts',
    'app/globals.css',
    'package.json',
  ]

  for (const file of filesToBackup) {
    const sourcePath = path.join(projectDir, file)
    if (await fs.pathExists(sourcePath)) {
      const targetPath = path.join(backupDir, file)
      await fs.ensureDir(path.dirname(targetPath))
      await fs.copy(sourcePath, targetPath)
    }
  }

  return backupDir
}

interface UpdateResults {
  updated: number
  skipped: number
  added: number
}

async function applyUpdates(
  projectDir: string,
  changes: FileChange[]
): Promise<UpdateResults> {
  const results: UpdateResults = {
    updated: 0,
    skipped: 0,
    added: 0,
  }

  for (const change of changes) {
    if (change.protected) {
      results.skipped++
      continue
    }

    // TODO: Apply actual file changes from template
    if (change.type === 'update') {
      results.updated++
    } else if (change.type === 'add') {
      results.added++
    }
  }

  return results
}
