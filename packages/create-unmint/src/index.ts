#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import { init } from './commands/init.js'
import { update } from './commands/update.js'

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
    console.log()
    console.log(chalk.cyan.bold('  Unmint'))
    console.log(chalk.dim('  Beautiful documentation, open source'))
    console.log()

    if (options.update) {
      await update(options)
    } else {
      await init(projectName, options)
    }
  })

program.parse()
