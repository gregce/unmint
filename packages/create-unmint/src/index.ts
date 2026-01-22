#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import figlet from 'figlet'
import gradient from 'gradient-string'
import fs from 'fs-extra'
import path from 'path'
import { init } from './commands/init.js'
import { update } from './commands/update.js'
import { add } from './commands/add.js'

// Custom cyan gradient (dark to light teal/cyan)
const cyanGradient = gradient([
  '#065f5f',  // dark teal
  '#0d7377',  // medium teal
  '#14a3a8',  // teal
  '#32c4c4',  // cyan
  '#5ce1e6',  // light cyan
])

// ASCII art banner with cyan gradient
function printBanner() {
  const banner = figlet.textSync('UNMINT', {
    font: 'ANSI Shadow',
    horizontalLayout: 'default',
  })

  console.log()
  console.log(cyanGradient.multiline(banner))
  console.log(chalk.dim('  Beautiful documentation, open source'))
  console.log()
}

const program = new Command()

program
  .name('create-unmint')
  .description('Create and manage Unmint documentation projects')
  .version('1.2.0')

program
  .argument('[project-name]', 'Name of the project to create (use "." for current directory)')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('--add', 'Add Unmint docs to an existing Next.js project')
  .option('--path <route>', 'Custom route path for docs (e.g., /documentation)')
  .option('--update', 'Update an existing Unmint project')
  .option('--dry-run', 'Show what would be updated without making changes')
  .action(async (projectName, options) => {
    printBanner()

    // Handle --update flag
    if (options.update) {
      await update(options)
      return
    }

    // Handle --add flag
    if (options.add) {
      await add({ yes: options.yes, path: options.path })
      return
    }

    // Auto-detect: if projectName is "." and current dir has next.config, use add mode
    if (projectName === '.') {
      const cwd = process.cwd()
      const hasNextConfig = await fs.pathExists(path.join(cwd, 'next.config.ts')) ||
                           await fs.pathExists(path.join(cwd, 'next.config.js')) ||
                           await fs.pathExists(path.join(cwd, 'next.config.mjs'))

      if (hasNextConfig) {
        console.log(chalk.dim('  Detected existing Next.js project, using add mode...'))
        console.log()
        await add({ yes: options.yes, path: options.path })
        return
      }
    }

    // Default: create new project
    await init(projectName, options)
  })

program.parse()
