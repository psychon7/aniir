import type { StockListItem } from '@/types/warehouse'

interface Warehouse3DViewProps {
  items: StockListItem[]
}

interface WarehouseBucket {
  name: string
  items: StockListItem[]
}

function buildBuckets(items: StockListItem[]): WarehouseBucket[] {
  const byWarehouse = new Map<string, StockListItem[]>()
  for (const item of items) {
    const key = item.warehouse_name || 'Main Warehouse'
    const bucket = byWarehouse.get(key)
    if (bucket) {
      bucket.push(item)
    } else {
      byWarehouse.set(key, [item])
    }
  }

  return Array.from(byWarehouse.entries()).map(([name, bucketItems]) => ({
    name,
    items: bucketItems
      .slice()
      .sort((a, b) => (b.stk_quantity_available || 0) - (a.stk_quantity_available || 0))
      .slice(0, 8),
  }))
}

function qtyClass(value: number): string {
  if (value <= 0) return 'from-red-500/30 to-red-700/10 border-red-500/40'
  if (value < 10) return 'from-amber-400/25 to-amber-700/10 border-amber-500/40'
  return 'from-emerald-400/25 to-emerald-700/10 border-emerald-500/40'
}

export function Warehouse3DView({ items }: Warehouse3DViewProps) {
  const buckets = buildBuckets(items)

  if (!buckets.length) {
    return (
      <div className="card p-6">
        <p className="text-sm text-muted-foreground">No stock items available for 3D warehouse rendering.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {buckets.map((warehouse) => (
        <div key={warehouse.name} className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-medium">{warehouse.name}</h3>
            <p className="text-xs text-muted-foreground">Top {warehouse.items.length} bins by available quantity</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {warehouse.items.map((item) => {
              const available = Number(item.stk_quantity_available || 0)
              const total = Number(item.stk_quantity || 0)
              return (
                <div key={item.stk_id} className="relative h-36 [perspective:900px]">
                  <div className="absolute inset-x-6 bottom-2 h-3 rounded-full bg-primary/20 blur-lg" />
                  <div
                    className={`relative h-full rounded-xl border bg-gradient-to-br ${qtyClass(
                      available
                    )} p-3 shadow-sm [transform:rotateX(14deg)_rotateZ(-7deg)]`}
                  >
                    <p className="font-mono text-xs text-muted-foreground truncate">{item.product_ref || '-'}</p>
                    <p className="mt-1 text-sm font-medium line-clamp-2 min-h-[2.5rem]">{item.product_name || '-'}</p>
                    <div className="mt-3 space-y-1 text-xs">
                      <p>
                        Available: <span className="font-semibold">{available}</span>
                      </p>
                      <p>
                        Total: <span className="font-semibold">{total}</span>
                      </p>
                      <p>
                        Reserved: <span className="font-semibold">{Number(item.stk_quantity_reserved || 0)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
