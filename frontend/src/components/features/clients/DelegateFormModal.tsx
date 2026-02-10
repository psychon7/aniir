import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { FormInput } from '@/components/ui/form/FormInput'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import { useClients } from '@/hooks/useClients'
import type { ClientDelegateCreateDto } from '@/types/delegate'

interface DelegateFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ClientDelegateCreateDto) => void
  isSubmitting?: boolean
  excludeClientId?: number
}

export function DelegateFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  excludeClientId,
}: DelegateFormModalProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [selectedClientName, setSelectedClientName] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Search clients with debounce
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: clientsData, isLoading: isSearching } = useClients({
    search: debouncedSearch || undefined,
    pageSize: 10,
    page: 1,
  })

  const clients = (clientsData?.data ?? []).filter(
    (c) => c.id !== excludeClientId
  )

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('')
      setSelectedClientId(null)
      setSelectedClientName('')
      setIsDropdownOpen(false)
    }
  }, [isOpen])

  const handleSelectClient = useCallback(
    (clientId: number, clientName: string) => {
      setSelectedClientId(clientId)
      setSelectedClientName(clientName)
      setSearch(clientName)
      setIsDropdownOpen(false)
    },
    []
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setSelectedClientId(null)
    setSelectedClientName('')
    setIsDropdownOpen(true)
  }

  const handleSubmit = () => {
    if (!selectedClientId) return
    onSubmit({
      cdl_delegate_cli_id: selectedClientId,
    })
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('delegates.addDelegate', 'Add Delegate')}
      description={t(
        'delegates.addDelegateDescription',
        'Search and select a client to add as a delegate'
      )}
      footer={
        <FormModalFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitText={t('common.create', 'Create')}
          isSubmitting={isSubmitting}
          submitDisabled={!selectedClientId}
        />
      }
    >
      <div className="space-y-4">
        <div className="relative">
          <FormInput
            label={t('delegates.selectClient', 'Client')}
            value={search}
            onChange={handleSearchChange}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder={t(
              'delegates.searchClientPlaceholder',
              'Search by company name, reference...'
            )}
            required
          />

          {/* Selected indicator */}
          {selectedClientId && selectedClientName && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {t('delegates.selectedClient', 'Selected')}: {selectedClientName}
            </div>
          )}

          {/* Dropdown */}
          {isDropdownOpen && search && !selectedClientId && (
            <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  {t('common.searching', 'Searching...')}
                </div>
              ) : clients.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  {t('common.noResults', 'No results found')}
                </div>
              ) : (
                clients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    className="w-full px-4 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                    onClick={() =>
                      handleSelectClient(
                        client.id,
                        client.companyName || client.reference || `#${client.id}`
                      )
                    }
                  >
                    <p className="text-sm font-medium text-foreground">
                      {client.companyName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {client.reference}
                      {client.city && ` - ${client.city}`}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </FormModal>
  )
}
