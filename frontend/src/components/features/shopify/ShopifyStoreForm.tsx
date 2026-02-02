import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormField } from '@/components/ui/form/FormField'
import { FormInput } from '@/components/ui/form/FormInput'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import type { ShopifyStore, ShopifyStoreCreateDto } from '@/types/shopify'

// Form validation schema
const shopifyStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required').max(100),
  shopDomain: z
    .string()
    .min(1, 'Shop domain is required')
    .regex(
      /^[a-zA-Z0-9-]+\.myshopify\.com$/,
      'Must be a valid Shopify domain (e.g., my-store.myshopify.com)'
    ),
  accessToken: z.string().min(1, 'Access token is required'),
  apiVersion: z.string().optional(),
  syncOrders: z.boolean().optional(),
  syncProducts: z.boolean().optional(),
  syncCustomers: z.boolean().optional(),
  syncInventory: z.boolean().optional(),
  webhooksEnabled: z.boolean().optional(),
})

// Edit mode schema (accessToken is optional)
const shopifyStoreEditSchema = shopifyStoreSchema.extend({
  accessToken: z.string().optional(),
})

type ShopifyStoreFormData = z.infer<typeof shopifyStoreSchema>

interface ShopifyStoreFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ShopifyStoreCreateDto) => void
  store?: ShopifyStore | null
  isSubmitting?: boolean
}

export function ShopifyStoreForm({
  isOpen,
  onClose,
  onSubmit,
  store,
  isSubmitting = false,
}: ShopifyStoreFormProps) {
  const isEditing = !!store

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ShopifyStoreFormData>({
    resolver: zodResolver(isEditing ? shopifyStoreEditSchema : shopifyStoreSchema),
    defaultValues: {
      name: store?.name || '',
      shopDomain: store?.shopDomain || '',
      accessToken: '',
      apiVersion: store?.apiVersion || '2025-01',
      syncOrders: store?.syncOrders ?? true,
      syncProducts: store?.syncProducts ?? true,
      syncCustomers: store?.syncCustomers ?? false,
      syncInventory: store?.syncInventory ?? false,
      webhooksEnabled: store?.webhooksEnabled ?? false,
    },
  })

  const syncOrders = watch('syncOrders')
  const syncProducts = watch('syncProducts')
  const syncCustomers = watch('syncCustomers')
  const syncInventory = watch('syncInventory')
  const webhooksEnabled = watch('webhooksEnabled')

  const handleFormSubmit = (data: ShopifyStoreFormData) => {
    onSubmit(data as ShopifyStoreCreateDto)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Shopify Store' : 'Connect Shopify Store'}
      description={
        isEditing
          ? 'Update Shopify store connection settings'
          : 'Connect a new Shopify store to sync orders, products, and inventory'
      }
      size="md"
      footer={
        <FormModalFooter
          onCancel={handleClose}
          onSubmit={handleSubmit(handleFormSubmit)}
          submitText={isEditing ? 'Save Changes' : 'Connect Store'}
          isSubmitting={isSubmitting}
        />
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Store Information */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            Store Information
          </h3>
          <div className="space-y-4">
            <FormField
              label="Store Name"
              htmlFor="name"
              error={errors.name?.message}
              required
            >
              <FormInput
                id="name"
                {...register('name')}
                error={!!errors.name}
                placeholder="My Shopify Store"
              />
            </FormField>

            <FormField
              label="Shop Domain"
              htmlFor="shopDomain"
              error={errors.shopDomain?.message}
              required
              hint="Your store's .myshopify.com domain"
            >
              <FormInput
                id="shopDomain"
                {...register('shopDomain')}
                error={!!errors.shopDomain}
                placeholder="my-store.myshopify.com"
                disabled={isEditing}
              />
            </FormField>

            <FormField
              label={isEditing ? 'New Access Token (optional)' : 'Access Token'}
              htmlFor="accessToken"
              error={errors.accessToken?.message}
              required={!isEditing}
              hint={
                isEditing
                  ? 'Leave blank to keep the current token'
                  : 'Generate from Shopify Admin > Apps > Develop apps'
              }
            >
              <FormInput
                id="accessToken"
                type="password"
                {...register('accessToken')}
                error={!!errors.accessToken}
                placeholder={isEditing ? '(unchanged)' : 'shpat_xxxxx...'}
              />
            </FormField>

            <FormField
              label="API Version"
              htmlFor="apiVersion"
              error={errors.apiVersion?.message}
              hint="Shopify API version to use"
            >
              <FormInput
                id="apiVersion"
                {...register('apiVersion')}
                error={!!errors.apiVersion}
                placeholder="2025-01"
              />
            </FormField>
          </div>
        </div>

        {/* Sync Settings */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            Sync Settings
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('syncOrders')}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
              />
              <div>
                <span className="text-sm font-medium text-foreground">Sync Orders</span>
                <p className="text-xs text-muted-foreground">
                  Import orders from Shopify into the ERP system
                </p>
              </div>
              {syncOrders && (
                <span className="ml-auto text-xs text-primary font-medium">Enabled</span>
              )}
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('syncProducts')}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
              />
              <div>
                <span className="text-sm font-medium text-foreground">Sync Products</span>
                <p className="text-xs text-muted-foreground">
                  Synchronize product catalog between systems
                </p>
              </div>
              {syncProducts && (
                <span className="ml-auto text-xs text-primary font-medium">Enabled</span>
              )}
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('syncCustomers')}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
              />
              <div>
                <span className="text-sm font-medium text-foreground">Sync Customers</span>
                <p className="text-xs text-muted-foreground">
                  Import customer data from Shopify
                </p>
              </div>
              {syncCustomers && (
                <span className="ml-auto text-xs text-primary font-medium">Enabled</span>
              )}
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('syncInventory')}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
              />
              <div>
                <span className="text-sm font-medium text-foreground">Sync Inventory</span>
                <p className="text-xs text-muted-foreground">
                  Keep inventory levels in sync across platforms
                </p>
              </div>
              {syncInventory && (
                <span className="ml-auto text-xs text-primary font-medium">Enabled</span>
              )}
            </label>
          </div>
        </div>

        {/* Webhook Settings */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            Webhook Settings
          </h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('webhooksEnabled')}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <div>
              <span className="text-sm font-medium text-foreground">Enable Webhooks</span>
              <p className="text-xs text-muted-foreground">
                Receive real-time updates from Shopify when events occur
              </p>
            </div>
            {webhooksEnabled && (
              <span className="ml-auto text-xs text-primary font-medium">Enabled</span>
            )}
          </label>
        </div>
      </form>
    </FormModal>
  )
}
