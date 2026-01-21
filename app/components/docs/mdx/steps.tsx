import { cn } from '@/lib/utils'

interface StepsProps {
  children: React.ReactNode
}

export function Steps({ children }: StepsProps) {
  return (
    <div className="my-6 ml-4 border-l-2 border-gray-200 dark:border-gray-700 pl-6 [counter-reset:step]">
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
    <div className="relative pb-8 last:pb-0 [counter-increment:step]">
      {/* Step number */}
      <div
        className={cn(
          'absolute -left-[calc(1.5rem+1px)] w-8 h-8 rounded-full',
          'flex items-center justify-center text-sm font-semibold',
          'bg-[var(--accent)] text-white',
          'before:content-[counter(step)]'
        )}
      />
      {/* Step content */}
      <div>
        <h4 className="font-semibold text-foreground mb-2">{title}</h4>
        <div className="text-muted-foreground [&>p]:m-0 [&>p]:mb-4 [&>p:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  )
}
