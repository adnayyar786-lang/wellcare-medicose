import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { formatChartDate, formatINR } from './format'

const TEXT = 'hsl(var(--muted-foreground))'

// Loaded on demand (React.lazy) so the chart library is not part of the first
// admin download. Data comes straight from real orders.
export default function SalesChart({ data }: { data: Array<{ date: string; sales: number }> }) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tickFormatter={formatChartDate}
            tick={{ fontSize: 11, fill: TEXT }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis tick={{ fontSize: 11, fill: TEXT }} tickLine={false} axisLine={false} width={48} />
          <Tooltip
            cursor={{ fill: 'hsl(var(--accent))' }}
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 8,
              color: 'hsl(var(--popover-foreground))',
              fontSize: 12,
            }}
            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
            labelFormatter={(label) => formatChartDate(String(label))}
            formatter={(value) => [formatINR(Number(value)), 'Sales']}
          />
          <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} animationDuration={350} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
