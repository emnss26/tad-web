"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { RfiDisciplineChart, RfiPriorityChart, RfiStatusChart } from "@/components/rfis/rfis-charts"

type FilterKey = "status" | "priority" | "discipline"

interface RfiChartCounts {
  status: Record<string, number>
  priority: Record<string, number>
  discipline: Record<string, number>
}

interface RfiChartsCarouselProps {
  counts: RfiChartCounts
  loading: boolean
  onFilter: (key: FilterKey, value: string) => void
  className?: string
}

export function RfiChartsCarousel({ counts, loading, onFilter, className }: RfiChartsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const slides = useMemo(
    () => [
      {
        key: "status" as const,
        title: "Status",
        description: "Pie chart by RFI status",
        render: <RfiStatusChart data={counts.status} onClick={(value) => onFilter("status", value)} />,
      },
      {
        key: "priority" as const,
        title: "Priority",
        description: "Pie chart by RFI priority",
        render: <RfiPriorityChart data={counts.priority} onClick={(value) => onFilter("priority", value)} />,
      },
      {
        key: "discipline" as const,
        title: "Discipline",
        description: "Bar chart by discipline",
        render: <RfiDisciplineChart data={counts.discipline} onClick={(value) => onFilter("discipline", value)} />,
      },
    ],
    [counts, onFilter],
  )

  const activeSlide = slides[activeIndex]

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length)
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{activeSlide.title}</CardTitle>
            <CardDescription>{activeSlide.description}</CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={goNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-[320px] p-0">
        {loading ? <div className="h-full p-4"><Skeleton className="h-full w-full" /></div> : activeSlide.render}
      </CardContent>

      <div className="flex items-center justify-center gap-2 px-6 pb-4">
        {slides.map((slide, index) => (
          <button
            key={slide.key}
            type="button"
            className={cn(
              "h-2.5 w-2.5 rounded-full transition-colors",
              index === activeIndex ? "bg-primary" : "bg-slate-300 hover:bg-slate-400",
            )}
            onClick={() => setActiveIndex(index)}
            aria-label={`Show ${slide.title} chart`}
          />
        ))}
      </div>
    </Card>
  )
}
