import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { PlanCount } from "./plans.types";

const COLORS = ["#00BCFF", "#0077b7", "#0c2c54", "#4eb3d3", "#6b7474", "#1e293b", "#2d6a4f"];

interface PlansPieChartProps {
  title: string;
  data: PlanCount[];
  onSliceClick?: (value: string) => void;
}

export function PlansPieChart({ title, data, onSliceClick }: PlansPieChartProps) {
  return (
    <Card className="h-[320px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[260px] pt-2">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="id"
                innerRadius={52}
                outerRadius={92}
                paddingAngle={2}
                onClick={(entry) => onSliceClick?.(String((entry as { id?: string })?.id || ""))}
              >
                {data.map((item, index) => (
                  <Cell key={item.id} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
