import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardKpis } from '@/hooks/useDashboard'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { data: kpis, isLoading, isError, refetch, isFetching } = useDashboardKpis()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Legacy parity KPI widgets for commercial operations
            {user?.firstName ? `, ${user.firstName}` : ''}.
          </p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary" disabled={isFetching}>
          {isFetching ? 'Refreshing...' : 'Refresh'}
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
              <div className="h-4 bg-muted rounded w-2/3 mb-3" />
              <div className="h-8 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Active Clients" value={kpis?.activeClients} link="/clients" />
            <KpiCard title="Quotes In Progress" value={kpis?.quotesInProgress} link="/quotes" />
            <KpiCard title="Recent In-Progress Quotes" value={kpis?.quotesRecentInProgress} link="/quotes" />
            <KpiCard title="Backorder Lines" value={kpis?.backorderLines} link="/orders" />
            <KpiCard title="Pending Deliveries" value={kpis?.pendingDeliveries} link="/deliveries" />
            <KpiCard title="Pending Invoicing" value={kpis?.pendingInvoicing} link="/deliveries" />
            <KpiCard title="Unpaid Invoices" value={kpis?.unpaidInvoices} link="/invoices" />
            <KpiCard title="Unpaid Proformas" value={kpis?.unpaidProformas} link="/invoices" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h2 className="text-lg font-medium text-foreground mb-4">Container Tracking</h2>
              <div className="space-y-3">
                <StatRow label="Unshipped Containers" value={kpis?.unshippedContainers} />
                <StatRow label="Arriving Containers" value={kpis?.arrivingContainers} />
              </div>
            </div>

            <div className="card-elevated p-6">
              <h2 className="text-lg font-medium text-foreground mb-4">Quote Status Breakdown</h2>
              {!kpis?.quoteStatusBreakdown?.length ? (
                <p className="text-sm text-muted-foreground">No quote status data available.</p>
              ) : (
                <div className="space-y-2">
                  {kpis.quoteStatusBreakdown.map((item) => (
                    <StatRow
                      key={item.statusId}
                      label={`Status #${item.statusId}`}
                      value={item.count}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Generated at: {kpis?.generatedAt ? new Date(kpis.generatedAt).toLocaleString() : '-'}
          </div>
        </>
      )}
    </div>
  )
}

function KpiCard({
  title,
  value,
  link,
}: {
  title: string
  value?: number
  link: string
}) {
  return (
    <div className="card-elevated p-5">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-3xl font-semibold text-foreground mt-2">{value ?? 0}</p>
      <div className="mt-3">
        <Link to={link as any} className="text-sm text-primary hover:underline">
          Open
        </Link>
      </div>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value?: number }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value ?? 0}</span>
    </div>
  )
}
