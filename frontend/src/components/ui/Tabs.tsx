import { createContext, useContext, useState, type ReactNode } from 'react'

interface TabsContextType {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextType | null>(null)

function useTabsContext() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tabs components must be used within <Tabs>')
  return ctx
}

interface TabsProps {
  defaultTab: string
  children: ReactNode
  className?: string
}

export function Tabs({ defaultTab, children, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabListProps {
  children: ReactNode
  className?: string
}

export function TabList({ children, className = '' }: TabListProps) {
  return (
    <div
      className={`flex border-b border-border overflow-x-auto ${className}`}
      role="tablist"
    >
      {children}
    </div>
  )
}

interface TabProps {
  value: string
  children: ReactNode
  className?: string
}

export function Tab({ value, children, className = '' }: TabProps) {
  const { activeTab, setActiveTab } = useTabsContext()
  const isActive = activeTab === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveTab(value)}
      className={`
        px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors
        border-b-2 -mb-px
        ${isActive
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
        }
        ${className}
      `}
    >
      {children}
    </button>
  )
}

interface TabPanelProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabPanel({ value, children, className = '' }: TabPanelProps) {
  const { activeTab } = useTabsContext()
  if (activeTab !== value) return null
  return (
    <div role="tabpanel" className={`py-6 ${className}`}>
      {children}
    </div>
  )
}
