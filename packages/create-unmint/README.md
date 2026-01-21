# create-unmint

Create beautiful documentation sites with Unmint - a free, open-source Mintlify alternative.

## Usage

```bash
# Create a new documentation project
npx create-unmint@latest my-docs

# Create with all defaults (skip prompts)
npx create-unmint@latest my-docs --yes

# Update an existing project
cd my-docs
npx create-unmint@latest --update
```

## What You Get

- **Beautiful out-of-the-box** - Professional styling without configuration
- **MDX Components** - Cards, callouts, tabs, steps, accordions, and more
- **Built-in Search** - Full-text search powered by Fumadocs
- **Dynamic OG Images** - Auto-generated social preview images
- **Dark Mode** - Seamless light/dark theme switching
- **Easy Theming** - Single config file for all customization

## Interactive Setup

When you run `npx create-unmint@latest`, you'll be prompted to configure:

- **Project name** - Name of your documentation project
- **Description** - A brief description for SEO and metadata
- **Accent color** - Choose from presets or enter a custom hex color
- **GitHub URL** - Link to your project's repository (optional)
- **Site URL** - Where your docs will be deployed

## Project Structure

```
my-docs/
├── app/                  # Next.js app directory
├── content/
│   └── docs/            # Your MDX documentation files
├── lib/
│   └── theme-config.ts  # Site configuration
└── public/              # Static assets (logo, images)
```

## Learn More

- [Unmint GitHub](https://github.com/gregce/unmint)
- [Fumadocs Documentation](https://fumadocs.vercel.app)

## License

MIT
