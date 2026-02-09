import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { DataTable, Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/Badge'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { useToast } from '@/components/ui/feedback/Toast'
import {
  useProductAttributes,
  useCreateProductAttribute,
  useUpdateProductAttribute,
  useDeleteProductAttribute,
} from '@/hooks/useProductAttributes'
import type {
  ProductAttribute,
  ProductAttributeCreateDto,
  ProductAttributeUpdateDto,
  ProductAttributeListParams,
  AttributeDataType,
} from '@/types/productAttribute'
import { ATTRIBUTE_DATA_TYPE_LABELS } from '@/types/productAttribute'
import { useSocieties } from '@/hooks/useLookups'

export const Route = createFileRoute('/_authenticated/products/attributes/')({
  component: ProductAttributesPage,
})

function ProductAttributesPage() {
  const { t } = useTranslation()
  const { success, error: showError } = useToast()

  // Search and filter state
  const [listParams, setListParams] = useState<ProductAttributeListParams>({
    page: 1,
    pageSize: 10,
    activeOnly: true,
  })

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAttribute, setEditingAttribute] = useState<ProductAttribute | null>(null)
  const [deletingAttribute, setDeletingAttribute] = useState<ProductAttribute | null>(null)

  // Data fetching
  const { data: attributesData, isLoading } = useProductAttributes(listParams)
  const { data: societies = [] } = useSocieties()

  // Mutations
  const createMutation = useCreateProductAttribute()
  const updateMutation = useUpdateProductAttribute()
  const deleteMutation = useDeleteProductAttribute()

  // Handlers
  const handleSearch = (search: string) => {
    setListParams((prev) => ({ ...prev, search: search || undefined, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setListParams((prev) => ({ ...prev, page }))
  }

  const handlePageSizeChange = (pageSize: number) => {
    setListParams((prev) => ({ ...prev, pageSize, page: 1 }))
  }

  const handleOpenCreate = () => {
    setEditingAttribute(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (attribute: ProductAttribute) => {
    setEditingAttribute(attribute)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (data: ProductAttributeCreateDto | ProductAttributeUpdateDto) => {
    try {
      if (editingAttribute) {
        await updateMutation.mutateAsync({
          attributeId: editingAttribute.id,
          data: data as ProductAttributeUpdateDto,
        })
        success(
          t('productAttributes.attributeUpdated', 'Attribute updated successfully'),
          ''
        )
      } else {
        await createMutation.mutateAsync(data as ProductAttributeCreateDto)
        success(
          t('productAttributes.attributeCreated', 'Attribute created successfully'),
          ''
        )
      }
      setIsFormOpen(false)
      setEditingAttribute(null)
    } catch (err) {
      showError(
        t('common.error', 'Error'),
        t('errors.saveError', 'Error saving data')
      )
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingAttribute) return

    try {
      await deleteMutation.mutateAsync({ attributeId: deletingAttribute.id })
      success(
        t('productAttributes.attributeDeleted', 'Attribute deleted successfully'),
        ''
      )
      setDeletingAttribute(null)
    } catch (err) {
      showError(
        t('common.error', 'Error'),
        t('errors.deleteError', 'Unable to delete this item')
      )
    }
  }

  const handleActiveFilter = (value: string) => {
    setListParams((prev) => ({
      ...prev,
      activeOnly: value === '' ? undefined : value === 'true',
      page: 1,
    }))
  }

  const handleSocietyFilter = (value: string) => {
    setListParams((prev) => ({
      ...prev,
      societyId: value ? Number(value) : undefined,
      page: 1,
    }))
  }

  // Table columns
  const columns = useMemo<Column<ProductAttribute>[]>(
    () => [
      {
        id: 'code',
        header: t('productAttributes.code', 'Code'),
        accessorKey: 'code',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm text-foreground">{row.code}</span>
        ),
      },
      {
        id: 'name',
        header: t('productAttributes.name', 'Name'),
        accessorKey: 'name',
        sortable: true,
        cell: (row) => (
          <div>
            <p className="font-medium text-foreground">{row.name}</p>
            {row.description && (
              <p className="text-xs text-muted-foreground truncate max-w-xs">{row.description}</p>
            )}
          </div>
        ),
      },
      {
        id: 'dataType',
        header: t('productAttributes.dataType', 'Data Type'),
        accessorKey: 'dataType',
        sortable: true,
        cell: (row) => (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md bg-muted text-muted-foreground">
            {ATTRIBUTE_DATA_TYPE_LABELS[row.dataType] || row.dataType}
          </span>
        ),
      },
      {
        id: 'unit',
        header: t('productAttributes.unit', 'Unit'),
        accessorKey: 'unit',
        cell: (row) => (
          <span className="text-sm text-muted-foreground">{row.unit || '-'}</span>
        ),
      },
      {
        id: 'flags',
        header: t('productAttributes.attributes', 'Properties'),
        cell: (row) => (
          <div className="flex items-center gap-1.5 flex-wrap">
            {row.isRequired && (
              <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-destructive/10 text-destructive">
                {t('productAttributes.isRequired', 'Required')}
              </span>
            )}
            {row.isFilterable && (
              <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {t('productAttributes.isFilterable', 'Filterable')}
              </span>
            )}
            {row.isVisible && (
              <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {t('productAttributes.isVisible', 'Visible')}
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'sortOrder',
        header: t('productAttributes.sortOrder', 'Sort Order'),
        accessorKey: 'sortOrder',
        sortable: true,
        cell: (row) => (
          <span className="text-sm text-muted-foreground">{row.sortOrder}</span>
        ),
      },
      {
        id: 'isActive',
        header: t('common.status', 'Status'),
        accessorKey: 'isActive',
        cell: (row) => (
          <StatusBadge status={row.isActive ? 'Active' : 'Inactive'} />
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleOpenEdit(row)
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title={t('common.edit', 'Edit')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDeletingAttribute(row)
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title={t('common.delete', 'Delete')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ),
        className: 'w-24',
      },
    ],
    [t]
  )

  // Filter components
  const filters = (
    <>
      <FormSelect
        value={listParams.societyId?.toString() || ''}
        onChange={(e) => handleSocietyFilter(e.target.value)}
        options={[
          { value: '', label: t('common.allCompanies', 'All Companies') },
          ...societies.map((s) => ({ value: s.key, label: s.value })),
        ]}
        className="w-40"
      />
      <FormSelect
        value={listParams.activeOnly === undefined ? '' : listParams.activeOnly.toString()}
        onChange={(e) => handleActiveFilter(e.target.value)}
        options={[
          { value: '', label: t('common.all', 'All') },
          { value: 'true', label: t('common.active', 'Active') },
          { value: 'false', label: t('common.inactive', 'Inactive') },
        ]}
        className="w-32"
      />
    </>
  )

  // Actions
  const actions = (
    <button onClick={handleOpenCreate} className="btn-primary">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
      {t('productAttributes.newAttribute', 'New Attribute')}
    </button>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('productAttributes.title', 'Product Attributes')}
        description={t('productAttributes.noAttributesDescription', 'Create an attribute to define custom product properties')}
        breadcrumbs={[
          { label: t('nav.products', 'Products'), href: '/products' },
          { label: t('productAttributes.title', 'Product Attributes') },
        ]}
        actions={actions}
      />

      <DataTable
        columns={columns}
        data={attributesData?.data || []}
        keyField="id"
        isLoading={isLoading}
        page={listParams.page}
        pageSize={listParams.pageSize}
        totalCount={attributesData?.total || 0}
        totalPages={attributesData?.pages || 1}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        searchValue={listParams.search || ''}
        onSearchChange={handleSearch}
        searchPlaceholder={t('common.search', 'Search') + '...'}
        filters={filters}
        emptyMessage={t('productAttributes.noAttributesFound', 'No attributes found')}
        emptyDescription={t('productAttributes.noAttributesDescription', 'Create an attribute to define custom product properties')}
      />

      {/* Create/Edit Form Modal */}
      <AttributeFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingAttribute(null)
        }}
        onSubmit={handleFormSubmit}
        attribute={editingAttribute}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        societies={societies}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!deletingAttribute}
        onClose={() => setDeletingAttribute(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingAttribute?.name || t('productAttributes.attribute', 'this attribute')}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}

// =============================================================================
// Attribute Form Modal
// =============================================================================

interface AttributeFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ProductAttributeCreateDto | ProductAttributeUpdateDto) => void
  attribute: ProductAttribute | null
  isSubmitting: boolean
  societies: Array<{ key: number; value: string }>
}

function AttributeFormModal({
  isOpen,
  onClose,
  onSubmit,
  attribute,
  isSubmitting,
  societies,
}: AttributeFormModalProps) {
  const { t } = useTranslation()
  const isEditing = !!attribute

  // Form state
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dataType, setDataType] = useState<AttributeDataType>('text' as AttributeDataType)
  const [unit, setUnit] = useState('')
  const [options, setOptions] = useState<string[]>([])
  const [newOption, setNewOption] = useState('')
  const [isRequired, setIsRequired] = useState(false)
  const [isFilterable, setIsFilterable] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [sortOrder, setSortOrder] = useState(0)
  const [societyId, setSocietyId] = useState<number | ''>('')
  const [isActive, setIsActive] = useState(true)

  // Reset form when modal opens with different data
  const resetForm = () => {
    if (attribute) {
      setCode(attribute.code)
      setName(attribute.name)
      setDescription(attribute.description || '')
      setDataType(attribute.dataType)
      setUnit(attribute.unit || '')
      setOptions(attribute.options || [])
      setIsRequired(attribute.isRequired)
      setIsFilterable(attribute.isFilterable)
      setIsVisible(attribute.isVisible)
      setSortOrder(attribute.sortOrder)
      setSocietyId(attribute.societyId)
      setIsActive(attribute.isActive)
    } else {
      setCode('')
      setName('')
      setDescription('')
      setDataType('text' as AttributeDataType)
      setUnit('')
      setOptions([])
      setIsRequired(false)
      setIsFilterable(false)
      setIsVisible(true)
      setSortOrder(0)
      setSocietyId(societies.length > 0 ? societies[0].key : '')
      setIsActive(true)
    }
    setNewOption('')
  }

  // Reset when isOpen or attribute changes
  useState(() => {
    if (isOpen) resetForm()
  })

  // We use useEffect-like behavior by re-initializing when the modal opens
  // Since FormModal only renders when isOpen is true, we use a key trick
  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditing) {
      const updateData: ProductAttributeUpdateDto = {
        code,
        name,
        description: description || undefined,
        dataType,
        unit: unit || undefined,
        options: dataType === ('select' as AttributeDataType) ? options : undefined,
        isRequired,
        isFilterable,
        isVisible,
        sortOrder,
        isActive,
      }
      onSubmit(updateData)
    } else {
      const createData: ProductAttributeCreateDto = {
        code,
        name,
        description: description || undefined,
        dataType,
        unit: unit || undefined,
        options: dataType === ('select' as AttributeDataType) ? options : undefined,
        isRequired,
        isFilterable,
        isVisible,
        sortOrder,
        societyId: Number(societyId),
      }
      onSubmit(createData)
    }
  }

  const addOption = () => {
    const trimmed = newOption.trim()
    if (trimmed && !options.includes(trimmed)) {
      setOptions([...options, trimmed])
      setNewOption('')
    }
  }

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleOptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addOption()
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing
        ? t('productAttributes.editAttribute', 'Edit Attribute')
        : t('productAttributes.newAttribute', 'New Attribute')
      }
      size="lg"
      footer={
        <FormModalFooter
          onCancel={onClose}
          form="attribute-form"
          submitText={isEditing ? t('common.saveChanges', 'Save Changes') : t('common.create', 'Create')}
          isSubmitting={isSubmitting}
          submitDisabled={!code || !name || !societyId}
        />
      }
    >
      <form id="attribute-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Code and Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('productAttributes.code', 'Code')} <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., color, size, wattage"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 font-mono text-sm"
              required
              maxLength={50}
              disabled={isEditing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('productAttributes.name', 'Name')} <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('productAttributes.name', 'Name')}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              required
              maxLength={200}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {t('productAttributes.description', 'Description')}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('productAttributes.description', 'Description')}
            rows={2}
            className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 resize-none"
            maxLength={1000}
          />
        </div>

        {/* Data Type and Unit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('productAttributes.dataType', 'Data Type')}
            </label>
            <FormSelect
              value={dataType}
              onChange={(e) => setDataType(e.target.value as AttributeDataType)}
              options={[
                { value: 'text', label: t('productAttributes.dataTypeText', 'Text') },
                { value: 'number', label: t('productAttributes.dataTypeNumber', 'Number') },
                { value: 'boolean', label: t('productAttributes.dataTypeBoolean', 'Boolean') },
                { value: 'date', label: t('productAttributes.dataTypeDate', 'Date') },
                { value: 'select', label: t('productAttributes.dataTypeSelect', 'Select') },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('productAttributes.unit', 'Unit')}
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g., mm, kg, W"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              maxLength={50}
            />
          </div>
        </div>

        {/* Options (for select data type) */}
        {dataType === ('select' as AttributeDataType) && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('productAttributes.options', 'Options')}
            </label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex-1 px-3 py-1.5 bg-muted rounded-lg text-sm text-foreground">
                    {option}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title={t('productAttributes.removeOption', 'Remove Option')}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={handleOptionKeyDown}
                  placeholder={t('productAttributes.optionPlaceholder', 'Enter option value...')}
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                />
                <button
                  type="button"
                  onClick={addOption}
                  disabled={!newOption.trim()}
                  className="btn-secondary text-sm px-3 py-2 disabled:opacity-50"
                >
                  {t('productAttributes.addOption', 'Add')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Society */}
        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('suppliers.society', 'Company Entity')} <span className="text-destructive">*</span>
            </label>
            <FormSelect
              value={societyId.toString()}
              onChange={(e) => setSocietyId(e.target.value ? Number(e.target.value) : '')}
              options={societies.map((s) => ({ value: s.key, label: s.value }))}
              placeholder={t('common.selectOption', 'Select an option')}
              required
            />
          </div>
        )}

        {/* Sort Order */}
        <div className="w-32">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {t('productAttributes.sortOrder', 'Sort Order')}
          </label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            min={0}
            className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          />
        </div>

        {/* Boolean flags */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <span className="text-sm text-foreground">
              {t('productAttributes.isRequired', 'Required')}
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFilterable}
              onChange={(e) => setIsFilterable(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <span className="text-sm text-foreground">
              {t('productAttributes.isFilterable', 'Filterable')}
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <span className="text-sm text-foreground">
              {t('productAttributes.isVisible', 'Visible')}
            </span>
          </label>
        </div>

        {/* Active status (only for editing) */}
        {isEditing && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <span className="text-sm text-foreground">
              {t('common.active', 'Active')}
            </span>
          </label>
        )}
      </form>
    </FormModal>
  )
}
