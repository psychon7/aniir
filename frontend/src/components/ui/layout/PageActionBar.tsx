import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  ChevronDown,
  MoreHorizontal,
  FileText,
  Eye,
  Download,
  Percent,
  Paperclip,
  Truck,
  FileOutput,
  Receipt,
  Mail,
  CreditCard,
  ShoppingCart,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react'

// Icon button with tooltip
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  label: string
  variant?: 'primary' | 'secondary' | 'ghost'
  showLabel?: boolean
}

export function IconButton({
  icon: Icon,
  label,
  variant = 'secondary',
  showLabel = true,
  className,
  disabled,
  ...props
}: IconButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
  
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
    secondary: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  }

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      title={!showLabel ? label : undefined}
      disabled={disabled}
      {...props}
    >
      <Icon className="h-4 w-4" />
      {showLabel && <span>{label}</span>}
    </button>
  )
}

// Action dropdown for grouping related actions
interface ActionDropdownProps {
  trigger: React.ReactNode
  items: Array<{
    icon?: LucideIcon
    label: string
    onClick: () => void
    disabled?: boolean
    variant?: 'default' | 'destructive'
    separator?: boolean
  }>
  align?: 'start' | 'center' | 'end'
}

export function ActionDropdown({ trigger, items, align = 'end' }: ActionDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-[180px]">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {item.separator && index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={item.onClick}
              disabled={item.disabled}
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                item.variant === 'destructive' && 'text-destructive focus:text-destructive'
              )}
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              <span>{item.label}</span>
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// PDF Actions dropdown
interface PdfActionsProps {
  onPreview: () => void
  onDownload: () => void
  extraItems?: Array<{
    icon?: LucideIcon
    label: string
    onClick: () => void
  }>
}

export function PdfActionsDropdown({ onPreview, onDownload, extraItems = [] }: PdfActionsProps) {
  const items = [
    { icon: Eye, label: 'Preview PDF', onClick: onPreview },
    { icon: Download, label: 'Download PDF', onClick: onDownload },
    ...extraItems.map(item => ({ ...item, separator: extraItems.indexOf(item) === 0 })),
  ]

  return (
    <ActionDropdown
      trigger={
        <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <FileText className="h-4 w-4" />
          <span>PDF</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      }
      items={items}
    />
  )
}

// More actions overflow menu
interface MoreActionsProps {
  items: Array<{
    icon?: LucideIcon
    label: string
    onClick: () => void
    disabled?: boolean
    variant?: 'default' | 'destructive'
    separator?: boolean
  }>
}

export function MoreActionsDropdown({ items }: MoreActionsProps) {
  if (items.length === 0) return null

  return (
    <ActionDropdown
      trigger={
        <button className="inline-flex items-center justify-center rounded-lg border border-input bg-background p-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      }
      items={items}
    />
  )
}

// Divider for visually separating action groups
export function ActionDivider() {
  return <div className="h-6 w-px bg-border mx-1" />
}

// Main PageActionBar component
interface PageActionBarProps {
  children: React.ReactNode
  className?: string
}

export function PageActionBar({ children, className }: PageActionBarProps) {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {children}
    </div>
  )
}

// Pre-configured action buttons
export const ActionButtons = {
  Back: ({ onClick }: { onClick: () => void }) => (
    <IconButton icon={ArrowLeft} label="Back" onClick={onClick} variant="ghost" />
  ),
  
  Discount: ({ onClick }: { onClick: () => void }) => (
    <IconButton icon={Percent} label="Discount" onClick={onClick} />
  ),
  
  CreateDelivery: ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
    <IconButton icon={Truck} label="Create Delivery" onClick={onClick} disabled={disabled} />
  ),
  
  ConvertToQuote: ({ onClick, disabled, isPending }: { onClick: () => void; disabled?: boolean; isPending?: boolean }) => (
    <IconButton 
      icon={FileOutput} 
      label={isPending ? 'Converting...' : 'Convert to Quote'} 
      onClick={onClick} 
      disabled={disabled || isPending} 
    />
  ),
  
  ConvertToOrder: ({ onClick, disabled, isPending }: { onClick: () => void; disabled?: boolean; isPending?: boolean }) => (
    <IconButton 
      icon={ShoppingCart} 
      label={isPending ? 'Converting...' : 'Convert to Order'} 
      onClick={onClick} 
      variant="primary"
      disabled={disabled || isPending} 
    />
  ),
  
  CreateInvoice: ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
    <IconButton icon={Receipt} label="Create Invoice" onClick={onClick} variant="primary" disabled={disabled} />
  ),
  
  SendByEmail: ({ onClick }: { onClick: () => void }) => (
    <IconButton icon={Mail} label="Send by Email" onClick={onClick} />
  ),
  
  RecordPayment: ({ onClick }: { onClick: () => void }) => (
    <IconButton icon={CreditCard} label="Record Payment" onClick={onClick} variant="primary" />
  ),
  
  InspectionForm: ({ onClick }: { onClick: () => void }) => (
    <IconButton icon={ClipboardCheck} label="Inspection Form" onClick={onClick} />
  ),
}

export {
  ArrowLeft,
  ChevronDown,
  MoreHorizontal,
  FileText,
  Eye,
  Download,
  Percent,
  Paperclip,
  Truck,
  FileOutput,
  Receipt,
  Mail,
  CreditCard,
  ShoppingCart,
  ClipboardCheck,
}
