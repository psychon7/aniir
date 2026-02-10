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
import { FormInput } from '@/components/ui/form/FormInput'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import {
  LandedCostBreakdown,
  FreightCostsList,
  SupplyLotItems,
} from '@/components/features/supply-lots'
import {
  useSupplyLot,
  useDeleteSupplyLot,
  useUpdateSupplyLot,
  useAddSupplyLotItem,
  useUpdateSupplyLotItem,
  useDeleteSupplyLotItem,
  useAddFreightCost,
  useUpdateFreightCost,
  useDeleteFreightCost,
  useLandedCostBreakdown,
} from '@/hooks/useLandedCost'
import { useSuppliers } from '@/hooks/useSuppliers'
import {
  LOT_STATUS_LABELS,
  LOT_STATUS_COLORS,
  type SupplyLotItem,
  type FreightCost,
  type LotStatus,
} from '@/types/landed-cost'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/supply-lots/$lotId')({
  component: SupplyLotDetailPage,
})

// Tab type
type TabType = 'overview' | 'items' | 'costs' | 'breakdown'

function SupplyLotDetailPage() {
  const { lotId } = Route.useParams()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()

  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isEditLotOpen, setIsEditLotOpen] = useState(false)
  const [lotReferenceInput, setLotReferenceInput] = useState('')
  const [lotNameInput, setLotNameInput] = useState('')
  const [lotSupplierInput, setLotSupplierInput] = useState('')

  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SupplyLotItem | null>(null)
  const [itemProductId, setItemProductId] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [itemSku, setItemSku] = useState('')
  const [itemQuantity, setItemQuantity] = useState('')
  const [itemUnitPrice, setItemUnitPrice] = useState('')
  const [itemWeight, setItemWeight] = useState('')
  const [itemVolume, setItemVolume] = useState('')

  const [isCostModalOpen, setIsCostModalOpen] = useState(false)
  const [editingCost, setEditingCost] = useState<FreightCost | null>(null)
  const [costType, setCostType] = useState('FREIGHT')
  const [costDescription, setCostDescription] = useState('')
  const [costAmount, setCostAmount] = useState('')
  const [costVendor, setCostVendor] = useState('')
  const [costInvoiceRef, setCostInvoiceRef] = useState('')

  const lotIdNum = Number(lotId)

  // Fetch supply lot details
  const { data: supplyLot, isLoading, error, refetch } = useSupplyLot(lotIdNum)

  // Fetch landed cost breakdown
  const { data: breakdown, isLoading: breakdownLoading, refetch: refetchBreakdown } = useLandedCostBreakdown(lotIdNum)

  // Delete mutation
  const deleteMutation = useDeleteSupplyLot()
  const updateLotMutation = useUpdateSupplyLot()
  const addItemMutation = useAddSupplyLotItem()
  const updateItemMutation = useUpdateSupplyLotItem()
  const deleteItemMutation = useDeleteSupplyLotItem()
  const addCostMutation = useAddFreightCost()
  const updateCostMutation = useUpdateFreightCost()
  const deleteCostMutation = useDeleteFreightCost()
  const { data: suppliersData } = useSuppliers({ page: 1, pageSize: 100 })
  const suppliers = suppliersData?.data || []

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(lotIdNum)
      success('Supply Lot deleted', 'The supply lot has been deleted successfully.')
      navigate({ to: '/supply-lots' })
    } catch {
      showError('Error', 'An error occurred while deleting the supply lot.')
    }
  }

  const handleCalculateSuccess = () => {
    refetch()
    refetchBreakdown()
  }

  const openEditLotModal = () => {
    setLotReferenceInput(supplyLot?.lot_reference || '')
    setLotNameInput(supplyLot?.lot_name || '')
    setLotSupplierInput(supplyLot?.lot_supplier_id ? String(supplyLot.lot_supplier_id) : '')
    setIsEditLotOpen(true)
  }

  const saveLotDetails = async () => {
    if (!lotReferenceInput.trim()) {
      showError('Validation', 'Reference is required.')
      return
    }

    try {
      await updateLotMutation.mutateAsync({
        lotId: lotIdNum,
        data: {
          lot_reference: lotReferenceInput.trim(),
          lot_name: lotNameInput.trim() || undefined,
          lot_supplier_id: lotSupplierInput ? Number(lotSupplierInput) : undefined,
        },
      })
      success('Saved', 'Supply lot details updated.')
      setIsEditLotOpen(false)
      refetch()
    } catch {
      showError('Error', 'Unable to update supply lot.')
    }
  }

  const openNewItemModal = () => {
    setEditingItem(null)
    setItemProductId('')
    setItemDescription('')
    setItemSku('')
    setItemQuantity('')
    setItemUnitPrice('')
    setItemWeight('')
    setItemVolume('')
    setIsItemModalOpen(true)
  }

  const openEditItemModal = (item: SupplyLotItem) => {
    setEditingItem(item)
    setItemProductId(item.sli_prd_id ? String(item.sli_prd_id) : '')
    setItemDescription(item.sli_description || '')
    setItemSku(item.sli_sku || '')
    setItemQuantity(String(item.sli_quantity || ''))
    setItemUnitPrice(String(item.sli_unit_price || ''))
    setItemWeight(item.sli_weight_kg != null ? String(item.sli_weight_kg) : '')
    setItemVolume(item.sli_volume_cbm != null ? String(item.sli_volume_cbm) : '')
    setIsItemModalOpen(true)
  }

  const saveItem = async () => {
    const parsedQuantity = Number(itemQuantity)
    const parsedPrice = Number(itemUnitPrice)

    if (!itemProductId || !Number(itemProductId)) {
      showError('Validation', 'Product ID is required.')
      return
    }
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      showError('Validation', 'Quantity must be greater than zero.')
      return
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      showError('Validation', 'Unit price must be zero or greater.')
      return
    }

    try {
      const payload = {
        sli_prd_id: Number(itemProductId),
        sli_quantity: parsedQuantity,
        sli_unit_price: parsedPrice,
        sli_weight_kg: itemWeight !== '' ? Number(itemWeight) : undefined,
        sli_volume_cbm: itemVolume !== '' ? Number(itemVolume) : undefined,
        sli_sku: itemSku || undefined,
        sli_description: itemDescription || undefined,
      }

      if (editingItem) {
        await updateItemMutation.mutateAsync({
          lotId: lotIdNum,
          itemId: editingItem.sli_id,
          data: payload,
        })
        success('Saved', 'Lot item updated.')
      } else {
        await addItemMutation.mutateAsync({
          lotId: lotIdNum,
          data: payload,
        })
        success('Added', 'Lot item added.')
      }

      setIsItemModalOpen(false)
      refetch()
      refetchBreakdown()
    } catch {
      showError('Error', 'Unable to save lot item.')
    }
  }

  const removeItem = async (itemId: number) => {
    if (!window.confirm('Delete this lot item?')) return
    try {
      await deleteItemMutation.mutateAsync({ lotId: lotIdNum, itemId })
      success('Deleted', 'Lot item removed.')
      refetch()
      refetchBreakdown()
    } catch {
      showError('Error', 'Unable to delete lot item.')
    }
  }

  const openNewCostModal = () => {
    setEditingCost(null)
    setCostType('FREIGHT')
    setCostDescription('')
    setCostAmount('')
    setCostVendor('')
    setCostInvoiceRef('')
    setIsCostModalOpen(true)
  }

  const openEditCostModal = (cost: FreightCost) => {
    setEditingCost(cost)
    setCostType(cost.frc_type)
    setCostDescription(cost.frc_description || '')
    setCostAmount(String(cost.frc_amount || ''))
    setCostVendor(cost.frc_vendor_name || '')
    setCostInvoiceRef(cost.frc_invoice_ref || '')
    setIsCostModalOpen(true)
  }

  const saveCost = async () => {
    const parsedAmount = Number(costAmount)
    if (!costType) {
      showError('Validation', 'Cost type is required.')
      return
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      showError('Validation', 'Amount must be zero or greater.')
      return
    }

    try {
      const payload = {
        frc_type: costType as any,
        frc_description: costDescription || 'Cost entry',
        frc_amount: parsedAmount,
        frc_vendor_name: costVendor || undefined,
        frc_invoice_ref: costInvoiceRef || undefined,
      }

      if (editingCost) {
        await updateCostMutation.mutateAsync({
          lotId: lotIdNum,
          costId: editingCost.frc_id,
          data: payload,
        })
        success('Saved', 'Cost entry updated.')
      } else {
        await addCostMutation.mutateAsync({
          lotId: lotIdNum,
          data: payload as any,
        })
        success('Added', 'Cost entry added.')
      }

      setIsCostModalOpen(false)
      refetch()
      refetchBreakdown()
    } catch {
      showError('Error', 'Unable to save cost entry.')
    }
  }

  const removeCost = async (costId: number) => {
    if (!window.confirm('Delete this cost entry?')) return
    try {
      await deleteCostMutation.mutateAsync({ lotId: lotIdNum, costId })
      success('Deleted', 'Cost entry removed.')
      refetch()
      refetchBreakdown()
    } catch {
      showError('Error', 'Unable to delete cost entry.')
    }
  }

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Format date helper
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-GB', {
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

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeletonCard />
        <LoadingSkeletonCard />
      </PageContainer>
    )
  }

  if (error || !supplyLot) {
    return (
      <PageContainer>
        <EmptyStateError
          message="Supply lot not found"
          onRetry={() => navigate({ to: '/supply-lots' })}
        />
      </PageContainer>
    )
  }

  // Tabs configuration
  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'items', label: 'Items', count: supplyLot.items.length },
    { id: 'costs', label: 'Freight Costs', count: supplyLot.freight_costs.length },
    { id: 'breakdown', label: 'Cost Breakdown' },
  ]

  return (
    <PageContainer>
      <PageHeader
        title={supplyLot.lot_name || supplyLot.lot_reference}
        description={
          <div className="flex items-center gap-3">
            <span className="font-mono">{supplyLot.lot_reference}</span>
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                getStatusColor(supplyLot.lot_status)
              )}
            >
              {LOT_STATUS_LABELS[supplyLot.lot_status]}
            </span>
          </div>
        }
        breadcrumbs={[
          { label: 'Supply Lots', href: '/supply-lots' },
          { label: supplyLot.lot_name || supplyLot.lot_reference },
        ]}
        actions={
          <>
            <button
              onClick={openEditLotModal}
              className="btn-secondary"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="btn-secondary text-destructive hover:bg-destructive/10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          </>
        }
      />

      {/* Tab Navigation */}
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'ml-2 rounded-full px-2 py-0.5 text-xs',
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lot Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard
                label="Total Items"
                value={String(supplyLot.lot_total_items)}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                }
              />
              <SummaryCard
                label="Product Value"
                value={formatCurrency(supplyLot.lot_total_value)}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
              <SummaryCard
                label="Total Costs"
                value={formatCurrency(
                  supplyLot.lot_total_freight_cost +
                    supplyLot.lot_total_customs_cost +
                    supplyLot.lot_total_insurance_cost +
                    supplyLot.lot_total_local_cost +
                    supplyLot.lot_total_other_cost
                )}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                }
                variant="info"
              />
              <SummaryCard
                label="Landed Cost"
                value={formatCurrency(supplyLot.lot_total_landed_cost)}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
                variant="success"
              />
            </div>

            {/* Lot Information */}
            <Card>
              <CardHeader title="Lot Information" />
              <CardContent>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem label="Reference" value={supplyLot.lot_reference} mono />
                  <InfoItem label="Name" value={supplyLot.lot_name} />
                  <InfoItem label="Status" value={<StatusBadge status={LOT_STATUS_LABELS[supplyLot.lot_status]} />} />
                  <InfoItem
                    label="Allocation"
                    value={supplyLot.lot_allocation_completed ? 'Completed' : 'Pending'}
                  />
                  {supplyLot.lot_description && (
                    <div className="md:col-span-2">
                      <dt className="text-sm text-muted-foreground mb-1">Description</dt>
                      <dd className="text-foreground whitespace-pre-wrap">{supplyLot.lot_description}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card>
              <CardHeader title="Shipping Details" />
              <CardContent>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem label="Ship Date" value={formatDate(supplyLot.lot_ship_date)} />
                  <InfoItem label="ETA Date" value={formatDate(supplyLot.lot_eta_date)} />
                  <InfoItem label="Arrival Date" value={formatDate(supplyLot.lot_arrival_date)} />
                  <InfoItem
                    label="Total Weight"
                    value={`${formatCurrency(supplyLot.lot_total_weight_kg)} kg`}
                  />
                  <InfoItem
                    label="Total Volume"
                    value={`${supplyLot.lot_total_volume_cbm.toFixed(3)} CBM`}
                  />
                  <InfoItem label="Total Quantity" value={String(supplyLot.lot_total_quantity)} />
                </dl>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Cost Summary */}
            <Card>
              <CardHeader title="Cost Summary" />
              <CardContent>
                <div className="space-y-3">
                  <CostRow label="Freight" value={supplyLot.lot_total_freight_cost} />
                  <CostRow label="Customs & Duties" value={supplyLot.lot_total_customs_cost} />
                  <CostRow label="Insurance" value={supplyLot.lot_total_insurance_cost} />
                  <CostRow label="Local Transport" value={supplyLot.lot_total_local_cost} />
                  <CostRow label="Other" value={supplyLot.lot_total_other_cost} />
                  <div className="pt-3 border-t border-border">
                    <CostRow label="Total Costs" value={supplyLot.total_cost - supplyLot.lot_total_value} bold />
                  </div>
                  <div className="pt-3 border-t border-border">
                    <CostRow label="Product Value" value={supplyLot.lot_total_value} />
                    <CostRow label="Total Landed" value={supplyLot.lot_total_landed_cost} bold primary />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Record Information */}
            <Card>
              <CardHeader title="Record Information" />
              <CardContent>
                <dl className="space-y-4 text-sm">
                  <InfoItem
                    label="Created"
                    value={formatDate(supplyLot.lot_created_at)}
                  />
                  <InfoItem
                    label="Last Updated"
                    value={formatDate(supplyLot.lot_updated_at)}
                  />
                  {supplyLot.lot_allocation_date && (
                    <InfoItem
                      label="Last Calculated"
                      value={formatDate(supplyLot.lot_allocation_date)}
                    />
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <SupplyLotItems
          items={supplyLot.items}
          showLandedCosts={supplyLot.lot_allocation_completed}
          onAddItem={openNewItemModal}
          onEditItem={openEditItemModal}
          onDeleteItem={removeItem}
        />
      )}

      {activeTab === 'costs' && (
        <FreightCostsList
          freightCosts={supplyLot.freight_costs}
          onAddCost={openNewCostModal}
          onEditCost={openEditCostModal}
          onDeleteCost={removeCost}
        />
      )}

      {activeTab === 'breakdown' && (
        <LandedCostBreakdown
          breakdown={breakdown || null}
          lotId={lotIdNum}
          isLoading={breakdownLoading}
          onCalculateSuccess={handleCalculateSuccess}
        />
      )}

      <FormModal
        isOpen={isEditLotOpen}
        onClose={() => setIsEditLotOpen(false)}
        title="Edit Supply Lot"
        description="Update header information for this supply lot."
        footer={(
          <FormModalFooter
            onCancel={() => setIsEditLotOpen(false)}
            onSubmit={saveLotDetails}
            submitText="Save"
            isSubmitting={updateLotMutation.isPending}
          />
        )}
      >
        <div className="grid grid-cols-1 gap-4">
          <FormInput
            label="Reference"
            value={lotReferenceInput}
            onChange={(event) => setLotReferenceInput(event.target.value)}
            required
          />
          <FormInput
            label="Name"
            value={lotNameInput}
            onChange={(event) => setLotNameInput(event.target.value)}
            placeholder="Optional lot name"
          />
          <FormSelect
            label="Supplier"
            value={lotSupplierInput}
            onChange={(event) => setLotSupplierInput(event.target.value)}
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

      <FormModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? 'Edit Lot Item' : 'Add Lot Item'}
        description="Add or edit a product line inside this supply lot."
        footer={(
          <FormModalFooter
            onCancel={() => setIsItemModalOpen(false)}
            onSubmit={saveItem}
            submitText={editingItem ? 'Save' : 'Add Item'}
            isSubmitting={addItemMutation.isPending || updateItemMutation.isPending}
          />
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            type="number"
            label="Product ID"
            value={itemProductId}
            onChange={(event) => setItemProductId(event.target.value)}
            required
          />
          <FormInput
            label="SKU"
            value={itemSku}
            onChange={(event) => setItemSku(event.target.value)}
          />
          <FormInput
            label="Description"
            value={itemDescription}
            onChange={(event) => setItemDescription(event.target.value)}
            className="md:col-span-2"
          />
          <FormInput
            type="number"
            label="Quantity"
            value={itemQuantity}
            onChange={(event) => setItemQuantity(event.target.value)}
            required
          />
          <FormInput
            type="number"
            label="Unit Price"
            value={itemUnitPrice}
            onChange={(event) => setItemUnitPrice(event.target.value)}
            required
          />
          <FormInput
            type="number"
            label="Weight (kg)"
            value={itemWeight}
            onChange={(event) => setItemWeight(event.target.value)}
          />
          <FormInput
            type="number"
            label="Volume (CBM)"
            value={itemVolume}
            onChange={(event) => setItemVolume(event.target.value)}
          />
        </div>
      </FormModal>

      <FormModal
        isOpen={isCostModalOpen}
        onClose={() => setIsCostModalOpen(false)}
        title={editingCost ? 'Edit Cost Entry' : 'Add Cost Entry'}
        description="Add freight/customs/insurance/local/other costs for allocation."
        footer={(
          <FormModalFooter
            onCancel={() => setIsCostModalOpen(false)}
            onSubmit={saveCost}
            submitText={editingCost ? 'Save' : 'Add Cost'}
            isSubmitting={addCostMutation.isPending || updateCostMutation.isPending}
          />
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect
            label="Type"
            value={costType}
            onChange={(event) => setCostType(event.target.value)}
            options={[
              { value: 'FREIGHT', label: 'Freight' },
              { value: 'CUSTOMS', label: 'Customs' },
              { value: 'INSURANCE', label: 'Insurance' },
              { value: 'LOCAL', label: 'Local' },
              { value: 'HANDLING', label: 'Handling' },
              { value: 'OTHER', label: 'Other' },
            ]}
            required
          />
          <FormInput
            type="number"
            label="Amount"
            value={costAmount}
            onChange={(event) => setCostAmount(event.target.value)}
            required
          />
          <FormInput
            label="Description"
            value={costDescription}
            onChange={(event) => setCostDescription(event.target.value)}
            className="md:col-span-2"
          />
          <FormInput
            label="Vendor"
            value={costVendor}
            onChange={(event) => setCostVendor(event.target.value)}
          />
          <FormInput
            label="Invoice Ref"
            value={costInvoiceRef}
            onChange={(event) => setCostInvoiceRef(event.target.value)}
          />
        </div>
      </FormModal>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        itemName={supplyLot.lot_name || supplyLot.lot_reference}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}

// Helper component for summary cards
function SummaryCard({
  label,
  value,
  icon,
  variant = 'default',
}: {
  label: string
  value: string
  icon?: React.ReactNode
  variant?: 'default' | 'info' | 'success' | 'warning'
}) {
  const variantStyles = {
    default: 'bg-card border-border',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    success: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
  }

  const iconStyles = {
    default: 'text-muted-foreground',
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400',
  }

  return (
    <div className={cn('rounded-lg border p-4', variantStyles[variant])}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className={iconStyles[variant]}>{icon}</span>}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  )
}

// Helper component for displaying info items
function InfoItem({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground mb-1">{label}</dt>
      <dd className={cn('text-foreground', mono && 'font-mono text-sm')}>{value || '-'}</dd>
    </div>
  )
}

// Helper component for cost rows
function CostRow({
  label,
  value,
  bold,
  primary,
}: {
  label: string
  value: number
  bold?: boolean
  primary?: boolean
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="flex items-center justify-between">
      <span className={cn('text-sm', bold ? 'font-medium' : 'text-muted-foreground')}>{label}</span>
      <span className={cn('text-sm', bold && 'font-semibold', primary && 'text-primary')}>
        {formatCurrency(value)}
      </span>
    </div>
  )
}
