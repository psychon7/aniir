import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardKpis, useDashboardBackorders } from '@/hooks/useDashboard'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const { data: kpis, isLoading, isError, refetch, isFetching } = useDashboardKpis()
  const { data: backorders, isLoading: isBackordersLoading } = useDashboardBackorders(8)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            {t('dashboard.welcome', { name: user?.firstName || '' })}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('dashboard.subtitle', 'Here\'s an overview of your business operations')}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-secondary inline-flex items-center gap-2"
          disabled={isFetching}
        >
          <RefreshIcon className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? t('common.refreshing', 'Refreshing...') : t('common.refresh', 'Refresh')}
        </button>
      </div>

      {isError && (
        <div className="card-elevated p-4 border-destructive/40">
          <p className="text-destructive">Failed to load dashboard KPI data.</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="card-elevated p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-muted rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-2/3 mb-3" />
                  <div className="h-8 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Main KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title={t('dashboard.kpi.activeClients', 'Active Clients')}
              value={kpis?.activeClients}
              link="/clients"
              icon={<UsersIcon />}
              color="blue"
            />
            <KpiCard
              title={t('dashboard.kpi.quotesInProgress', 'Quotes In Progress')}
              value={kpis?.quotesInProgress}
              link="/quotes"
              icon={<FileTextIcon />}
              color="emerald"
            />
            <KpiCard
              title={t('dashboard.kpi.pendingDeliveries', 'Pending Deliveries')}
              value={kpis?.pendingDeliveries}
              link="/deliveries"
              icon={<TruckIcon />}
              color="orange"
            />
            <KpiCard
              title={t('dashboard.kpi.unpaidInvoices', 'Unpaid Invoices')}
              value={kpis?.unpaidInvoices}
              link="/invoices"
              icon={<ReceiptIcon />}
              color="rose"
            />
          </div>

          {/* Secondary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title={t('dashboard.kpi.backorderLines', 'Backorder Lines')}
              value={kpis?.backorderLines}
              link="/orders"
              icon={<ClipboardIcon />}
              color="amber"
            />
            <KpiCard
              title={t('dashboard.kpi.pendingInvoicing', 'Pending Invoicing')}
              value={kpis?.pendingInvoicing}
              link="/deliveries"
              icon={<CreditCardIcon />}
              color="violet"
            />
            <KpiCard
              title={t('dashboard.kpi.unpaidProformas', 'Unpaid Proformas')}
              value={kpis?.unpaidProformas}
              link="/invoices"
              icon={<DocumentIcon />}
              color="pink"
            />
            <KpiCard
              title={t('dashboard.kpi.recentQuotes', 'Recent Quotes')}
              value={kpis?.quotesRecentInProgress}
              link="/quotes"
              icon={<ClockIcon />}
              color="cyan"
            />
          </div>

          {/* Container & Quote Status Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                  <ContainerIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  {t('dashboard.containerTracking', 'Container Tracking')}
                </h2>
              </div>
              <div className="space-y-4">
                <StatRow
                  label={t('dashboard.unshippedContainers', 'Unshipped Containers')}
                  value={kpis?.unshippedContainers}
                  icon={<PackageIcon className="w-4 h-4" />}
                  color="amber"
                />
                <StatRow
                  label={t('dashboard.arrivingContainers', 'Arriving Containers')}
                  value={kpis?.arrivingContainers}
                  icon={<ShipIcon className="w-4 h-4" />}
                  color="emerald"
                />
              </div>
            </div>

            <div className="card-elevated p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                  <ChartIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  {t('dashboard.quoteStatusBreakdown', 'Quote Status Breakdown')}
                </h2>
              </div>
              {!kpis?.quoteStatusBreakdown?.length ? (
                <p className="text-sm text-muted-foreground">{t('dashboard.noQuoteData', 'No quote status data available.')}</p>
              ) : (
                <div className="space-y-3">
                  {kpis.quoteStatusBreakdown.map((item, index) => (
                    <QuoteStatusRow
                      key={item.statusId}
                      statusId={item.statusId}
                      count={item.count}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Backorders Section */}
          <div className="card-elevated p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                  <AlertIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  {t('dashboard.backorders', 'Backorders')}
                </h2>
              </div>
              <Link to="/orders" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                {t('dashboard.viewAll', 'View All')}
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
            {isBackordersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-14 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : !backorders?.items?.length ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t('dashboard.noBackorders', 'No backorder lines currently detected.')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {backorders.items.map((line) => (
                  <Link
                    key={`${line.orderId}-${line.lineId}`}
                    to="/orders/$orderId"
                    params={{ orderId: String(line.orderId) }}
                    className="block p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <PackageIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {line.productName || line.productReference || `Line #${line.lineId}`}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {line.orderReference} · {line.clientName}
                            {line.expectedDeliveryDate
                              ? ` · ${t('dashboard.due', 'Due')} ${new Date(line.expectedDeliveryDate).toLocaleDateString()}`
                              : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                          {line.remainingQuantity.toFixed(0)} {t('dashboard.remaining', 'remaining')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {line.deliveredQuantity.toFixed(0)} / {line.orderedQuantity.toFixed(0)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('dashboard.generatedAt', 'Generated at')}: {kpis?.generatedAt ? new Date(kpis.generatedAt).toLocaleString() : '-'}</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('dashboard.live', 'Live')}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

// Color configurations for KPI cards
const colorConfig = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-l-blue-500',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-l-emerald-500',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-500/20',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-l-orange-500',
  },
  rose: {
    bg: 'bg-rose-100 dark:bg-rose-500/20',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-l-rose-500',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-l-amber-500',
  },
  violet: {
    bg: 'bg-violet-100 dark:bg-violet-500/20',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-l-violet-500',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-500/20',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-l-pink-500',
  },
  cyan: {
    bg: 'bg-cyan-100 dark:bg-cyan-500/20',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-l-cyan-500',
  },
}

type KpiColor = keyof typeof colorConfig

function KpiCard({
  title,
  value,
  link,
  icon,
  color,
}: {
  title: string
  value?: number
  link: string
  icon: React.ReactNode
  color: KpiColor
}) {
  const colors = colorConfig[color]

  return (
    <Link
      to={link as any}
      className={`card-elevated p-5 border-l-4 ${colors.border} hover:scale-[1.02] transition-all duration-200 group`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
          <span className={colors.text}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{(value ?? 0).toLocaleString()}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        <span>View details</span>
      </div>
    </Link>
  )
}

function StatRow({
  label,
  value,
  icon,
  color
}: {
  label: string
  value?: number
  icon?: React.ReactNode
  color?: 'amber' | 'emerald' | 'blue' | 'rose'
}) {
  const colorClasses = {
    amber: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
    rose: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
      <div className="flex items-center gap-3">
        {icon && color && (
          <div className={`w-8 h-8 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
            {icon}
          </div>
        )}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-lg font-semibold text-foreground">{(value ?? 0).toLocaleString()}</span>
    </div>
  )
}

const statusColors = [
  { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500' },
  { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
  { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
  { bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400', bar: 'bg-rose-500' },
  { bg: 'bg-violet-100 dark:bg-violet-500/20', text: 'text-violet-600 dark:text-violet-400', bar: 'bg-violet-500' },
  { bg: 'bg-cyan-100 dark:bg-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400', bar: 'bg-cyan-500' },
]

function QuoteStatusRow({ statusId, count, index }: { statusId: number; count: number; index: number }) {
  const color = statusColors[index % statusColors.length]
  const statusLabels: Record<number, string> = {
    1: 'Draft',
    2: 'Sent',
    3: 'Accepted',
    4: 'Rejected',
    5: 'Expired',
    6: 'Converted',
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${color.bar}`} />
      <span className="text-sm text-muted-foreground flex-1">
        {statusLabels[statusId] || `Status #${statusId}`}
      </span>
      <span className={`text-sm font-semibold ${color.text}`}>
        {count.toLocaleString()}
      </span>
    </div>
  )
}

// Icon Components
function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function FileTextIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function TruckIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h8M8 17a2 2 0 11-4 0m4 0a2 2 0 10-4 0m12 0a2 2 0 11-4 0m4 0a2 2 0 10-4 0M3 9h13a2 2 0 012 2v4m-2-6l3 3m0 0l3-3m-3 3V4" />
    </svg>
  )
}

function ReceiptIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )
}

function CreditCardIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ContainerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}

function ShipIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 17h18M5 17l2-8h10l2 8M8 9V5a1 1 0 011-1h6a1 1 0 011 1v4" />
    </svg>
  )
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
