import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ModulePageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export default function ModulePageHeader({
  title,
  description,
  actions,
  className,
  children,
}: ModulePageHeaderProps) {
  return (
    <header className={cn("rounded-lg border border-slate-200 bg-white p-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          {description ? <p className="text-sm text-slate-500">{description}</p> : null}
          {children ? <div className="text-xs text-slate-500">{children}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
