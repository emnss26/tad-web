"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

// CORRECCIÓN AQUÍ: Agregamos [key: string]: any para satisfacer a Recharts
interface RoleData {
  name: string
  value: number
  [key: string]: any 
}

interface RoleUsersChartProps {
  data: RoleData[]
  onClick?: (role: string) => void
}

const COLORS = [
  "hsl(221, 83%, 53%)", // Blue
  "hsl(142, 71%, 45%)", // Green
  "hsl(262, 83%, 58%)", // Purple
  "hsl(24, 95%, 53%)", // Orange
  "hsl(350, 89%, 60%)", // Red
  "hsl(199, 89%, 48%)", // Cyan
  "hsl(43, 96%, 56%)", // Yellow
  "hsl(280, 65%, 60%)", // Violet
]

export function RoleUsersChart({ data, onClick }: RoleUsersChartProps) {
  // Aseguramos que los valores sean números para evitar errores de ordenamiento
  const chartData = data
    .map(d => ({ ...d, value: Number(d.value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  if (chartData.length === 0) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">No role data available</div>
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          // TypeScript a veces se queja aquí, 'any' es seguro en este contexto de evento
          onClick={(data: any) => onClick?.(data.name)}
          className="cursor-pointer outline-none"
        >
          {chartData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              stroke="hsl(var(--background))"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="font-medium">{data.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {data.value} users ({percentage}%)
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}