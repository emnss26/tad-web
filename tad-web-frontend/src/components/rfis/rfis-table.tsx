"use client"
import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { format, parseISO, isValid } from "date-fns"

export function RfisTable({ rfis, onViewDetails }: any) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filtered = rfis.filter((r: any) => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.customIdentifier || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = parseISO(dateStr);
    return isValid(date) ? format(date, "MMM d, yyyy") : "-";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search RFIs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Discipline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((rfi: any) => (
              <TableRow key={rfi.id}>
                <TableCell className="font-mono text-xs">{rfi.customIdentifier || rfi.id.substring(0,5)}</TableCell>
                <TableCell className="font-medium max-w-[200px] truncate" title={rfi.title}>{rfi.title}</TableCell>
                <TableCell>{rfi.discipline || "-"}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{rfi.status}</Badge></TableCell>
                <TableCell>
                    <Badge variant={rfi.priority === 'high' ? 'destructive' : 'secondary'} className="capitalize">
                        {rfi.priority}
                    </Badge>
                </TableCell>
                <TableCell>{rfi.assignedToName || rfi.assignedTo || "-"}</TableCell>
                <TableCell>{formatDate(rfi.createdAt)}</TableCell>
                <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => onViewDetails?.(rfi.id)}>
                        <Eye className="h-4 w-4 text-slate-500"/>
                    </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1}><ChevronLeft className="h-4 w-4"/></Button>
            <span className="text-sm py-2">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages}><ChevronRight className="h-4 w-4"/></Button>
        </div>
      )}
    </div>
  )
}