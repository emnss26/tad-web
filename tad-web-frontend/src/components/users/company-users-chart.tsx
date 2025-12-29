"use client"

import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface CompanyUsersChartProps {
  data: Record<string, number>
  onClick?: (company: string) => void
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

export function CompanyUsersChart({ data, onClick }: CompanyUsersChartProps) {
  const chartData = Object.entries(data)
    .map(([name, count]) => ({
      name: name.length > 20 ? name.substring(0, 20) + "..." : name,
      fullName: name,
      users: Number(count), // Aseguramos que sea número
    }))
    .sort((a, b) => b.users - a.users)
    .slice(0, 10)

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">No company data available</div>
    )
  }

  return (
    <ChartContainer
      config={{
        users: {
          label: "Users",
          color: "hsl(var(--chart-1))",
        },
      }}
      className="h-full w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
          <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
          <Bar
            dataKey="users"
            radius={[0, 4, 4, 0]}
            className="cursor-pointer"
            // CORRECCIÓN AQUÍ: Tipamos data como any para acceder a fullName
            onClick={(data: any) => onClick?.(data.fullName)}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}