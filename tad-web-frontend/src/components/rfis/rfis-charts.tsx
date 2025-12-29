"use client"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts"

// CORRECCIÓN: Tipamos explícitamente el objeto COLORS
const COLORS: {
  status: Record<string, string>;
  priority: Record<string, string>;
  discipline: string[];
} = {
  status: { open: "#f59e0b", answered: "#3b82f6", closed: "#22c55e", draft: "#9ca3af", void: "#ef4444" },
  priority: { high: "#ef4444", normal: "#f59e0b", low: "#22c55e" },
  discipline: ["#0ea5e9", "#8b5cf6", "#f59e0b", "#22c55e", "#ef4444", "#ec4899"]
}

export function RfiStatusChart({ data, onClick }: any) {
  const chartData = Object.entries(data).map(([key, value]) => ({ 
    name: key, 
    value, 
    // Ahora TS sabe que puede usar 'key' (string) para buscar en status
    fill: COLORS.status[key] || "#94a3b8" 
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie 
          data={chartData} 
          dataKey="value" 
          nameKey="name" 
          cx="50%" 
          cy="50%" 
          outerRadius={80} 
          onClick={(e) => onClick(e.name)} 
          className="cursor-pointer"
        >
          {chartData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function RfiPriorityChart({ data, onClick }: any) {
  const chartData = Object.entries(data).map(([key, value]) => ({ 
    name: key, 
    value, 
    // Igual aquí
    fill: COLORS.priority[key] || "#94a3b8" 
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie 
          data={chartData} 
          dataKey="value" 
          nameKey="name" 
          cx="50%" 
          cy="50%" 
          innerRadius={60} 
          outerRadius={80} 
          onClick={(e) => onClick(e.name)} 
          className="cursor-pointer"
        >
          {chartData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function RfiDisciplineChart({ data, onClick }: any) {
  const chartData = Object.entries(data)
    .map(([key, value], index) => ({ 
      name: key, 
      value, 
      fill: COLORS.discipline[index % COLORS.discipline.length] 
    }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 10);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
        <XAxis type="number" hide />
        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
        <Tooltip />
        <Bar 
          dataKey="value" 
          radius={[0, 4, 4, 0]} 
          onClick={(e) => onClick(e.name)} 
          className="cursor-pointer"
        >
           {chartData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}