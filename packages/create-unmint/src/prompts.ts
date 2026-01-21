import inquirer from 'inquirer'
import chalk from 'chalk'

export interface ProjectConfig {
  projectName: string
  description: string
  accentColor: string
  customAccent?: string
  githubUrl: string
  siteUrl: string
  initGit: boolean
  installDeps: boolean
}

const accentColors = [
  { name: 'Cyan', value: '#0891b2' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Custom', value: 'custom' },
]

export async function promptProjectConfig(defaultName?: string): Promise<ProjectConfig> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: defaultName || 'my-docs',
      validate: (input: string) => {
        if (!input.trim()) return 'Project name is required'
        if (!/^[a-z0-9-_]+$/i.test(input)) {
          return 'Project name can only contain letters, numbers, hyphens, and underscores'
        }
        return true
      },
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
      default: 'Documentation for my project',
    },
    {
      type: 'list',
      name: 'accentColor',
      message: 'Accent color:',
      choices: accentColors.map((c) => ({
        name: c.name === 'Cyan' ? `${c.name} ${chalk.dim('(default)')}` : c.name,
        value: c.value,
      })),
      default: '#0891b2',
    },
    {
      type: 'input',
      name: 'customAccent',
      message: 'Custom accent color (hex):',
      when: (answers) => answers.accentColor === 'custom',
      validate: (input: string) => {
        if (!/^#[0-9a-f]{6}$/i.test(input)) {
          return 'Please enter a valid hex color (e.g., #ff5733)'
        }
        return true
      },
    },
    {
      type: 'input',
      name: 'githubUrl',
      message: `GitHub URL ${chalk.dim('(optional)')}:`,
      default: '',
    },
    {
      type: 'input',
      name: 'siteUrl',
      message: 'Site URL:',
      default: 'https://docs.example.com',
    },
    {
      type: 'confirm',
      name: 'initGit',
      message: 'Initialize git repository?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'installDeps',
      message: 'Install dependencies?',
      default: true,
    },
  ])

  // Apply custom accent if selected
  if (answers.accentColor === 'custom' && answers.customAccent) {
    answers.accentColor = answers.customAccent
  }

  return answers
}

export function getDefaultConfig(projectName: string): ProjectConfig {
  return {
    projectName,
    description: 'Documentation for my project',
    accentColor: '#0891b2',
    githubUrl: '',
    siteUrl: 'https://docs.example.com',
    initGit: true,
    installDeps: true,
  }
}
