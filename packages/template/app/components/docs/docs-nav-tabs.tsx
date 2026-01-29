'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavTab {
  label: string
  href: string
  matchPrefix: string
}

interface DocsNavTabsProps {
  tabs?: NavTab[]
}

const defaultTabs: NavTab[] = [
  { label: 'Documentation', href: '/docs', matchPrefix: '/docs' },
  { label: 'API Reference', href: '/docs/api-reference', matchPrefix: '/docs/api-reference' },
]

export function DocsNavTabs({ tabs = defaultTabs }: DocsNavTabsProps) {
  const pathname = usePathname()

  // Determine active tab - more specific paths take priority
  const activeTab = tabs
    .filter(tab => pathname.startsWith(tab.matchPrefix))
    .sort((a, b) => b.matchPrefix.length - a.matchPrefix.length)[0]

  // Don't render if only one tab or no API reference section exists
  if (tabs.length <= 1) {
    return null
  }

  return (
    <div className="flex items-center gap-1 border-b border-border">
      {tabs.map((tab) => {
        const isActive = activeTab?.matchPrefix === tab.matchPrefix

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors relative',
              isActive
                ? 'text-[var(--accent)]'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />
            )}
          </Link>
        )
      })}
    </div>
  )
}
