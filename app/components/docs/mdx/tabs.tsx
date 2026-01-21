'use client'

import { useState, createContext, useContext } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

interface TabsProps {
  children: React.ReactNode
  defaultValue?: string
}

export function Tabs({ children, defaultValue }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || '')

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="my-6">{children}</div>
    </TabsContext.Provider>
  )
}

interface TabProps {
  title: string
  children: React.ReactNode
}

export function Tab({ title, children }: TabProps) {
  const context = useContext(TabsContext)
  if (!context) return null

  const { activeTab, setActiveTab } = context
  const isActive = activeTab === title || (!activeTab && title)

  return (
    <>
      <button
        onClick={() => setActiveTab(title)}
        className={cn(
          'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
          isActive
            ? 'border-[var(--accent)] text-[var(--accent)]'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        )}
      >
        {title}
      </button>
      {isActive && (
        <div className="pt-4 [&>pre]:mt-0">
          {children}
        </div>
      )}
    </>
  )
}
