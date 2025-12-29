"use client"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts"

const COLORS = ["#0ea5e9", "#8b5cf6", "#f59e0b", "#22c55e", "#ef4444", "#ec4899"];

export function SubmittalStatusChart({ data, onClick }: any) {
  const chartData = Object.entries(data).map(([key, value]) => ({ name: key, value }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} onClick={(e) => onClick(e.name)} className="cursor-pointer">
          {chartData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function SubmittalSpecChart({ data, onClick }: any) {
  const chartData = Object.entries(data).map(([key, value]) => ({ name: key, value })).sort((a:any,b:any) => b.value - a.value).slice(0, 10);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
        <XAxis type="number" hide />
        <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 10}} />
        <Tooltip />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} onClick={(e) => onClick(e.name)} className="cursor-pointer">
           {chartData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}