import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardHeader, CardContent } from '@/components/ui/layout/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { LoadingSkeletonCard } from '@/components/ui/feedback/LoadingSkeleton'
import { EmptyStateError } from '@/components/ui/feedback/EmptyState'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { ShopifyStoreForm } from '@/components/features/shopify/ShopifyStoreForm'
import {
  useShopifyStore,
  useUpdateShopifyStore,
  useDeleteShopifyStore,
  useShopifyStoreStats,
  useShopifySyncEvents,
  useTestShopifyConnection,
  useTriggerShopifySync,
  useRefreshShopifyInfo,
} from '@/hooks/useShopifyStores'
import type { ShopifyStoreCreateDto } from '@/types/shopify'

export const Route = createFileRoute('/_authenticated/integrations/shopify/$storeId' as any)({
  component: ShopifyStoreDetailPage,
})

function ShopifyStoreDetailPage() {
  const { storeId } = Route.useParams()
  const navigate = useNavigate()
  const { success, error: showError, info } = useToast()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [syncType, setSyncType] = useState<'orders' | 'products' | 'customers' | 'inventory' | 'full' | null>(null)

  const { data: store, isLoading, error } = useShopifyStore(Number(storeId))
  const { data: stats } = useShopifyStoreStats(Number(storeId))
  const { data: syncEvents = [] } = useShopifySyncEvents(Number(storeId), 5)

  const updateMutation = useUpdateShopifyStore()
  const deleteMutation = useDeleteShopifyStore()
  const testConnectionMutation = useTestShopifyConnection()
  const triggerSyncMutation = useTriggerShopifySync()
  const refreshInfoMutation = useRefreshShopifyInfo()

  const handleUpdate = async (data: ShopifyStoreCreateDto) => {
    try {
      await updateMutation.mutateAsync({ ...data, id: Number(storeId) })
      success('Store Updated', 'Shopify store settings have been updated.')
      setIsFormOpen(false)
    } catch (err) {
      showError('Error', 'Failed to update Shopify store.')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(Number(storeId))
      success('Store Deleted', 'Shopify store connection has been removed.')
      navigate({ to: '/integrations/shopify' as any })
    } catch (err) {
      showError('Error', 'Failed to delete Shopify store.')
    }
  }

  const handleTestConnection = async () => {
    try {
      const result = await testConnectionMutation.mutateAsync(Number(storeId))
      if (result.success) {
        success('Connection Successful', `Connected to ${result.shopName}`)
      } else {
        showError('Connection Failed', result.error || 'Unable to connect to Shopify')
      }
    } catch (err) {
      showError('Error', 'Failed to test connection.')
    }
  }

  const handleSync = async (type: 'orders' | 'products' | 'customers' | 'inventory' | 'full') => {
    try {
      setSyncType(type)
      await triggerSyncMutation.mutateAsync({ id: Number(storeId), syncType: type })
      info('Sync Started', `${type.charAt(0).toUpperCase() + type.slice(1)} sync has been initiated.`)
    } catch (err) {
      showError('Error', 'Failed to start sync.')
    } finally {
      setSyncType(null)
    }
  }

  const handleRefreshInfo = async () => {
    try {
      await refreshInfoMutation.mutateAsync(Number(storeId))
      success('Info Refreshed', 'Shop information has been updated from Shopify.')
    } catch (err) {
      showError('Error', 'Failed to refresh shop info.')
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeletonCard />
        <LoadingSkeletonCard />
      </PageContainer>
    )
  }

  if (error || !store) {
    return (
      <PageContainer>
        <EmptyStateError
          message="Shopify store not found"
          onRetry={() => navigate({ to: '/integrations/shopify' as any })}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={store.name}
        description={store.shopDomain}
        breadcrumbs={[
          { label: 'Integrations', href: '/integrations' },
          { label: 'Shopify', href: '/integrations/shopify' },
          { label: store.name },
        ]}
        actions={
          <>
            <button
              onClick={handleTestConnection}
              disabled={testConnectionMutation.isPending}
              className="btn-secondary"
            >
              {testConnectionMutation.isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Testing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Test Connection
                </>
              )}
            </button>
            <button onClick={() => setIsFormOpen(true)} className="btn-secondary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="btn-secondary text-destructive hover:bg-destructive/10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Banner */}
          {store.status === 'error' && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-medium text-destructive">Connection Error</p>
                <p className="text-sm text-destructive/80">
                  {store.lastSyncError || store.statusMessage || 'Unable to connect to Shopify. Please check your access token.'}
                </p>
              </div>
            </div>
          )}

          {/* Store Information */}
          <Card>
            <CardHeader
              title="Store Information"
              action={
                <button
                  onClick={handleRefreshInfo}
                  disabled={refreshInfoMutation.isPending}
                  className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  <svg
                    className={`w-4 h-4 ${refreshInfoMutation.isPending ? 'animate-spin' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              }
            />
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem label="Store Name" value={store.name} />
                <InfoItem label="Shop Domain" value={store.shopDomain} mono link={`https://${store.shopDomain}`} external />
                <InfoItem
                  label="Status"
                  value={<StatusBadge status={store.status} />}
                />
                <InfoItem label="API Version" value={store.apiVersion} mono />
                <InfoItem label="Email" value={store.email} link={`mailto:${store.email}`} />
                <InfoItem label="Currency" value={store.currencyCode} />
                <InfoItem label="Primary Domain" value={store.primaryDomain} link={`https://${store.primaryDomain}`} external />
                <InfoItem label="Plan" value={store.planDisplayName} />
                <InfoItem label="Country" value={store.country} />
                <InfoItem label="Shopify ID" value={store.shopifyShopId} mono />
              </dl>
            </CardContent>
          </Card>

          {/* Sync Settings */}
          <Card>
            <CardHeader title="Sync Settings" />
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SyncSettingCard
                  title="Orders"
                  enabled={store.syncOrders}
                  onSync={() => handleSync('orders')}
                  isSyncing={syncType === 'orders' && triggerSyncMutation.isPending}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  }
                />
                <SyncSettingCard
                  title="Products"
                  enabled={store.syncProducts}
                  onSync={() => handleSync('products')}
                  isSyncing={syncType === 'products' && triggerSyncMutation.isPending}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  }
                />
                <SyncSettingCard
                  title="Customers"
                  enabled={store.syncCustomers}
                  onSync={() => handleSync('customers')}
                  isSyncing={syncType === 'customers' && triggerSyncMutation.isPending}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                />
                <SyncSettingCard
                  title="Inventory"
                  enabled={store.syncInventory}
                  onSync={() => handleSync('inventory')}
                  isSyncing={syncType === 'inventory' && triggerSyncMutation.isPending}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                  }
                />
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => handleSync('full')}
                  disabled={triggerSyncMutation.isPending}
                  className="btn-primary w-full"
                >
                  {syncType === 'full' && triggerSyncMutation.isPending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Full Sync
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Sync Events */}
          <Card>
            <CardHeader title="Recent Sync Events" />
            <CardContent>
              {syncEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No sync events yet</p>
              ) : (
                <div className="space-y-3">
                  {syncEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            event.status === 'completed'
                              ? 'bg-green-500'
                              : event.status === 'failed'
                              ? 'bg-red-500'
                              : 'bg-yellow-500 animate-pulse'
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground capitalize">
                            {event.eventType} Sync
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.startedAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={event.status} />
                        {event.status === 'completed' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {event.recordsProcessed} processed
                            {event.recordsFailed > 0 && `, ${event.recordsFailed} failed`}
                          </p>
                        )}
                        {event.errorMessage && (
                          <p className="text-xs text-destructive mt-1 max-w-[200px] truncate">
                            {event.errorMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics */}
          <Card>
            <CardHeader title="Statistics" />
            <CardContent>
              {stats ? (
                <dl className="space-y-4">
                  <StatItem
                    label="Total Orders"
                    value={stats.totalOrders.toLocaleString()}
                    subtext={`${stats.ordersToday} today`}
                  />
                  <StatItem
                    label="Total Products"
                    value={stats.totalProducts.toLocaleString()}
                  />
                  <StatItem
                    label="Total Customers"
                    value={stats.totalCustomers.toLocaleString()}
                  />
                  <StatItem
                    label="Pending Orders"
                    value={stats.pendingOrders.toLocaleString()}
                    highlight={stats.pendingOrders > 0}
                  />
                  <StatItem
                    label="Synced (7 days)"
                    value={stats.ordersSynced7Days.toLocaleString()}
                    subtext="orders"
                  />
                </dl>
              ) : (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-3 bg-secondary rounded w-20 mb-1" />
                      <div className="h-5 bg-secondary rounded w-16" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Webhook Status */}
          <Card>
            <CardHeader title="Webhooks" />
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Real-time Updates</span>
                <StatusBadge status={store.webhooksEnabled ? 'Enabled' : 'Disabled'} />
              </div>
              {store.webhooksEnabled && (
                <p className="text-xs text-muted-foreground mt-2">
                  Webhooks are configured to receive real-time order and inventory updates.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Record Information */}
          <Card>
            <CardHeader title="Record Information" />
            <CardContent>
              <dl className="space-y-4 text-sm">
                <InfoItem
                  label="Created"
                  value={new Date(store.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                />
                {store.createdBy && <InfoItem label="Created By" value={store.createdBy} />}
                <InfoItem
                  label="Last Updated"
                  value={new Date(store.updatedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                />
                {store.updatedBy && <InfoItem label="Updated By" value={store.updatedBy} />}
                {store.lastSyncAt && (
                  <InfoItem
                    label="Last Sync"
                    value={new Date(store.lastSyncAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  />
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Form Modal */}
      <ShopifyStoreForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleUpdate}
        store={store}
        isSubmitting={updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        itemName={store.name}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}

// Helper component for displaying info items
function InfoItem({
  label,
  value,
  link,
  external,
  mono,
}: {
  label: string
  value: React.ReactNode
  link?: string
  external?: boolean
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground mb-1">{label}</dt>
      <dd className={`text-foreground ${mono ? 'font-mono text-sm' : ''}`}>
        {link && value ? (
          <a
            href={link}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="text-primary hover:underline"
          >
            {value}
            {external && (
              <svg className="inline-block w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            )}
          </a>
        ) : (
          value || '-'
        )}
      </dd>
    </div>
  )
}

// Helper component for sync setting cards
function SyncSettingCard({
  title,
  enabled,
  onSync,
  isSyncing,
  icon,
}: {
  title: string
  enabled: boolean
  onSync: () => void
  isSyncing: boolean
  icon: React.ReactNode
}) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        enabled
          ? 'border-primary/20 bg-primary/5'
          : 'border-border bg-secondary/30'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={enabled ? 'text-primary' : 'text-muted-foreground'}>{icon}</div>
        <div
          className={`w-2 h-2 rounded-full ${
            enabled ? 'bg-green-500' : 'bg-muted-foreground/30'
          }`}
        />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mb-3">
        {enabled ? 'Enabled' : 'Disabled'}
      </p>
      {enabled && (
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          {isSyncing ? (
            <>
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Syncing...
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync Now
            </>
          )}
        </button>
      )}
    </div>
  )
}

// Helper component for stat items
function StatItem({
  label,
  value,
  subtext,
  highlight,
}: {
  label: string
  value: string
  subtext?: string
  highlight?: boolean
}) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={`text-lg font-semibold ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value}
        {subtext && (
          <span className="text-xs font-normal text-muted-foreground ml-1">{subtext}</span>
        )}
      </dd>
    </div>
  )
}
