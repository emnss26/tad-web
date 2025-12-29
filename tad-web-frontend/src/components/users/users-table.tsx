import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

// Interface ajustada a tus datos reales
interface User {
  id?: string
  email: string
  name?: string
  firstName?: string
  lastName?: string
  companyName?: string
  jobTitle?: string
  status?: string
  roles?: { name: string }[]
}

interface UsersTableProps {
  users: User[]
}

const ITEMS_PER_PAGE = 10

export function UsersTable({ users }: UsersTableProps) {
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users
    const searchLower = search.toLowerCase()
    return users.filter(
      (user) =>
        user.email?.toLowerCase().includes(searchLower) ||
        user.name?.toLowerCase().includes(searchLower) ||
        user.companyName?.toLowerCase().includes(searchLower)
    )
  }, [users, search])

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    if (user.name) return user.name.substring(0, 2).toUpperCase();
    return user.email.substring(0, 2).toUpperCase();
  }

  const getDisplayName = (user: User) => user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "active": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "pending": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "inactive": return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      default: return "bg-gray-100 text-gray-600";
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>User</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user, index) => (
                <TableRow key={user.id || index} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {getInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{getDisplayName(user)}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{user.companyName || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.slice(0, 2).map((role, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0 h-5">
                          {role.name}
                        </Badge>
                      ))}
                      {user.roles && user.roles.length > 2 && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">+{user.roles.length - 2}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(user.status)}>
                      {user.status || "Unknown"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Simple */}
      <div className="flex items-center justify-end space-x-2 py-2">
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages || 1}</span>
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}