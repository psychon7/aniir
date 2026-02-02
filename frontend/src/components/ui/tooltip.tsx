/**
 * Simple Tooltip component using CSS hover
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  children: React.ReactNode
}

interface TooltipTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

interface TooltipContentProps {
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

const TooltipContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({
  isOpen: false,
  setIsOpen: () => {},
})

/**
 * Simple tooltip provider - just renders children
 */
function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

/**
 * Tooltip wrapper component
 */
function Tooltip({ children }: TooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen }}>
      <span className="relative inline-flex">{children}</span>
    </TooltipContext.Provider>
  )
}

/**
 * Tooltip trigger - the element that triggers the tooltip
 */
function TooltipTrigger({ children, asChild }: TooltipTriggerProps) {
  const { setIsOpen } = React.useContext(TooltipContext)

  const handleMouseEnter = () => setIsOpen(true)
  const handleMouseLeave = () => setIsOpen(false)
  const handleFocus = () => setIsOpen(true)
  const handleBlur = () => setIsOpen(false)

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
    })
  }

  return (
    <span
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={0}
    >
      {children}
    </span>
  )
}

/**
 * Tooltip content - the popup content
 */
function TooltipContent({ children, side = 'top', className }: TooltipContentProps) {
  const { isOpen } = React.useContext(TooltipContext)

  if (!isOpen) return null

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <span
      className={cn(
        'absolute z-50 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1.5 text-xs text-slate-50 shadow-md',
        'animate-in fade-in-0 zoom-in-95',
        positionClasses[side],
        className
      )}
      role="tooltip"
    >
      {children}
    </span>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
