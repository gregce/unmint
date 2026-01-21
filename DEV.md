# Unmint Development Guide

## Repository Structure

This is a monorepo containing two packages:

```
unmint/
├── packages/
│   ├── create-unmint/   # CLI tool published to npm
│   └── template/        # Documentation template
├── .github/
│   └── workflows/
│       └── release.yml  # Automated release workflow
├── package.json         # Root workspace config
└── pnpm-workspace.yaml
```

## Local Development

### Prerequisites

- Node.js 20+
- npm (or pnpm)

### Setup

```bash
# Clone the repo
git clone https://github.com/gregce/unmint.git
cd unmint

# Install CLI dependencies
cd packages/create-unmint
npm install

# Build the CLI
npm run build

# Link for local testing
npm link
```

### Testing the CLI Locally

After linking, you can test the CLI anywhere:

```bash
# Create a test project
cd /tmp
create-unmint my-test-docs --yes

# Or with interactive prompts
create-unmint my-test-docs
```

### Working on the Template

```bash
cd packages/template
npm install
npm run dev
```

Open http://localhost:3000 to see the docs.

## CLI Architecture

### Entry Point

`packages/create-unmint/src/index.ts` - Commander.js CLI with two modes:
- Default: `npx create-unmint my-docs` → runs init
- Update: `npx create-unmint --update` → runs update

### Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | CLI entry point and argument parsing |
| `src/commands/init.ts` | Creates new projects |
| `src/commands/update.ts` | Updates existing projects (skeleton) |
| `src/prompts.ts` | Interactive prompts (inquirer) |
| `src/scaffold.ts` | File copying and transformation |

### Build Process

```bash
npm run build
```

This runs:
1. `tsup` to compile TypeScript → `dist/index.js`
2. Copies `packages/template/` → `packages/create-unmint/template/`

The template is bundled with the CLI package for offline use.

## Releasing

### Automated Release (Recommended)

1. Go to **GitHub Actions** → **Release** → **Run workflow**
2. Enter version:
   - `patch` → bumps 1.0.0 → 1.0.1
   - `minor` → bumps 1.0.0 → 1.1.0
   - `major` → bumps 1.0.0 → 2.0.0
   - Or specific version like `1.2.3`
3. Click **Run workflow**

The workflow automatically:
1. Bumps version in `package.json`
2. Builds the CLI
3. Commits the version bump to main
4. Creates a git tag
5. Publishes to npm
6. Creates a GitHub release with auto-generated notes

### Manual Release (if needed)

```bash
cd packages/create-unmint

# Bump version
npm version patch  # or minor, major, or specific version

# Build
npm run build

# Publish
npm publish --access public

# Push changes
git push origin main --tags
```

### Required Secrets

In GitHub repo settings → Secrets → Actions:

| Secret | Description |
|--------|-------------|
| `NPM_TOKEN` | npm access token with publish permissions |

To create an npm token:
```bash
npm login
npm token create
```

## Project Configuration

### CLI Prompts

Users are prompted for:
- Project name
- Description
- Accent color (6 presets + custom hex)
- GitHub URL (optional)
- Site URL
- Initialize git (yes/no)
- Install dependencies (yes/no)

### File Transformations

When scaffolding, these files are transformed:

| File | Transformation |
|------|----------------|
| `package.json` | Sets name, description, version |
| `lib/theme-config.ts` | Updates site name, description, URLs |
| `app/globals.css` | Applies custom accent color |
| `content/docs/index.mdx` | Updates welcome page title |
| `README.md` | Generates project-specific readme |

### Version Tracking

Projects created with the CLI have `.unmint/version.json`:

```json
{
  "version": "1.0.0",
  "installedAt": "2025-01-21T00:00:00.000Z",
  "generator": "create-unmint"
}
```

This enables future update functionality.

## Future Improvements

### Update Command

The update command (`--update`) has a skeleton implementation. Full implementation would:

1. Fetch latest template from npm/GitHub
2. Compare files against user's project
3. Show diff for modified files
4. Apply safe updates (framework files)
5. Skip protected files (user content, theme config)
6. Create backups before updating

### Protected Files (never auto-updated)
- `lib/theme-config.ts`
- `content/docs/*`
- `public/*`
- `.env*`

### Safe Update Files
- `app/api/*`
- `app/components/docs/mdx/*`
- Core framework files

## Troubleshooting

### CLI not found after `npm link`

```bash
# Check if linked
npm ls -g create-unmint

# Re-link
cd packages/create-unmint
npm unlink
npm link
```

### Build errors

```bash
# Clean and rebuild
cd packages/create-unmint
rm -rf dist template
npm run build
```

### Template not found error

The CLI looks for the template in two locations:
1. `./template` (bundled in npm package)
2. `../../template` (development monorepo)

If neither exists, run `npm run build` to copy the template.
