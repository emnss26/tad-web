"use client"
import { useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Legend, Tooltip } from "recharts"

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
  onSliceClick?: (status: string) => void
  selectedStatus?: string | null
}

export function IssueStatusChart({ data, onSliceClick, selectedStatus }: IssueStatusChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

  const chartData = Object.entries(data).map(([key, value]) => ({
    name: key.replace(/_/g, ' ').toUpperCase(),
    value,
    key,
    fill: STATUS_COLORS[key] || "#6b7280",
  }))

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props
    return (
      <g>
        <text x={cx} y={cy - 10} textAnchor="middle" fill="#1e293b" className="text-lg font-bold">{payload.value}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748b" className="text-xs">{payload.name}</text>
        <text x={cx} y={cy + 30} textAnchor="middle" fill="#94a3b8" className="text-xs">{(percent * 100).toFixed(0)}%</text>
        <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      </g>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          data={chartData}
          cx="50%" cy="50%"
          innerRadius={60} outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          onMouseEnter={(_, index) => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(undefined)}
          onClick={(entry) => onSliceClick?.(entry.key)}
          className="cursor-pointer outline-none"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} opacity={selectedStatus && selectedStatus !== entry.key ? 0.3 : 1} />
          ))}
        </Pie>
        <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}