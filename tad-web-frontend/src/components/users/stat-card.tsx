import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface StatCardProps {
  title: string
  value: number | string
  icon?: ReactNode
  loading?: boolean
  variant?: "default" | "primary" | "success" | "warning"
  description?: string
}

export function StatCard({ title, value, icon, loading, variant = "default", description }: StatCardProps) {
  const variants = {
    default: "bg-card",
    primary: "bg-primary/5 border-primary/20",
    success: "bg-emerald-500/5 border-emerald-500/20",
    warning: "bg-amber-500/5 border-amber-500/20",
  }

  const textVariants = {
    default: "text-foreground",
    primary: "text-primary",
    success: "text-emerald-600",
    warning: "text-amber-600",
  }

  return (
    <Card className={cn("transition-all hover:shadow-md", variants[variant])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <span className={cn("text-muted-foreground", textVariants[variant])}>{icon}</span>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <div className={cn("text-3xl font-bold", textVariants[variant])}>{value}</div>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}