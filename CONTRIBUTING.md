# Contributing to Unmint

Thank you for your interest in contributing to Unmint! This guide will help you get started.

## Project Structure

Unmint is a monorepo with two main packages:

```
unmint/
├── packages/
│   ├── create-unmint/   # CLI tool (npm: create-unmint)
│   │   ├── src/
│   │   │   ├── commands/    # init, update commands
│   │   │   ├── prompts.ts   # Interactive prompts
│   │   │   └── scaffold.ts  # File copying/transformation
│   │   └── package.json
│   │
│   └── template/            # Documentation template
│       ├── app/
│       │   ├── components/docs/mdx/  # MDX components
│       │   └── docs/                  # Docs routes
│       ├── content/docs/    # Sample documentation
│       ├── lib/
│       │   └── theme-config.ts       # Theme configuration
│       └── package.json
│
├── .github/
│   └── workflows/release.yml  # Automated releases
├── README.md
├── DEV.md                     # Developer guide
└── CONTRIBUTING.md            # This file
```

### Package Overview

| Package | Purpose | npm |
|---------|---------|-----|
| `create-unmint` | CLI for scaffolding new projects | `npx create-unmint@latest` |
| `template` | The actual documentation template | Bundled with CLI |

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm

### Local Development Setup

```bash
# Clone the repo
git clone https://github.com/gregce/unmint.git
cd unmint

# Install CLI dependencies
cd packages/create-unmint
npm install

# Build and link CLI for local testing
npm run build
npm link

# Test CLI locally
cd /tmp
create-unmint test-project --yes
```

### Working on the Template

```bash
cd packages/template
npm install
npm run dev
```

Open http://localhost:3000 to see the docs.

## Contributing to the CLI

The CLI (`packages/create-unmint/`) handles project scaffolding.

### Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Entry point, argument parsing |
| `src/commands/init.ts` | Creates new projects |
| `src/commands/update.ts` | Updates existing projects |
| `src/prompts.ts` | Interactive prompts (inquirer) |
| `src/scaffold.ts` | File copying and transformation |

### Making CLI Changes

1. Make your changes in `src/`
2. Build: `npm run build`
3. Test locally: `create-unmint test-project --yes`
4. Verify the scaffolded project works: `cd test-project && npm run dev`

### CLI Contribution Ideas

- Improve error messages and validation
- Add new prompt options (e.g., package manager selection)
- Enhance the update command
- Add `--template` flag for different templates
- Improve progress indicators

## Contributing to the Template

The template (`packages/template/`) is what users get when they scaffold a project.

### Key Areas

| Directory | Purpose |
|-----------|---------|
| `app/components/docs/mdx/` | MDX components (Card, Callout, Tabs, etc.) |
| `app/components/docs/` | Layout components (sidebar, header, TOC) |
| `app/docs/` | Documentation page routes |
| `lib/theme-config.ts` | Theme and site configuration |
| `app/globals.css` | Global styles and CSS variables |
| `content/docs/` | Sample documentation content |

### Making Template Changes

1. Make your changes
2. Test locally: `npm run dev`
3. Verify build works: `npm run build`
4. Test that CLI scaffolds correctly with your changes:
   ```bash
   cd ../create-unmint
   npm run build  # This copies template
   create-unmint /tmp/test-project --yes
   cd /tmp/test-project && npm run dev
   ```

### Template Contribution Ideas

- Add new MDX components
- Improve existing component styling
- Add dark mode improvements
- Enhance search functionality
- Add new theme options
- Improve mobile responsiveness
- Add accessibility improvements

## Adding a New MDX Component

1. Create the component in `packages/template/app/components/docs/mdx/`:

```tsx
// my-component.tsx
interface MyComponentProps {
  title: string
  children: React.ReactNode
}

export function MyComponent({ title, children }: MyComponentProps) {
  return (
    <div className="my-component">
      <h3>{title}</h3>
      {children}
    </div>
  )
}
```

2. Export it in `packages/template/app/components/docs/mdx/index.tsx`:

```tsx
export { MyComponent } from './my-component'
```

3. Add documentation in `packages/template/content/docs/components.mdx`

4. Add tests in `packages/template/__tests__/components/`

## Code Style

- TypeScript for all code
- Use existing patterns in the codebase
- Keep components simple and focused
- Add JSDoc comments for public APIs
- Use Tailwind CSS for styling

## Testing

### Template Tests

```bash
cd packages/template
npm test
```

### Manual Testing

Always test the full flow:
1. Build the CLI
2. Scaffold a new project
3. Run the scaffolded project
4. Verify your changes work

## Pull Request Guidelines

### Before Submitting

- [ ] Test your changes locally
- [ ] Run the build: `npm run build`
- [ ] Test CLI scaffolding if template changed
- [ ] Update documentation if needed

### PR Title Format

Use conventional commit format:
- `feat(cli): add package manager selection`
- `fix(template): correct dark mode colors`
- `docs: update contributing guide`
- `chore: update dependencies`

### PR Description

Include:
- What the change does
- Why it's needed
- How to test it
- Screenshots for visual changes

## Issue Guidelines

### Bug Reports

- Specify whether it's a **CLI** or **Template** issue
- Include reproduction steps
- Include error messages
- Include environment info (Node version, OS)

### Feature Requests

- Explain the use case
- Describe the proposed solution
- Note if you're willing to implement it

## Release Process (Maintainers)

Releases are automated via GitHub Actions.

### To Release

**Option 1: Git tag**
```bash
git tag v1.0.2
git push origin v1.0.2
```

**Option 2: GitHub Actions UI**
1. Go to Actions → Release → Run workflow
2. Enter version: `patch`, `minor`, `major`, or specific version

The workflow will:
1. Bump version in package.json
2. Build the CLI
3. Publish to npm
4. Create GitHub release

## Getting Help

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Be respectful and constructive

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
