"use client"
import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft, ChevronRight, Eye, Calendar, User } from "lucide-react"

// Interface alineada con AccService
interface Issue {
  id: string
  displayId: string
  title: string
  description?: string
  status: string
  // Usamos 'assignedTo' como string (nombre) o objeto si tu backend lo devuelve así
  assignedTo?: string 
  createdAt?: string
  dueDate?: string
}

interface IssuesTableProps {
  issues: Issue[]
  onViewDetails?: (id: string) => void
}

const ITEMS_PER_PAGE = 10

export function IssuesTable({ issues, onViewDetails }: IssuesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredIssues = useMemo(() => {
    if (!searchTerm) return issues;
    const q = searchTerm.toLowerCase();
    return issues.filter(i => 
        i.title?.toLowerCase().includes(q) || 
        i.displayId?.toLowerCase().includes(q) ||
        i.status?.toLowerCase().includes(q) ||
        (i.assignedTo || "").toLowerCase().includes(q)
    );
  }, [issues, searchTerm]);

  const totalPages = Math.ceil(filteredIssues.length / ITEMS_PER_PAGE);
  const paginatedIssues = filteredIssues.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString() : "-";

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'open': return 'bg-yellow-100 text-yellow-800';
          case 'answered': return 'bg-blue-100 text-blue-800';
          case 'closed': return 'bg-green-100 text-green-800';
          case 'void': return 'bg-gray-100 text-gray-800';
          default: return 'bg-gray-100';
      }
  }

  return (
    <div className="w-full space-y-4">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
            placeholder="Search issues..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-10"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Assigned To</TableHead>
              <TableHead className="hidden lg:table-cell">Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedIssues.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">No issues found.</TableCell></TableRow>
            ) : (
                paginatedIssues.map((issue) => (
                    <TableRow key={issue.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono text-xs">{issue.displayId || issue.id.substring(0,8)}</TableCell>
                        <TableCell>
                            <div className="max-w-[300px] truncate font-medium">{issue.title}</div>
                            {issue.description && <div className="max-w-[300px] truncate text-xs text-slate-500">{issue.description}</div>}
                        </TableCell>
                        <TableCell>
                            <Badge className={getStatusColor(issue.status)} variant="outline">{issue.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-600">
                            {issue.assignedTo ? <div className="flex items-center gap-2"><User className="h-3 w-3"/>{issue.assignedTo}</div> : "-"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-slate-600">
                            {issue.dueDate ? <div className="flex items-center gap-2"><Calendar className="h-3 w-3"/>{formatDate(issue.dueDate)}</div> : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => onViewDetails?.(issue.id)}>
                                <Eye className="h-4 w-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))
            )}
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