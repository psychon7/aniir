import { useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { FormInput } from '@/components/ui/form/FormInput'
import { FormTextarea } from '@/components/ui/form/FormTextarea'
import { useToast } from '@/components/ui/feedback/Toast'
import { useProductCategories, useSocieties } from '@/hooks/useLookups'
import apiClient from '@/api/client'

export const Route = createFileRoute('/_authenticated/products/new')({
  component: NewProductPage,
})

type Mode = 'single' | 'express'

interface LookupOption {
  value: string
  label: string
}

function normalizeOptions(values: any[]): LookupOption[] {
  return values
    .map((item: any) => {
      const value = String(item.key ?? item.id ?? '')
      const label = String(item.value ?? item.name ?? item.value2 ?? '')
      return { value, label }
    })
    .filter((option) => option.value && option.label)
}

function parseExpressInput(raw: string) {
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return lines.map((line) => {
    const hasSemicolon = line.includes(';')
    const parts = line.split(hasSemicolon ? ';' : ',').map((part) => part.trim())
    return {
      reference: parts[0] || '',
      name: parts[1] || '',
      unitPrice: parts[2] ? Number(parts[2]) : undefined,
      purchasePrice: parts[3] ? Number(parts[3]) : undefined,
      description: parts.slice(4).join(' ') || undefined,
    }
  })
}

function NewProductPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()
  const { data: societiesRaw = [] } = useSocieties()
  const { data: categoriesRaw = [] } = useProductCategories()

  const [mode, setMode] = useState<Mode>('single')
  const [single, setSingle] = useState({
    socId: '',
    ptyId: '',
    reference: '',
    name: '',
    description: '',
    unitPrice: '',
    purchasePrice: '',
  })
  const [express, setExpress] = useState({
    socId: '',
    ptyId: '',
    skipExisting: true,
    input: '',
  })
  const [bulkResult, setBulkResult] = useState<null | {
    success: boolean
    createdCount: number
    skippedCount: number
    errorCount: number
    errors: Array<{ line: number; reference: string; error: string }>
  }>(null)

  const societies = useMemo(() => normalizeOptions(societiesRaw as any[]), [societiesRaw])
  const categories = useMemo(() => normalizeOptions(categoriesRaw as any[]), [categoriesRaw])
  const parsedExpressRows = useMemo(() => parseExpressInput(express.input), [express.input])

  const createSingleMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        soc_id: Number(single.socId),
        pty_id: Number(single.ptyId),
        prd_ref: single.reference.trim(),
        prd_name: single.name.trim(),
        prd_description: single.description || undefined,
        prd_price: single.unitPrice ? Number(single.unitPrice) : undefined,
        prd_purchase_price: single.purchasePrice ? Number(single.purchasePrice) : undefined,
      }
      const response = await apiClient.post('/products', payload)
      return response.data
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      success('Product created', 'Product created successfully.')
      const productId = product?.id || product?.prd_id
      if (productId) {
        navigate({ to: '/products/$productId', params: { productId: String(productId) } } as any)
      } else {
        navigate({ to: '/products' as any })
      }
    },
    onError: (error: any) => {
      showError('Create failed', error?.response?.data?.detail || 'Unable to create product.')
    },
  })

  const createExpressMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        soc_id: Number(express.socId),
        pty_id: Number(express.ptyId),
        skip_existing: express.skipExisting,
        lines: parsedExpressRows
          .filter((row) => row.reference && row.name)
          .map((row) => ({
            reference: row.reference,
            name: row.name,
            unit_price: row.unitPrice,
            purchase_price: row.purchasePrice,
            description: row.description,
          })),
      }
      const response = await apiClient.post('/products/bulk-express', payload)
      return response.data
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setBulkResult(result)
      success('Express import finished', `${result.createdCount} product(s) created.`)
    },
    onError: (error: any) => {
      showError('Express import failed', error?.response?.data?.detail || 'Unable to create products in bulk.')
    },
  })

  const handleCreateSingle = () => {
    if (!single.socId || !single.ptyId || !single.reference.trim() || !single.name.trim()) {
      showError('Validation', 'Society, category, reference, and name are required.')
      return
    }
    createSingleMutation.mutate()
  }

  const handleCreateExpress = () => {
    if (!express.socId || !express.ptyId) {
      showError('Validation', 'Society and category are required for express mode.')
      return
    }
    if (!parsedExpressRows.length) {
      showError('Validation', 'Enter at least one line in express input.')
      return
    }
    createExpressMutation.mutate()
  }

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/products' as any })} className="btn-secondary">
        Back
      </button>
      {mode === 'single' ? (
        <button
          className="btn-primary"
          disabled={createSingleMutation.isPending}
          onClick={handleCreateSingle}
        >
          {createSingleMutation.isPending ? 'Saving...' : 'Save Product'}
        </button>
      ) : (
        <button
          className="btn-primary"
          disabled={createExpressMutation.isPending}
          onClick={handleCreateExpress}
        >
          {createExpressMutation.isPending ? 'Running...' : 'Run Express Create'}
        </button>
      )}
    </div>
  )

  return (
    <PageContainer>
      <PageHeader
        title="New Product"
        description="Create a single product or use express bulk mode."
        actions={actions}
      />

      <div className="mb-6 flex gap-2">
        <button
          className={`btn-secondary ${mode === 'single' ? 'bg-primary/10 border-primary text-primary' : ''}`}
          onClick={() => setMode('single')}
        >
          Single
        </button>
        <button
          className={`btn-secondary ${mode === 'express' ? 'bg-primary/10 border-primary text-primary' : ''}`}
          onClick={() => setMode('express')}
        >
          Express Bulk
        </button>
      </div>

      {mode === 'single' ? (
        <Card>
          <CardHeader title="Single Product" />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Society *</label>
                <select
                  className="input"
                  value={single.socId}
                  onChange={(e) => setSingle((prev) => ({ ...prev, socId: e.target.value }))}
                >
                  <option value="">Select society</option>
                  {societies.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Category / Type *</label>
                <select
                  className="input"
                  value={single.ptyId}
                  onChange={(e) => setSingle((prev) => ({ ...prev, ptyId: e.target.value }))}
                >
                  <option value="">Select category</option>
                  {categories.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <FormInput
                label="Reference *"
                value={single.reference}
                onChange={(e) => setSingle((prev) => ({ ...prev, reference: e.target.value }))}
                placeholder="PRD-001"
              />

              <FormInput
                label="Name *"
                value={single.name}
                onChange={(e) => setSingle((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Product name"
              />

              <FormInput
                type="number"
                label="Selling Price"
                value={single.unitPrice}
                onChange={(e) => setSingle((prev) => ({ ...prev, unitPrice: e.target.value }))}
                placeholder="0.00"
              />

              <FormInput
                type="number"
                label="Purchase Price"
                value={single.purchasePrice}
                onChange={(e) => setSingle((prev) => ({ ...prev, purchasePrice: e.target.value }))}
                placeholder="0.00"
              />

              <div className="md:col-span-2">
                <FormTextarea
                  label="Description"
                  value={single.description}
                  onChange={(e) => setSingle((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder="Optional product description"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Express Bulk Product Creation" />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="form-label">Society *</label>
                  <select
                    className="input"
                    value={express.socId}
                    onChange={(e) => setExpress((prev) => ({ ...prev, socId: e.target.value }))}
                  >
                    <option value="">Select society</option>
                    {societies.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Category / Type *</label>
                  <select
                    className="input"
                    value={express.ptyId}
                    onChange={(e) => setExpress((prev) => ({ ...prev, ptyId: e.target.value }))}
                  >
                    <option value="">Select category</option>
                    {categories.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3 flex items-center gap-2">
                <input
                  id="skipExisting"
                  type="checkbox"
                  checked={express.skipExisting}
                  onChange={(e) => setExpress((prev) => ({ ...prev, skipExisting: e.target.checked }))}
                />
                <label htmlFor="skipExisting" className="text-sm">Skip existing references</label>
              </div>

              <FormTextarea
                label="Input lines"
                value={express.input}
                onChange={(e) => setExpress((prev) => ({ ...prev, input: e.target.value }))}
                rows={12}
                placeholder={[
                  'Format per line:',
                  'reference;name;sellingPrice;purchasePrice;description',
                  '',
                  'Example:',
                  'LED-001;LED Strip 5m;19.90;11.20;Warm white 3000K',
                ].join('\n')}
              />

              <p className="mt-2 text-sm text-muted-foreground">
                Parsed rows: {parsedExpressRows.filter((row) => row.reference && row.name).length}
              </p>
            </CardContent>
          </Card>

          {bulkResult && (
            <Card>
              <CardHeader title="Express Result" />
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-2xl font-semibold">{bulkResult.createdCount}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-sm text-muted-foreground">Skipped</p>
                    <p className="text-2xl font-semibold">{bulkResult.skippedCount}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-sm text-muted-foreground">Errors</p>
                    <p className="text-2xl font-semibold">{bulkResult.errorCount}</p>
                  </div>
                </div>
                {!!bulkResult.errors.length && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="font-medium text-destructive mb-2">Error details</p>
                    <ul className="space-y-1 text-sm">
                      {bulkResult.errors.slice(0, 20).map((errorRow, idx) => (
                        <li key={`${errorRow.line}-${idx}`}>
                          Line {errorRow.line} ({errorRow.reference}): {errorRow.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </PageContainer>
  )
}
