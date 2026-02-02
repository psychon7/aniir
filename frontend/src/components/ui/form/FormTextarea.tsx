import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 bg-background border rounded-lg text-foreground resize-y min-h-[100px]',
          'placeholder:text-muted-foreground/60',
          'transition-all duration-200',
          'hover:border-border/80',
          'focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted',
          error && 'border-destructive focus:border-destructive focus:ring-destructive/10',
          !error && 'border-border',
          className
        )}
        {...props}
      />
    )
  }
)

FormTextarea.displayName = 'FormTextarea'
