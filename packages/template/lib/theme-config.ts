/**
 * Unmint Theme Configuration
 *
 * Customize your documentation's look and feel by modifying this file.
 * All colors, branding, and styling can be adjusted here.
 */

export const siteConfig = {
  // Site metadata
  name: 'Unmint',
  description: 'A free, open-source Mintlify-style documentation system',
  url: 'https://docs.example.com',

  // Logo configuration
  logo: {
    src: '/logo.svg',
    alt: 'Unmint',
    width: 40,
    height: 40,
  },

  // Navigation links
  links: {
    github: 'https://github.com/your-org/your-repo',
    discord: 'https://discord.gg/your-invite',
    twitter: 'https://twitter.com/yourhandle',
    support: 'mailto:support@example.com',
  },

  // Footer configuration
  footer: {
    companyName: 'Your Company',
    links: [
      { label: 'Website', href: 'https://example.com' },
      { label: 'GitHub', href: 'https://github.com/your-org' },
    ],
  },
}

export const themeConfig = {
  // Primary accent color - used for active states, links, highlights
  colors: {
    // Light mode
    light: {
      accent: '#0891b2',        // Primary accent color
      accentForeground: '#ffffff',
      accentMuted: 'rgba(8, 145, 178, 0.1)',
    },
    // Dark mode
    dark: {
      accent: '#22d3ee',        // Brighter for dark backgrounds
      accentForeground: '#0f172a',
      accentMuted: 'rgba(34, 211, 238, 0.1)',
    },
  },

  // Code block styling
  codeBlock: {
    light: {
      background: '#fafafa',
      titleBar: '#f3f4f6',
    },
    dark: {
      background: '#1a1a1f',
      titleBar: '#1f2937',
    },
  },

  // OG Image generation settings
  ogImage: {
    // Gradient background (CSS gradient string)
    gradient: 'linear-gradient(135deg, #ffffff 0%, #e0f7fa 50%, #67e8f9 100%)',
    // Text colors
    titleColor: '#0f172a',
    sectionColor: '#0891b2',
    // Logo URL (absolute URL required for OG images)
    logoUrl: 'https://example.com/logo.png',
  },
}

// Export CSS variable values for use in Tailwind
export function getCSSVariables(mode: 'light' | 'dark') {
  const colors = themeConfig.colors[mode]
  return {
    '--accent': colors.accent,
    '--accent-foreground': colors.accentForeground,
    '--accent-muted': colors.accentMuted,
  }
}

/**
 * Get the site URL dynamically
 * Priority: NEXT_PUBLIC_SITE_URL > VERCEL_PROJECT_PRODUCTION_URL > VERCEL_URL > siteConfig.url
 * This allows OG images to work automatically on Vercel without configuration
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  // Use production URL if available (custom domain)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  // Fallback to deployment URL for preview deployments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return siteConfig.url
}
