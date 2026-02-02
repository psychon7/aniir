import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card, CardHeader, CardContent } from '@/components/ui/layout/Card'
import type { AgingBucket } from '@/types/aging'

interface AgingChartProps {
  buckets: AgingBucket[]
  totalOutstanding: number
  chartType?: 'bar' | 'pie'
  title?: string
  description?: string
  className?: string
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: AgingBucket }>
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-foreground">{data.label}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Amount: <span className="font-medium text-foreground">{formatCurrency(data.amount)}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Percentage: <span className="font-medium text-foreground">{data.percentage.toFixed(1)}%</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Invoices: <span className="font-medium text-foreground">{data.invoiceCount}</span>
        </p>
      </div>
    )
  }
  return null
}

const renderPieLabel = (props: {
  cx?: number
  cy?: number
  midAngle?: number
  innerRadius?: number
  outerRadius?: number
  percent?: number
}) => {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props

  if (percent < 0.05) return null

  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function AgingChart({
  buckets,
  totalOutstanding,
  chartType = 'bar',
  title = 'Aging Analysis',
  description,
  className,
}: AgingChartProps) {
  const chartData = useMemo(() => {
    return buckets.map((bucket) => ({
      ...bucket,
      name: bucket.label,
    }))
  }, [buckets])

  return (
    <Card className={className} variant="elevated" padding="md">
      <CardHeader
        title={title}
        description={description || `Total Outstanding: ${formatCurrency(totalOutstanding)}`}
      />
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'currentColor' }}
                  className="text-muted-foreground text-xs"
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fill: 'currentColor' }}
                  className="text-muted-foreground text-xs"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="amount"
                  name="Amount"
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderPieLabel}
                  outerRadius={120}
                  innerRadius={60}
                  dataKey="amount"
                  paddingAngle={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
