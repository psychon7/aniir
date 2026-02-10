import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent } from '@/components/ui/layout/Card'
import { StatusBadge } from '@/components/ui/Badge'
import type { Client } from '@/types/client'

interface OverviewTabProps {
  client: Client
}

export function OverviewTab({ client }: OverviewTabProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Company Information */}
      <Card>
        <CardHeader title={t('clients.companyInformation')} />
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label={t('clients.companyName')} value={client.companyName} />
            <InfoItem label={t('clients.reference')} value={client.reference} mono />
            {client.abbreviation && <InfoItem label={t('clients.abbreviation', 'Abbreviation')} value={client.abbreviation} />}
            <InfoItem label={t('clients.name')} value={`${client.firstName || ''} ${client.lastName || ''}`.trim() || '-'} />
            <InfoItem label={t('common.email')} value={client.email} link={`mailto:${client.email}`} />
            <InfoItem label={t('common.phone')} value={client.phone} link={`tel:${client.phone}`} />
            <InfoItem label={t('clients.mobile')} value={client.mobile} link={`tel:${client.mobile}`} />
            <InfoItem label={t('common.website')} value={client.website} link={client.website} external />
            <InfoItem
              label={t('common.status')}
              value={<StatusBadge status={client.statusName} />}
            />
          </dl>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader title={t('common.address')} />
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <dt className="text-sm text-muted-foreground mb-1">{t('clients.streetAddress', 'Street Address')}</dt>
              <dd className="text-foreground">
                {client.address || '-'}
                {client.address2 && <><br />{client.address2}</>}
              </dd>
            </div>
            <InfoItem label={t('clients.city')} value={client.city} />
            <InfoItem label={t('clients.postalCode')} value={client.postalCode} />
            <InfoItem label={t('clients.country')} value={client.countryName} />
          </dl>
        </CardContent>
      </Card>

      {/* Business Details */}
      <Card>
        <CardHeader title={t('clients.businessDetails')} />
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label={t('clients.vatNumber')} value={client.vatNumber} mono />
            <InfoItem label={t('clients.siret')} value={client.siret} mono />
            <InfoItem label={t('clients.clientType')} value={client.clientTypeName} />
            <InfoItem label={t('clients.businessUnit')} value={client.businessUnitName} />
            <InfoItem label={t('clients.society')} value={client.societyName} />
            <InfoItem label={t('common.language')} value={client.languageCode?.toUpperCase()} />
          </dl>
        </CardContent>
      </Card>

      {/* Payment Terms */}
      <Card>
        <CardHeader title={t('clients.paymentTerms')} />
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label={t('clients.currency')} value={client.currencyCode} />
            <InfoItem label={t('clients.paymentMode')} value={client.paymentModeName} />
            <InfoItem label={t('clients.paymentTermsLabel')} value={client.paymentTermDays ? `${client.paymentTermDays} days` : '-'} />
            <InfoItem label={t('clients.creditLimit')} value={client.creditLimit ? `€${client.creditLimit.toLocaleString()}` : '-'} />
            <InfoItem label={t('clients.discount')} value={client.discount ? `${client.discount}%` : '-'} />
          </dl>
        </CardContent>
      </Card>

      {/* Account Managers */}
      {(client.commercialUser1Name || client.commercialUser2Name || client.commercialUser3Name) && (
        <Card>
          <CardHeader title={t('clients.accountManagers', 'Account Managers')} />
          <CardContent>
            <dl className="space-y-3">
              {client.commercialUser1Name && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{client.commercialUser1Name}</p>
                    <p className="text-xs text-muted-foreground">{t('clients.commercial1', 'Commercial 1')}</p>
                  </div>
                </div>
              )}
              {client.commercialUser2Name && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{client.commercialUser2Name}</p>
                    <p className="text-xs text-muted-foreground">{t('clients.commercial2', 'Commercial 2')}</p>
                  </div>
                </div>
              )}
              {client.commercialUser3Name && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{client.commercialUser3Name}</p>
                    <p className="text-xs text-muted-foreground">{t('clients.commercial3', 'Commercial 3')}</p>
                  </div>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {(client.notes || client.commentForClient || client.commentInternal) && (
        <Card className="lg:col-span-2">
          <CardHeader title={t('common.notes')} />
          <CardContent>
            <div className="space-y-4">
              {client.commentForClient && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">{t('clients.commentForClient', 'Comment For Client')}</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.commentForClient}</p>
                </div>
              )}
              {client.commentInternal && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">{t('clients.commentInternal', 'Internal Comment')}</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.commentInternal}</p>
                </div>
              )}
              {client.notes && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">{t('clients.internalNotes')}</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Record Information */}
      <Card>
        <CardHeader title={t('clients.recordInfo', 'Record Information')} />
        <CardContent>
          <dl className="space-y-4 text-sm">
            <InfoItem
              label={t('common.created')}
              value={new Date(client.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            />
            <InfoItem
              label={t('common.updated')}
              value={new Date(client.updatedAt).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

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
          </a>
        ) : (
          value || '-'
        )}
      </dd>
    </div>
  )
}
