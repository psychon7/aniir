import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface FormSelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: FormSelectOption[]
  placeholder?: string
  error?: boolean
  label?: string
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, options, placeholder, error, label, ...props }, ref) => {
    return (
      <div className="relative">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 bg-background border rounded-lg text-foreground appearance-none',
            'transition-all duration-200',
            'hover:border-border/80',
            'focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted',
            error && 'border-destructive focus:border-destructive focus:ring-destructive/10',
            !error && 'border-border',
            !props.value && 'text-muted-foreground/60',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {/* Dropdown arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    )
  }
)

FormSelect.displayName = 'FormSelect'
