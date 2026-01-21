#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import figlet from 'figlet'
import gradient from 'gradient-string'
import { init } from './commands/init.js'
import { update } from './commands/update.js'

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
  .version('1.0.0')

program
  .argument('[project-name]', 'Name of the project to create')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('--update', 'Update an existing Unmint project')
  .option('--dry-run', 'Show what would be updated without making changes')
  .action(async (projectName, options) => {
    printBanner()

    if (options.update) {
      await update(options)
    } else {
      await init(projectName, options)
    }
  })

program.parse()
