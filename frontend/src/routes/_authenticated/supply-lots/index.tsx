import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/layout/Card'
import { LoadingSkeletonCard } from '@/components/ui/feedback/LoadingSkeleton'
import { EmptyState } from '@/components/ui/feedback/EmptyState'
import { useToast } from '@/components/ui/feedback/Toast'
import { FormInput } from '@/components/ui/form/FormInput'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import { useSupplyLots, useCreateSupplyLot } from '@/hooks/useLandedCost'
import { useSuppliers } from '@/hooks/useSuppliers'
import type { SupplyLotSearchParams, LotStatus } from '@/types/landed-cost'
import { LOT_STATUS_LABELS, LOT_STATUS_COLORS } from '@/types/landed-cost'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/supply-lots/')({
  component: SupplyLotsPage,
})

function SupplyLotsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [searchParams, setSearchParams] = useState<SupplyLotSearchParams>({
    page: 1,
    page_size: 20,
    sort_by: 'lot_created_at',
    sort_order: 'desc',
  })
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newLotReference, setNewLotReference] = useState('')
  const [newLotName, setNewLotName] = useState('')
  const [newLotSupplierId, setNewLotSupplierId] = useState('')

  const { data, isLoading, error } = useSupplyLots(searchParams)
  const createLotMutation = useCreateSupplyLot()
  const { data: suppliersData } = useSuppliers({ page: 1, pageSize: 100 })
  const suppliers = suppliersData?.data || []

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(i18n.language, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Format date helper
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Get status color
  const getStatusColor = (status: LotStatus) => {
    const colorMap: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
      green: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
      emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200',
      red: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200',
    }
    return colorMap[LOT_STATUS_COLORS[status]] || colorMap.gray
  }

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => ({ ...prev, page: newPage }))
  }

  const openCreateModal = () => {
    setIsCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
    setNewLotReference('')
    setNewLotName('')
    setNewLotSupplierId('')
  }

  const createSupplyLot = async () => {
    const trimmedReference = newLotReference.trim()
    if (!trimmedReference) {
      showError('Validation', 'Supply lot reference is required.')
      return
    }

    try {
      const created = await createLotMutation.mutateAsync({
        lot_reference: trimmedReference,
        lot_name: newLotName.trim() || undefined,
        lot_supplier_id: newLotSupplierId ? Number(newLotSupplierId) : undefined,
      })
      success('Supply Lot created', `Supply lot ${created.lot_reference} has been created.`)
      closeCreateModal()
      navigate({ to: '/supply-lots/$lotId', params: { lotId: String(created.lot_id) } })
    } catch {
      showError('Error', 'Unable to create supply lot.')
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title={t('supplyLots.title')}
          description={t('supplyLots.description')}
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
          title={t('supplyLots.title')}
          description={t('supplyLots.description')}
        />
        <EmptyState
          title={t('supplyLots.errorTitle')}
          description={t('supplyLots.errorDescription')}
          action={
            <button onClick={() => window.location.reload()} className="btn-primary">
              {t('common.retry')}
            </button>
          }
        />
      </PageContainer>
    )
  }

  const supplyLots = data?.items || []
  const totalPages = data?.total_pages || 1
  const currentPage = data?.page || 1

  return (
    <PageContainer>
      <PageHeader
        title={t('supplyLots.title')}
        description={t('supplyLots.description')}
        actions={
          <button onClick={openCreateModal} className="btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('supplyLots.newSupplyLot')}
          </button>
        }
      />

      {supplyLots.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          }
          title={t('supplyLots.noLotsFound')}
          description={t('supplyLots.createFirst')}
          action={
            <button onClick={openCreateModal} className="btn-primary">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('supplyLots.createSupplyLot')}
            </button>
          }
        />
      ) : (
        <>
          {/* Supply Lots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supplyLots.map((lot) => (
              <Link
                key={lot.lot_id}
                to="/supply-lots/$lotId"
                params={{ lotId: String(lot.lot_id) }}
                className="block"
              >
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-foreground">
                          {lot.lot_name || lot.lot_reference}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono">{lot.lot_reference}</p>
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                          getStatusColor(lot.lot_status)
                        )}
                      >
                        {LOT_STATUS_LABELS[lot.lot_status]}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">{t('supplyLots.items')}</p>
                        <p className="font-medium">{lot.lot_total_items}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('supplyLots.value')}</p>
                        <p className="font-medium">{formatCurrency(lot.lot_total_value)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('supplyLots.totalCosts')}</p>
                        <p className="font-medium text-blue-600">
                          {formatCurrency(
                            lot.lot_total_freight_cost +
                              lot.lot_total_customs_cost +
                              lot.lot_total_insurance_cost +
                              lot.lot_total_local_cost +
                              lot.lot_total_other_cost
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('supplyLots.landedCost')}</p>
                        <p className="font-medium text-green-600">
                          {formatCurrency(lot.lot_total_landed_cost)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {lot.lot_allocation_completed ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {t('supplyLots.calculated')}
                          </span>
                        ) : (
                          <span className="text-amber-600">{t('supplyLots.notCalculated')}</span>
                        )}
                      </span>
                      <span>{formatDate(lot.lot_created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t('common.pagination.page', { currentPage, totalPages, total: data?.total || 0 })}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className={cn(
                    'btn-secondary text-sm',
                    currentPage <= 1 && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {t('common.previous')}
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className={cn(
                    'btn-secondary text-sm',
                    currentPage >= totalPages && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <FormModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Create Supply Lot"
        description="Create a new lot to manage landed cost allocation."
        footer={(
          <FormModalFooter
            onCancel={closeCreateModal}
            onSubmit={createSupplyLot}
            submitText="Create"
            isSubmitting={createLotMutation.isPending}
          />
        )}
      >
        <div className="grid grid-cols-1 gap-4">
          <FormInput
            label="Reference"
            value={newLotReference}
            onChange={(event) => setNewLotReference(event.target.value)}
            placeholder="LOT-2026-001"
            required
          />
          <FormInput
            label="Name (optional)"
            value={newLotName}
            onChange={(event) => setNewLotName(event.target.value)}
            placeholder="Spring Container"
          />
          <FormSelect
            label="Supplier (optional)"
            value={newLotSupplierId}
            onChange={(event) => setNewLotSupplierId(event.target.value)}
            options={[
              { value: '', label: 'No supplier' },
              ...suppliers.map((supplier: any) => ({
                value: String(supplier.id),
                label: `${supplier.reference || `SUP-${supplier.id}`} - ${supplier.companyName || supplier.name || 'Supplier'}`,
              })),
            ]}
          />
        </div>
      </FormModal>
    </PageContainer>
  )
}
