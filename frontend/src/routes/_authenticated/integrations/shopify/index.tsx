import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/layout/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { LoadingSkeletonCard } from '@/components/ui/feedback/LoadingSkeleton'
import { EmptyState } from '@/components/ui/feedback/EmptyState'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { ShopifyStoreForm } from '@/components/features/shopify/ShopifyStoreForm'
import {
  useShopifyStores,
  useCreateShopifyStore,
  useDeleteShopifyStore,
} from '@/hooks/useShopifyStores'
import type { ShopifyStore, ShopifyStoreCreateDto, ShopifyStoreStatus } from '@/types/shopify'

export const Route = createFileRoute('/_authenticated/integrations/shopify/' as any)({
  component: ShopifyStoresPage,
})

function ShopifyStoresPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ShopifyStoreStatus | ''>('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteStore, setDeleteStore] = useState<ShopifyStore | null>(null)

  const { data, isLoading, error } = useShopifyStores({
    search: search || undefined,
    status: statusFilter || undefined,
  })

  const createMutation = useCreateShopifyStore()
  const deleteMutation = useDeleteShopifyStore()

  const handleCreate = async (formData: ShopifyStoreCreateDto) => {
    try {
      const newStore = await createMutation.mutateAsync(formData)
      success(t('shopify.storeConnected'), t('shopify.storeConnectedDesc'))
      setIsFormOpen(false)
      navigate({ to: `/integrations/shopify/${newStore.id}` as any })
    } catch (err) {
      showError(t('common.error'), t('shopify.failedToConnect'))
    }
  }

  const handleDelete = async () => {
    if (!deleteStore) return
    try {
      await deleteMutation.mutateAsync(deleteStore.id)
      success(t('shopify.storeDeleted'), t('shopify.storeDeletedDesc'))
      setDeleteStore(null)
    } catch (err) {
      showError(t('common.error'), t('shopify.failedToDelete'))
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title={t('shopify.title')}
          description={t('shopify.description')}
        />
        <LoadingSkeletonCard />
        <LoadingSkeletonCard />
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader
          title={t('shopify.title')}
          description={t('shopify.description')}
        />
        <EmptyState
          icon={
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          }
          message={t('shopify.errorLoadingStores')}
          description={t('shopify.errorLoadingStoresDesc')}
        />
      </PageContainer>
    )
  }

  const stores = data?.data || []

  return (
    <PageContainer>
      <PageHeader
        title={t('shopify.title')}
        description={t('shopify.descriptionFull')}
        breadcrumbs={[
          { label: t('breadcrumbs.integrations') },
          { label: t('breadcrumbs.shopify') },
        ]}
        actions={
          <button onClick={() => setIsFormOpen(true)} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('shopify.connectStore')}
          </button>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder={t('shopify.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-secondary/50 border-0 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ShopifyStoreStatus | '')}
              className="px-4 py-2 bg-secondary/50 border-0 rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20"
            >
              <option value="">{t('shopify.allStatuses')}</option>
              <option value="active">{t('shopify.status.active')}</option>
              <option value="inactive">{t('shopify.status.inactive')}</option>
              <option value="error">{t('shopify.status.error')}</option>
              <option value="pending">{t('shopify.status.pending')}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Store List */}
      {stores.length === 0 ? (
        <EmptyState
          icon={
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          }
          message={t('shopify.noStoresConnected')}
          description={t('shopify.noStoresConnectedDesc')}
          action={
            <button onClick={() => setIsFormOpen(true)} className="btn-primary">
              {t('shopify.connectStore')}
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => (
            <Link
              key={store.id}
              to={`/integrations/shopify/${store.id}` as any}
              className="block"
            >
              <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#95BF47]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#95BF47]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M15.337 3.415c-.18.007-.365.02-.545.041-.006.073-.011.147-.019.22l-.008.074c-.17.025-.327.065-.47.118-.165-.54-.455-.824-.81-.867-.114-.014-.236.003-.36.041-.42-.55-.946-.633-1.355-.633-.965 0-1.89.722-2.604 2.035-.504.926-.887 2.093-1.002 2.995l-2.056.637c-.608.19-.627.209-.706.78-.06.437-1.644 12.664-1.644 12.664l12.121 2.28V3.386c-.184.013-.364.023-.542.029zm-2.15.963c-.458.141-.958.297-1.461.452.282-1.08.813-1.605 1.277-1.8.12.335.184.773.184 1.348zm-1.091-1.88c.084 0 .167.01.245.03-.614.29-1.268.978-1.545 2.375-.4.123-.79.245-1.158.358.323-1.494 1.344-2.763 2.458-2.763zm-.75 7.64c.043.723.914 1.207 1.414 1.645.609.533.568 1.278-.043 1.762-.487.387-1.233.452-1.96.134-.44-.192-.796-.502-.964-.79l-.5 1.976c-.277 1.086-.824 2.146-1.367 2.752l-.052.052c-.062.06-.123.112-.185.157-.29.203-.62.305-.924.198-.533-.187-.824-.953-.73-1.992.094-1.036.517-2.233 1.037-3.287.076-.153.15-.298.223-.434l.023-.042c.14-.255.284-.49.428-.702.006-.01.013-.019.02-.029v.002l.002-.003c.51-.745 1.135-1.213 1.607-1.213.174 0 .308.063.402.19l.001.002c.153-.63.424-1.203.74-1.63-.312-.13-.655-.176-.995-.12z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{store.name}</h3>
                        <p className="text-xs text-muted-foreground">{store.shopDomain}</p>
                      </div>
                    </div>
                    <StatusBadge status={store.status} />
                  </div>

                  {store.statusMessage && (
                    <p className="text-xs text-muted-foreground mb-3 bg-secondary/50 px-2 py-1 rounded">
                      {store.statusMessage}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    {store.syncOrders && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {t('shopify.sync.orders')}
                      </span>
                    )}
                    {store.syncProducts && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        {t('shopify.sync.products')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      {store.lastSyncAt
                        ? t('shopify.lastSyncAt', {
                            date: new Date(store.lastSyncAt).toLocaleDateString(undefined, {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            }),
                          })
                        : t('shopify.neverSynced')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setDeleteStore(store)
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Form Modal */}
      <ShopifyStoreForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={!!deleteStore}
        onClose={() => setDeleteStore(null)}
        onConfirm={handleDelete}
        itemName={deleteStore?.name || ''}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
