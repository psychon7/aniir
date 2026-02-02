import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  label?: string
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, error, leftIcon, rightIcon, type = 'text', label, ...props }, ref) => {
    return (
      <div className="relative">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 bg-background border rounded-lg text-foreground',
            'placeholder:text-muted-foreground/60',
            'transition-all duration-200',
            'hover:border-border/80',
            'focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted',
            error && 'border-destructive focus:border-destructive focus:ring-destructive/10',
            !error && 'border-border',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </div>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'
