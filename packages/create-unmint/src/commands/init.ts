import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import { execa } from 'execa'
import { promptProjectConfig, getDefaultConfig, type ProjectConfig } from '../prompts.js'
import { scaffoldProject } from '../scaffold.js'

interface InitOptions {
  yes?: boolean
}

export async function init(projectName?: string, options: InitOptions = {}): Promise<void> {
  let config: ProjectConfig

  if (options.yes && projectName) {
    // Use defaults with provided project name
    config = getDefaultConfig(projectName)
    console.log(chalk.dim('  Using default configuration...'))
    console.log()
  } else {
    // Interactive prompts
    config = await promptProjectConfig(projectName)
  }

  const targetDir = path.resolve(process.cwd(), config.projectName)

  // Check if directory already exists
  if (await fs.pathExists(targetDir)) {
    const isEmpty = (await fs.readdir(targetDir)).length === 0
    if (!isEmpty) {
      console.log(chalk.red(`  Error: Directory "${config.projectName}" already exists and is not empty.`))
      console.log(chalk.dim(`  Please choose a different name or remove the existing directory.`))
      process.exit(1)
    }
  }

  console.log()

  // Scaffold the project
  const scaffoldSpinner = ora('Creating project structure...').start()
  try {
    await scaffoldProject(targetDir, config)
    scaffoldSpinner.succeed('Project structure created')
  } catch (error) {
    scaffoldSpinner.fail('Failed to create project structure')
    console.error(chalk.red(`  ${error instanceof Error ? error.message : error}`))
    process.exit(1)
  }

  // Initialize git repository
  if (config.initGit) {
    const gitSpinner = ora('Initializing git repository...').start()
    try {
      await execa('git', ['init'], { cwd: targetDir })
      await execa('git', ['add', '-A'], { cwd: targetDir })
      await execa('git', ['commit', '-m', 'Initial commit from create-unmint'], { cwd: targetDir })
      gitSpinner.succeed('Git repository initialized')
    } catch (error) {
      gitSpinner.warn('Could not initialize git repository')
    }
  }

  // Install dependencies
  let depsInstalled = false
  if (config.installDeps) {
    const installSpinner = ora('Installing dependencies...').start()
    try {
      // Detect package manager
      const packageManager = await detectPackageManager()
      await execa(packageManager, ['install'], { cwd: targetDir, stdio: 'pipe' })
      installSpinner.succeed(`Dependencies installed with ${packageManager}`)
      depsInstalled = true
    } catch (error) {
      installSpinner.warn('Could not install dependencies')
      if (error instanceof Error && 'stderr' in error) {
        console.log(chalk.dim(`  ${(error as any).stderr?.slice(0, 200) || error.message}`))
      }
    }
  }

  // Success message
  console.log()
  console.log(chalk.green.bold('  Success!') + ` Created ${chalk.cyan(config.projectName)}`)
  console.log()
  console.log('  Next steps:')
  console.log()
  console.log(chalk.cyan(`    cd ${config.projectName}`))
  if (!depsInstalled) {
    console.log(chalk.cyan('    npm install'))
  }
  console.log(chalk.cyan('    npm run dev'))
  console.log()
  console.log(chalk.dim(`  Your docs will be at ${chalk.white('http://localhost:3000')}`))
  console.log()
}

async function detectPackageManager(): Promise<string> {
  // Check for lock files in current directory
  const cwd = process.cwd()

  if (await fs.pathExists(path.join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm'
  }
  if (await fs.pathExists(path.join(cwd, 'yarn.lock'))) {
    return 'yarn'
  }
  if (await fs.pathExists(path.join(cwd, 'bun.lockb'))) {
    return 'bun'
  }

  // Check for npm_config_user_agent to detect how the script was run
  const userAgent = process.env.npm_config_user_agent || ''
  if (userAgent.includes('pnpm')) return 'pnpm'
  if (userAgent.includes('yarn')) return 'yarn'
  if (userAgent.includes('bun')) return 'bun'

  return 'npm'
}
