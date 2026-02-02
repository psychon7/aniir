import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)

  const stats = [
    {
      label: t('nav.clients'),
      value: '2,847',
      change: '+12.5%',
      trend: 'up',
      icon: UsersIcon,
      colorClass: 'bg-led/10 dark:bg-led/20',
      iconClass: 'text-led',
    },
    {
      label: t('nav.orders'),
      value: '1,253',
      change: '+8.2%',
      trend: 'up',
      icon: ClipboardIcon,
      colorClass: 'bg-hvac/10 dark:bg-hvac/20',
      iconClass: 'text-hvac',
    },
    {
      label: t('nav.quotes'),
      value: '428',
      change: '-2.4%',
      trend: 'down',
      icon: FileTextIcon,
      colorClass: 'bg-waveconcept/10 dark:bg-waveconcept/20',
      iconClass: 'text-waveconcept',
    },
    {
      label: t('nav.products'),
      value: '12,847',
      change: '+4.1%',
      trend: 'up',
      icon: PackageIcon,
      colorClass: 'bg-accessories/10 dark:bg-accessories/20',
      iconClass: 'text-accessories',
    },
  ]

  const recentActivity = [
    { type: 'order', title: 'New order #ORD-2847', client: 'Acme Corporation', time: '2 min ago', amount: '€4,250.00' },
    { type: 'invoice', title: 'Invoice #INV-1893 paid', client: 'TechStart SAS', time: '15 min ago', amount: '€12,800.00' },
    { type: 'quote', title: 'Quote #QT-0892 sent', client: 'Global Industries', time: '1 hour ago', amount: '€8,500.00' },
    { type: 'delivery', title: 'Delivery #DEL-4521 shipped', client: 'Metro Services', time: '2 hours ago', amount: '' },
    { type: 'client', title: 'New client registered', client: 'Nordic Solutions AB', time: '3 hours ago', amount: '' },
  ]

  const businessUnits = [
    { name: 'LED Division', revenue: '€2.4M', orders: 847, color: 'bg-led' },
    { name: 'Domotics', revenue: '€1.8M', orders: 523, color: 'bg-domotics' },
    { name: 'HVAC', revenue: '€956K', orders: 312, color: 'bg-hvac' },
    { name: 'Wave Concept', revenue: '€428K', orders: 156, color: 'bg-waveconcept' },
    { name: 'Accessories', revenue: '€215K', orders: 89, color: 'bg-accessories' },
  ]

  return (
    <div className="space-y-8 stagger-children">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl text-foreground">
            {t('dashboard.welcome')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('dashboard.overview')}, {user?.firstName}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('common.export')}
          </button>
          <button className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            {t('orders.newOrder')}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="stat-card group hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.colorClass}`}>
                    <Icon className={`w-5 h-5 ${stat.iconClass}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    stat.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {stat.trend === 'up' ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    )}
                    {stat.change}
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-normal text-foreground tracking-tight">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-foreground">{t('dashboard.recentActivity')}</h2>
            <button className="text-sm text-primary hover:text-primary/80 transition-colors">
              {t('dashboard.viewAll')}
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent/50 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  activity.type === 'order' ? 'bg-blue-50 dark:bg-blue-500/10' :
                  activity.type === 'invoice' ? 'bg-emerald-50 dark:bg-emerald-500/10' :
                  activity.type === 'quote' ? 'bg-amber-50 dark:bg-amber-500/10' :
                  activity.type === 'delivery' ? 'bg-violet-50 dark:bg-violet-500/10' :
                  'bg-rose-50 dark:bg-rose-500/10'
                }`}>
                  {activity.type === 'order' && <ClipboardIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  {activity.type === 'invoice' && <ReceiptIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                  {activity.type === 'quote' && <FileTextIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                  {activity.type === 'delivery' && <TruckIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />}
                  {activity.type === 'client' && <UsersIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.client}</p>
                </div>
                <div className="text-right">
                  {activity.amount && (
                    <p className="text-sm font-medium text-foreground">{activity.amount}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Business Units */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-foreground">{t('dashboard.businessUnits')}</h2>
            <button className="text-sm text-primary hover:text-primary/80 transition-colors">
              {t('dashboard.details')}
            </button>
          </div>
          <div className="space-y-4">
            {businessUnits.map((unit, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${unit.color}`} />
                    <span className="text-sm font-medium text-foreground">{unit.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{unit.orders} orders</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${unit.color} rounded-full transition-all duration-500`}
                      style={{ width: `${(index === 0 ? 80 : index === 1 ? 60 : index === 2 ? 35 : index === 3 ? 20 : 10)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground w-16 text-right">{unit.revenue}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">{t('dashboard.quickActions')}</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-secondary text-xs py-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                {t('dashboard.newQuote')}
              </button>
              <button className="btn-secondary text-xs py-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                {t('dashboard.addClient')}
              </button>
              <button className="btn-secondary text-xs py-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('dashboard.newInvoice')}
              </button>
              <button className="btn-secondary text-xs py-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('dashboard.reports')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Overview Chart placeholder */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-foreground">{t('dashboard.revenueOverview')}</h2>
            <p className="text-sm text-muted-foreground">{t('dashboard.monthlyPerformance')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost text-xs">{t('common.thisWeek')}</button>
            <button className="btn-ghost text-xs bg-secondary">{t('common.thisMonth')}</button>
            <button className="btn-ghost text-xs">{t('common.custom')}</button>
            <button className="btn-ghost text-xs">{t('common.thisYear')}</button>
          </div>
        </div>

        {/* Chart placeholder */}
        <div className="h-64 flex items-center justify-center bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-xl border border-border/50">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="mt-2 text-sm text-muted-foreground">{t('dashboard.salesChart')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Icon components
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}

function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  )
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  )
}
