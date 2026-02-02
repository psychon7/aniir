import { useState, useEffect, useMemo } from 'react'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import { FormInput } from '@/components/ui/form/FormInput'
import { useToast } from '@/components/ui/feedback/Toast'
import {
  usePaymentForAllocation,
  useClientUnpaidInvoices,
  useAllocatePayment,
  useAutoAllocatePayment,
} from '@/hooks/usePaymentAllocation'
import type { Payment } from '@/types/payment'
import type { AllocationItem, AllocatableInvoice } from '@/types/allocation'
import { cn } from '@/lib/utils'

interface PaymentAllocationModalProps {
  isOpen: boolean
  onClose: () => void
  payment: Payment | null
}

interface AllocationEntry {
  invoiceId: number
  amount: string
}

export function PaymentAllocationModal({
  isOpen,
  onClose,
  payment,
}: PaymentAllocationModalProps) {
  const { success, error: showError } = useToast()

  // State for allocation entries
  const [allocations, setAllocations] = useState<AllocationEntry[]>([])

  // Fetch payment details with allocation info
  const { data: paymentDetails, isLoading: loadingPayment } = usePaymentForAllocation(
    isOpen && payment ? payment.id : null
  )

  // Fetch unpaid invoices for the client
  const { data: unpaidInvoices = [], isLoading: loadingInvoices } = useClientUnpaidInvoices(
    isOpen && payment ? payment.clientId : null
  )

  // Mutations
  const allocateMutation = useAllocatePayment()
  const autoAllocateMutation = useAutoAllocatePayment()

  const isSubmitting = allocateMutation.isPending || autoAllocateMutation.isPending

  // Initialize allocations when invoices load
  useEffect(() => {
    if (unpaidInvoices.length > 0 && allocations.length === 0) {
      setAllocations(
        unpaidInvoices.map((inv) => ({
          invoiceId: inv.id,
          amount: '',
        }))
      )
    }
  }, [unpaidInvoices, allocations.length])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAllocations([])
    }
  }, [isOpen])

  // Calculate totals
  const totalAllocated = useMemo(() => {
    return allocations.reduce((sum, alloc) => {
      const amount = parseFloat(alloc.amount) || 0
      return sum + amount
    }, 0)
  }, [allocations])

  const unallocatedAmount = paymentDetails?.unallocatedAmount ?? payment?.amount ?? 0
  const remainingAfterAllocation = unallocatedAmount - totalAllocated

  // Update allocation amount for an invoice
  const handleAllocationChange = (invoiceId: number, value: string) => {
    setAllocations((prev) =>
      prev.map((alloc) =>
        alloc.invoiceId === invoiceId ? { ...alloc, amount: value } : alloc
      )
    )
  }

  // Set allocation to full balance for an invoice
  const handleAllocateFull = (invoice: AllocatableInvoice) => {
    const maxAmount = Math.min(invoice.balanceDue, remainingAfterAllocation + (parseFloat(
      allocations.find(a => a.invoiceId === invoice.id)?.amount || '0'
    ) || 0))

    handleAllocationChange(invoice.id, maxAmount.toFixed(2))
  }

  // Handle manual allocation submission
  const handleSubmit = async () => {
    if (!payment) return

    // Build allocation items from non-zero entries
    const allocationItems: AllocationItem[] = allocations
      .filter((alloc) => {
        const amount = parseFloat(alloc.amount)
        return !isNaN(amount) && amount > 0
      })
      .map((alloc) => ({
        invoiceId: alloc.invoiceId,
        amount: parseFloat(alloc.amount),
      }))

    if (allocationItems.length === 0) {
      showError('Validation Error', 'Please enter at least one allocation amount.')
      return
    }

    // Validate total doesn't exceed available
    if (totalAllocated > unallocatedAmount) {
      showError('Validation Error', 'Total allocation exceeds available payment amount.')
      return
    }

    // Validate individual amounts don't exceed invoice balances
    for (const item of allocationItems) {
      const invoice = unpaidInvoices.find((inv) => inv.id === item.invoiceId)
      if (invoice && item.amount > invoice.balanceDue) {
        showError(
          'Validation Error',
          `Allocation for ${invoice.code} exceeds invoice balance of ${formatCurrency(invoice.balanceDue)}.`
        )
        return
      }
    }

    try {
      const result = await allocateMutation.mutateAsync({
        paymentId: payment.id,
        request: { allocations: allocationItems },
      })

      success(
        'Payment Allocated',
        `Successfully allocated ${formatCurrency(result.totalAllocated)} to ${result.allocations.length} invoice(s).`
      )
      onClose()
    } catch (err) {
      showError('Allocation Failed', 'An error occurred while allocating the payment.')
    }
  }

  // Handle auto-allocation
  const handleAutoAllocate = async () => {
    if (!payment) return

    try {
      const result = await autoAllocateMutation.mutateAsync(payment.id)

      if (result.allocations.length === 0) {
        showError('No Allocations', 'No unpaid invoices were found for auto-allocation.')
        return
      }

      success(
        'Auto-Allocation Complete',
        `Automatically allocated ${formatCurrency(result.totalAllocated)} to ${result.allocations.length} invoice(s).`
      )
      onClose()
    } catch (err) {
      showError('Auto-Allocation Failed', 'An error occurred during auto-allocation.')
    }
  }

  // Format currency
  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const isLoading = loadingPayment || loadingInvoices

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Allocate Payment"
      description={payment ? `Allocate ${payment.reference} to invoices` : undefined}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={handleAutoAllocate}
            disabled={isSubmitting || unpaidInvoices.length === 0}
            className={cn(
              'btn-secondary',
              (isSubmitting || unpaidInvoices.length === 0) && 'opacity-50 cursor-not-allowed'
            )}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Auto-Allocate (FIFO)
          </button>
          <FormModalFooter
            onCancel={onClose}
            onSubmit={handleSubmit}
            submitText="Allocate"
            isSubmitting={isSubmitting}
            submitDisabled={totalAllocated === 0 || remainingAfterAllocation < 0}
          />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Payment Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Reference</p>
                <p className="font-medium font-mono">{payment?.reference}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Client</p>
                <p className="font-medium">{payment?.clientName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Amount</p>
                <p className="font-medium">
                  {formatCurrency(payment?.amount ?? 0, payment?.currencyCode)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Available to Allocate</p>
                <p className="font-medium text-primary">
                  {formatCurrency(unallocatedAmount, payment?.currencyCode)}
                </p>
              </div>
            </div>
          </div>

          {/* Invoice Selection */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Unpaid Invoices ({unpaidInvoices.length})
            </h3>

            {unpaidInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>No unpaid invoices found for this client.</p>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border">
                  <div className="col-span-2">Invoice</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-2">Due Date</div>
                  <div className="col-span-2 text-right">Balance Due</div>
                  <div className="col-span-3 text-right">Allocation</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Invoice Rows */}
                <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                  {unpaidInvoices.map((invoice) => {
                    const allocation = allocations.find((a) => a.invoiceId === invoice.id)
                    const allocationAmount = parseFloat(allocation?.amount || '0') || 0
                    const isOverAllocated = allocationAmount > invoice.balanceDue

                    return (
                      <div
                        key={invoice.id}
                        className={cn(
                          'grid grid-cols-12 gap-2 px-4 py-3 items-center',
                          invoice.isOverdue && 'bg-destructive/5'
                        )}
                      >
                        <div className="col-span-2">
                          <p className="font-mono text-sm">{invoice.code}</p>
                          {invoice.isOverdue && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive">
                              Overdue
                            </span>
                          )}
                        </div>
                        <div className="col-span-2 text-sm text-muted-foreground">
                          {formatDate(invoice.invoiceDate)}
                        </div>
                        <div className="col-span-2 text-sm text-muted-foreground">
                          {invoice.termDate ? formatDate(invoice.termDate) : '-'}
                        </div>
                        <div className="col-span-2 text-right font-medium">
                          {formatCurrency(invoice.balanceDue, invoice.currencyCode)}
                        </div>
                        <div className="col-span-3">
                          <FormInput
                            type="number"
                            min="0"
                            step="0.01"
                            max={invoice.balanceDue}
                            value={allocation?.amount || ''}
                            onChange={(e) => handleAllocationChange(invoice.id, e.target.value)}
                            placeholder="0.00"
                            error={isOverAllocated}
                            className="text-right"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleAllocateFull(invoice)}
                            className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Allocate full balance"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Allocation Summary */}
          {unpaidInvoices.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total to Allocate</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(totalAllocated, payment?.currencyCode)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Remaining After Allocation</p>
                  <p
                    className={cn(
                      'text-lg font-semibold',
                      remainingAfterAllocation < 0 ? 'text-destructive' : 'text-primary'
                    )}
                  >
                    {formatCurrency(remainingAfterAllocation, payment?.currencyCode)}
                  </p>
                </div>
              </div>
              {remainingAfterAllocation < 0 && (
                <p className="text-sm text-destructive mt-2">
                  Total allocation exceeds available payment amount.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </FormModal>
  )
}
