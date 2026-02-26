import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { AccService } from "@/services/acc.service"
import { utils, writeFile } from "xlsx"

// UI Components
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import ModulePageHeader from "@/components/hub/ModulePageHeader"
import { Users, Briefcase, UserCheck, Download, FilterX, Building2, Shield, AlertCircle } from "lucide-react"

// Custom Components (Importados de donde los hayas guardado)
import { CompanyUsersChart } from "@/components/users/company-users-chart"
import { RoleUsersChart } from "@/components/users/role-users-chart"
import { UsersTable } from "@/components/users/users-table"
import { StatCard } from "@/components/users/stat-card"

export default function ACCProjectUsersPage() {
  const { projectId } = useParams<{ projectId: string }>();
  
  // --- Estados ---
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- Filtros ---
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  // --- Stats para Gráficos ---
  const [stats, setStats] = useState({ total: 0, active: 0, companiesCount: 0, rolesCount: 0 })
  const [companyCounts, setCompanyCounts] = useState<Record<string, number>>({})
  const [roleCounts, setRoleCounts] = useState<{ name: string; value: number }[]>([])

  // 1. Cargar Datos Reales
  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Llamada al servicio real
        const response = await AccService.getProjectUsers(projectId);
        
        // Manejo robusto de respuesta (puede venir como {users: []} o directamente [])
        const rawUsers = response.users || response || [];
        
        setUsers(rawUsers);
        setFilteredUsers(rawUsers);
        processStats(rawUsers);

      } catch {
        setError("Failed to load project users. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // 2. Procesar Estadísticas
  const processStats = (userList: any[]) => {
    const companies: Record<string, number> = {}
    const roles: Record<string, number> = {}
    let activeCount = 0

    userList.forEach((user) => {
      if (user.status === "active") activeCount++

      const compName = user.companyName || "Not Specified"
      companies[compName] = (companies[compName] || 0) + 1

      const userRoles = user.roles || []
      if (userRoles.length > 0) {
        userRoles.forEach((r: any) => {
          const roleName = r.name || "Unknown"
          roles[roleName] = (roles[roleName] || 0) + 1
        })
      } else {
        roles["No Role"] = (roles["No Role"] || 0) + 1
      }
    })

    // Formato para Recharts
    const roleCountsArray = Object.entries(roles).map(([name, count]) => ({
      name,
      value: count,
    }))

    setStats({
      total: userList.length,
      active: activeCount,
      companiesCount: Object.keys(companies).length,
      rolesCount: Object.keys(roles).length,
    })

    setCompanyCounts(companies)
    setRoleCounts(roleCountsArray)
  }

  // 3. Filtrado
  useEffect(() => {
    let result = users
    if (selectedCompany) {
      result = result.filter((u) => (u.companyName || "Not Specified") === selectedCompany)
    }
    if (selectedRole) {
      result = result.filter((u) => {
        if (!u.roles || u.roles.length === 0) return selectedRole === "No Role"
        return u.roles.some((r: any) => r.name === selectedRole)
      })
    }
    setFilteredUsers(result)
  }, [selectedCompany, selectedRole, users])

  // 4. Exportar a Excel
  const handleExport = () => {
    const dataToExport = filteredUsers.map(u => ({
        Name: u.name,
        Email: u.email,
        Company: u.companyName,
        Status: u.status,
        Roles: u.roles?.map((r: any) => r.name).join(', ')
    }));
    
    const ws = utils.json_to_sheet(dataToExport);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Users");
    writeFile(wb, `Project_${projectId}_Users.xlsx`);
  }

  const hasFilters = selectedCompany || selectedRole

  if (error) {
      return (
          <div className="flex h-[50vh] items-center justify-center text-red-500 gap-2">
              <AlertCircle className="h-6 w-6" />
              <span>{error}</span>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6 space-y-6 animate-in fade-in duration-500">
        <ModulePageHeader
          title="Users"
          description="Manage and analyze project team members."
          actions={
            <>
              {hasFilters && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCompany(null);
                    setSelectedRole(null);
                  }}
                >
                  <FilterX className="mr-2 h-4 w-4" /> Clear Filters
                </Button>
              )}
              <Button onClick={handleExport} disabled={loading || filteredUsers.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </>
          }
        />

        {/* Active Filters Badges */}
        {hasFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {selectedCompany && (
              <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setSelectedCompany(null)}>
                <Building2 className="h-3 w-3" /> {selectedCompany} <span className="ml-1 hover:text-red-500">×</span>
              </Badge>
            )}
            {selectedRole && (
              <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setSelectedRole(null)}>
                <Shield className="h-3 w-3" /> {selectedRole} <span className="ml-1 hover:text-red-500">×</span>
              </Badge>
            )}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total Users" value={stats.total} icon={<Users className="h-5 w-5" />} loading={loading} />
          <StatCard title="Active Users" value={stats.active} icon={<UserCheck className="h-5 w-5" />} loading={loading} variant="success" description={`${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total`} />
          <StatCard title="Companies" value={stats.companiesCount} icon={<Briefcase className="h-5 w-5" />} loading={loading} />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-muted-foreground" /> Users by Company</CardTitle>
              <CardDescription>Click to filter by company</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {loading ? <Skeleton className="h-full w-full" /> : 
                <CompanyUsersChart data={companyCounts} onClick={setSelectedCompany} />
              }
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-muted-foreground" /> Users by Role</CardTitle>
              <CardDescription>Click to filter by role</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {loading ? <Skeleton className="h-full w-full" /> : 
                <RoleUsersChart data={roleCounts} onClick={setSelectedRole} />
              }
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Directory</CardTitle>
            <CardDescription>{filteredUsers.length} members found</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-40 w-full" /></div> : 
                <UsersTable users={filteredUsers} />
            }
          </CardContent>
        </Card>
    </div>
  )
}
