import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent } from '@/components/ui/layout/Card'
import { useClientDelegates } from '@/hooks/useDelegates'
import type { ClientDelegate } from '@/types/delegate'

interface DelegatesTabProps {
  clientId: number
}

export function DelegatesTab({ clientId }: DelegatesTabProps) {
  const { t } = useTranslation()
  const { data: delegatesData, isLoading } = useClientDelegates(clientId)
  const delegates = delegatesData?.data ?? []

  return (
    <Card>
      <CardHeader title={`${t('delegates.delegates', 'Delegates')} (${delegates.length})`} />
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : delegates.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('delegates.noDelegatesFound', 'No delegates found')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">{t('clients.companyName')}</th>
                  <th className="py-2 pr-4 font-medium">{t('clients.contact', 'Contact')}</th>
                  <th className="py-2 pr-4 font-medium">{t('common.email')}</th>
                  <th className="py-2 pr-4 font-medium">{t('common.phone')}</th>
                  <th className="py-2 pr-4 font-medium">{t('clients.flags', 'Flags')}</th>
                </tr>
              </thead>
              <tbody>
                {delegates.map((delegate: ClientDelegate) => (
                  <tr key={delegate.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-foreground">{delegate.companyName || delegate.delegateClientName || '-'}</p>
                      {delegate.vatNumber && <p className="text-xs text-muted-foreground font-mono">{delegate.vatNumber}</p>}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{delegate.contactName || '-'}</td>
                    <td className="py-3 pr-4">
                      {delegate.email ? (
                        <a href={`mailto:${delegate.email}`} className="text-primary hover:underline">{delegate.email}</a>
                      ) : '-'}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{delegate.phone || '-'}</td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-1 flex-wrap">
                        {delegate.isPrimary && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">{t('common.primary', 'Primary')}</span>
                        )}
                        {delegate.isActive ? (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">{t('common.active', 'Active')}</span>
                        ) : (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t('common.inactive', 'Inactive')}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
