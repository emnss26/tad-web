"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"

export function SubmittalsTable({ items }: { items: any[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Spec</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-xs">{item.specSection || item.specIdentifier || "-"}</TableCell>
              <TableCell className="font-medium max-w-[250px] truncate" title={item.title}>{item.title}</TableCell>
              <TableCell><Badge variant="secondary">{item.status}</Badge></TableCell>
              <TableCell>{item.managerName || item.manager || "-"}</TableCell>
              <TableCell>{item.dueDate ? format(parseISO(item.dueDate), "MMM d, yyyy") : "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}