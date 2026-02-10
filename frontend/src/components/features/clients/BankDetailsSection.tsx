import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent } from '@/components/ui/layout/Card'
import type { Client } from '@/types/client'

interface BankDetailsSectionProps {
  client: Client
}

export function BankDetailsSection({ client }: BankDetailsSectionProps) {
  const { t } = useTranslation()

  const hasBankDetails =
    client.bankIban || client.bankBic || client.bankName ||
    client.bankAccountHolder || client.bankAddress

  return (
    <Card>
      <CardHeader title={t('clients.bankDetails', 'Bank Details')} />
      <CardContent>
        {!hasBankDetails ? (
          <p className="text-sm text-muted-foreground">
            {t('clients.noBankDetails', 'No bank details recorded.')}
          </p>
        ) : (
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BankField label="IBAN" value={client.bankIban} mono />
            <BankField label="BIC / SWIFT" value={client.bankBic} mono />
            <BankField label={t('clients.bankName', 'Bank Name')} value={client.bankName} />
            <BankField label={t('clients.accountHolder', 'Account Holder')} value={client.bankAccountHolder} />
            <BankField label={t('common.address', 'Address')} value={client.bankAddress} span2 />
          </dl>
        )}
      </CardContent>
    </Card>
  )
}

function BankField({
  label,
  value,
  mono,
  span2,
}: {
  label: string
  value?: string
  mono?: boolean
  span2?: boolean
}) {
  return (
    <div className={span2 ? 'md:col-span-2' : ''}>
      <dt className="text-sm text-muted-foreground mb-1">{label}</dt>
      <dd className={`text-foreground ${mono ? 'font-mono text-sm' : ''}`}>
        {value || '-'}
      </dd>
    </div>
  )
}
