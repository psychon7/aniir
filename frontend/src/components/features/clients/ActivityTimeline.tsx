import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { Card, CardHeader, CardContent } from '@/components/ui/layout/Card'
import { useClientActivity } from '@/hooks/useClientActivity'
import type { ActivityEntityType } from '@/types/activity'

const TYPE_CONFIG: Record<ActivityEntityType, { color: string; bgColor: string; icon: string; route: string }> = {
  quote: { color: 'text-purple-600', bgColor: 'bg-purple-100', icon: 'Q', route: '/quotes' },
  order: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: 'O', route: '/orders' },
  delivery: { color: 'text-amber-600', bgColor: 'bg-amber-100', icon: 'D', route: '/deliveries' },
  invoice: { color: 'text-green-600', bgColor: 'bg-green-100', icon: 'I', route: '/invoices' },
  payment: { color: 'text-emerald-600', bgColor: 'bg-emerald-100', icon: 'P', route: '/payments' },
}

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'quote', label: 'Quotes' },
  { value: 'order', label: 'Orders' },
  { value: 'delivery', label: 'Deliveries' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'payment', label: 'Payments' },
]

interface ActivityTimelineProps {
  clientId: number
}

export function ActivityTimeline({ clientId }: ActivityTimelineProps) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [entityType, setEntityType] = useState('')

  const { data, isLoading } = useClientActivity(clientId, {
    page,
    pageSize: 20,
    entityType: entityType || undefined,
  })

  const items = data?.data || []
  const hasMore = data?.hasMore || false

  return (
    <Card>
      <CardHeader
        title={`${t('clients.activity', 'Activity')} (${data?.totalCount || 0})`}
        action={
          <div className="flex gap-1">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setEntityType(opt.value); setPage(1) }}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  entityType === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      />
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('clients.noActivity', 'No activity recorded')}</p>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {items.map((item) => {
                const config = TYPE_CONFIG[item.entityType]
                return (
                  <div key={`${item.entityType}-${item.id}`} className="relative flex gap-3 pl-0">
                    {/* Icon */}
                    <div className={`relative z-10 w-7 h-7 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-xs font-bold ${config.color}`}>{config.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${config.bgColor} ${config.color}`}>
                            {item.entityType}
                          </span>
                          {item.reference && (
                            <Link
                              to={`${config.route}/${item.id}` as string}
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              {item.reference}
                            </Link>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {item.date ? new Date(item.date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }) : '-'}
                        </span>
                      </div>
                      {(item.description || item.amount != null) && (
                        <div className="flex items-center gap-2 mt-1">
                          {item.description && (
                            <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                          )}
                          {item.amount != null && item.amount > 0 && (
                            <span className="text-sm font-medium text-foreground ml-auto whitespace-nowrap">
                              {item.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {(hasMore || page > 1) && (
              <div className="flex justify-center gap-2 pt-4 border-t border-border mt-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="text-xs px-3 py-1 rounded bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.previous')}
                </button>
                <span className="text-xs text-muted-foreground py-1">
                  {t('common.page')} {page}
                </span>
                <button
                  disabled={!hasMore}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-xs px-3 py-1 rounded bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.next')}
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
