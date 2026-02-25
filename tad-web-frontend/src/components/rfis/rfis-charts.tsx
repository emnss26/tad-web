"use client"

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type CountMap = Record<string, number>

interface RfiStatusChartProps {
  data: CountMap
  onClick?: (value: string) => void
}

interface RfiPriorityChartProps {
  data: CountMap
  onClick?: (value: string) => void
}

interface RfiDisciplineChartProps {
  data: CountMap
  onClick?: (value: string) => void
}

interface PiePoint {
  key: string
  name: string
  value: number
  fill: string
}

interface BarPoint {
  name: string
  value: number
  fill: string
}

const COLORS = {
  status: {
    open: "#f59e0b",
    answered: "#3b82f6",
    closed: "#22c55e",
    draft: "#9ca3af",
    void: "#ef4444",
  },
  priority: {
    high: "#ef4444",
    normal: "#94a3b8",
    low: "#22c55e",
  },
  discipline: ["#0ea5e9", "#8b5cf6", "#f59e0b", "#22c55e", "#ef4444", "#ec4899"],
}

const formatLabel = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())

function normalizePieData(data: CountMap, palette: Record<string, string>): PiePoint[] {
  return Object.entries(data)
    .map(([key, rawValue]) => ({
      key,
      name: formatLabel(key),
      value: Math.max(0, Math.round(Number(rawValue) || 0)),
      fill: palette[key] || "#94a3b8",
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
}

function RfiPieChart({
  data,
  palette,
  onClick,
}: {
  data: CountMap
  palette: Record<string, string>
  onClick?: (value: string) => void
}) {
  const chartData = normalizePieData(data, palette)

  if (chartData.length === 0) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-3 overflow-hidden">
      <div className="relative h-[220px] w-full max-w-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={92}
              onClick={(entry) => onClick?.(entry.key)}
              className="cursor-pointer"
            >
              {chartData.map((entry, index) => (
                <Cell key={`${entry.key}-${index}`} fill={entry.fill} stroke="hsl(var(--background))" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const row = payload[0]?.payload as Partial<PiePoint> | undefined
                  const name = row?.name || "Unknown"
                  const count = Math.max(0, Math.round(Number(row?.value) || 0))
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="font-medium">{name}</div>
                      <div className="text-sm text-muted-foreground">{count} RFIs</div>
                    </div>
                  )
                }
                return null
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full max-w-[440px] flex flex-wrap items-center justify-center gap-2 px-2">
        {chartData.map((item) => (
          <button
            key={item.key}
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
            onClick={() => onClick?.(item.key)}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
            <span>{item.name}</span>
            <span className="font-semibold">{item.value}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function RfiStatusChart({ data, onClick }: RfiStatusChartProps) {
  return <RfiPieChart data={data} palette={COLORS.status} onClick={onClick} />
}

export function RfiPriorityChart({ data, onClick }: RfiPriorityChartProps) {
  return <RfiPieChart data={data} palette={COLORS.priority} onClick={onClick} />
}

export function RfiDisciplineChart({ data, onClick }: RfiDisciplineChartProps) {
  const chartData: BarPoint[] = Object.entries(data)
    .map(([key, rawValue], index) => ({
      name: key.length > 18 ? `${key.slice(0, 18)}...` : key,
      value: Math.max(0, Math.round(Number(rawValue) || 0)),
      fill: COLORS.discipline[index % COLORS.discipline.length],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  if (chartData.length === 0) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>
  }

  const maxValue = Math.max(...chartData.map((item) => item.value))
  const domainMax = Math.max(1, maxValue)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 20, bottom: 8 }}>
        <XAxis type="number" domain={[0, domainMax]} allowDecimals={false} axisLine={false} tickLine={false} />
        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} onClick={(entry) => onClick?.(entry.name)} className="cursor-pointer">
          {chartData.map((entry, index) => (
            <Cell key={`${entry.name}-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
