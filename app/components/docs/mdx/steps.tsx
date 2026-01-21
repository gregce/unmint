import { cn } from '@/lib/utils'

interface StepsProps {
  children: React.ReactNode
}

export function Steps({ children }: StepsProps) {
  return (
    <div className="my-8 ml-4 border-l-2 border-border pl-8 [counter-reset:step]">
      {children}
    </div>
  )
}

interface StepProps {
  title: string
  children: React.ReactNode
}

export function Step({ title, children }: StepProps) {
  return (
    <div className="relative pb-10 last:pb-0 [counter-increment:step]">
      {/* Step number */}
      <div
        className={cn(
          'absolute -left-[calc(2rem+9px)] -top-1 w-7 h-7 rounded-full',
          'flex items-center justify-center text-sm font-semibold',
          'bg-[var(--accent)] text-[var(--accent-foreground)]',
          'before:content-[counter(step)]'
        )}
      />
      {/* Step content */}
      <div>
        <h4 className="font-semibold text-lg text-foreground mb-2">{title}</h4>
        <div className="text-muted-foreground [&>p]:m-0 [&>p]:mb-4 [&>p:last-child]:mb-0 [&>pre]:my-4">
          {children}
        </div>
      </div>
    </div>
  )
}
