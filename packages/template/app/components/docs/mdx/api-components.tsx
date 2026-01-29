'use client'

import { cn } from '@/lib/utils'
import { useState } from 'react'

interface ParamFieldProps {
  path?: string
  query?: string
  body?: string
  header?: string
  type: string
  required?: boolean
  default?: string
  children: React.ReactNode
}

export function ParamField({ path, query, body, header, type, required, default: defaultValue, children }: ParamFieldProps) {
  const name = path || query || body || header || ''
  const location = path ? 'path' : query ? 'query' : body ? 'body' : header ? 'header' : ''

  return (
    <div className="py-4 border-b border-border last:border-0">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <code className="text-sm font-semibold text-foreground">{name}</code>
        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{type}</span>
        {location && (
          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{location}</span>
        )}
        {required && (
          <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400">required</span>
        )}
        {defaultValue && (
          <span className="text-xs text-muted-foreground">
            Default: <code className="text-xs">{defaultValue}</code>
          </span>
        )}
      </div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  )
}

interface ResponseFieldProps {
  name: string
  type: string
  required?: boolean
  children: React.ReactNode
}

export function ResponseField({ name, type, required, children }: ResponseFieldProps) {
  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <code className="text-sm font-medium text-foreground">{name}</code>
        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{type}</span>
        {required && (
          <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400">required</span>
        )}
      </div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  )
}

interface ExpandableProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export function Expandable({ title, defaultOpen = false, children }: ExpandableProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="ml-4 mt-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg
          aria-hidden="true"
          className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-90')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium">{title}</span>
      </button>
      {isOpen && (
        <div className="mt-2 pl-4 border-l-2 border-border">
          {children}
        </div>
      )}
    </div>
  )
}

interface RequestExampleProps {
  children: React.ReactNode
}

export function RequestExample({ children }: RequestExampleProps) {
  return (
    <div className="my-6">
      <h4 className="text-sm font-semibold mb-3">Request Example</h4>
      {children}
    </div>
  )
}

interface ResponseExampleProps {
  children: React.ReactNode
}

export function ResponseExample({ children }: ResponseExampleProps) {
  return (
    <div className="my-6">
      <h4 className="text-sm font-semibold mb-3">Response Example</h4>
      {children}
    </div>
  )
}

interface CodeGroupProps {
  children: React.ReactNode
}

export function CodeGroup({ children }: CodeGroupProps) {
  return <div className="my-6 space-y-4">{children}</div>
}
