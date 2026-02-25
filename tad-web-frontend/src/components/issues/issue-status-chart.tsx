"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { cn } from "@/lib/utils"

const STATUS_COLORS: Record<string, string> = {
  open: "#facc15",
  in_progress: "#3b82f6",
  in_review: "#8b5cf6",
  closed: "#22c55e",
  answered: "#10b981",
  void: "#94a3b8",
  pending: "#f97316",
}

interface IssueStatusChartProps {
  data: Record<string, number>
  onSliceClick?: (status: string | null) => void
  selectedStatus?: string | null
}

interface IssueStatusDatum {
  key: string
  name: string
  value: number
  fill: string
}

export function IssueStatusChart({ data, onSliceClick, selectedStatus }: IssueStatusChartProps) {
  const chartData: IssueStatusDatum[] = Object.entries(data)
    .map(([key, rawValue]) => ({
      key,
      name: key.replace(/_/g, " ").toUpperCase(),
      value: Math.max(0, Math.round(Number(rawValue) || 0)),
      fill: STATUS_COLORS[key] || "#6b7280",
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)

  if (chartData.length === 0) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">No issue data available</div>
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  const handleStatusClick = (statusKey: string) => {
    if (!onSliceClick) return
    onSliceClick(selectedStatus === statusKey ? null : statusKey)
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-3">
      <div className="relative h-[260px] w-full max-w-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={108}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              className="cursor-pointer outline-none"
              onClick={(entry) => handleStatusClick(entry.key)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  opacity={selectedStatus && selectedStatus !== entry.key ? 0.3 : 1}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              ))}
            </Pie>

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const row = payload[0]?.payload as Partial<IssueStatusDatum> | undefined
                  const label = row?.name || "UNKNOWN"
                  const count = Math.max(0, Math.round(Number(row?.value) || 0))
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0

                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="font-medium">{label}</div>
                      <div className="text-sm text-muted-foreground">
                        {count} issues ({percentage}%)
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900">{total}</span>
          <span className="text-xs uppercase tracking-wide text-slate-500">Total Issues</span>
        </div>
      </div>

      <div className="w-full max-w-[440px] flex flex-wrap items-center justify-center gap-2">
        {chartData.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => handleStatusClick(item.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors",
              selectedStatus === item.key
                ? "border-slate-400 bg-slate-100 text-slate-900"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            )}
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
