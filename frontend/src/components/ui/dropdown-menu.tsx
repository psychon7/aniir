import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

// Simplified dropdown menu components using portal for proper z-index handling
// For full functionality, install @radix-ui/react-dropdown-menu

interface DropdownMenuProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  disabled?: boolean
}

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLDivElement>
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null }
})

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const setOpen = React.useCallback((newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [isControlled, onOpenChange])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ children, asChild }) => {
  const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext)

  if (asChild && React.isValidElement(children)) {
    return (
      <div ref={triggerRef} className="inline-block">
        {React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
          onClick: () => setOpen(!open),
        })}
      </div>
    )
  }

  return (
    <div ref={triggerRef} onClick={() => setOpen(!open)} className="inline-block">
      {children}
    </div>
  )
}

const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  children,
  className,
  align = 'end',
  sideOffset = 4,
  ...props
}) => {
  const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext)
  const ref = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })

  // Calculate position based on trigger element
  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const menuWidth = ref.current?.offsetWidth || 180
      
      let left = rect.left
      if (align === 'end') {
        left = rect.right - menuWidth
      } else if (align === 'center') {
        left = rect.left + (rect.width - menuWidth) / 2
      }
      
      // Ensure menu doesn't go off-screen
      const maxLeft = window.innerWidth - menuWidth - 8
      left = Math.max(8, Math.min(left, maxLeft))
      
      setPosition({
        top: rect.bottom + sideOffset + window.scrollY,
        left: left + window.scrollX
      })
    }
  }, [open, align, sideOffset, triggerRef])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, setOpen, triggerRef])

  if (!open) return null

  return createPortal(
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
      }}
      className={cn(
        'z-[9999] min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95',
        className
      )}
      {...props}
    >
      {children}
    </div>,
    document.body
  )
}

const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  children,
  className,
  disabled,
  onClick,
  ...props
}) => {
  const { setOpen } = React.useContext(DropdownMenuContext)

  return (
    <div
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground hover:bg-accent',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={(e) => {
        onClick?.(e)
        setOpen(false)
      }}
      {...props}
    >
      {children}
    </div>
  )
}

const DropdownMenuSeparator: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />
)

const DropdownMenuLabel: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('px-2 py-1.5 text-sm font-semibold', className)} {...props} />
)

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
}
