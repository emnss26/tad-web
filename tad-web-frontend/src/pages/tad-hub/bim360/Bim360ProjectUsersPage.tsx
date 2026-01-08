import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Bim360Service } from "@/services/bim360.service"; // <--- CAMBIO CLAVE
import { utils, writeFile } from "xlsx";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Briefcase, UserCheck, Download, FilterX, Building2, Shield, AlertCircle } from "lucide-react";

// Custom Components
import { CompanyUsersChart } from "@/components/users/company-users-chart";
import { RoleUsersChart } from "@/components/users/role-users-chart";
import { UsersTable } from "@/components/users/users-table";
import { StatCard } from "@/components/users/stat-card";

export default function Bim360ProjectUsersPage() {
  const { projectId } = useParams<{ projectId: string }>();
  
  // --- Estados ---
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filtros ---
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // --- Stats para Gráficos ---
  const [stats, setStats] = useState({ total: 0, active: 0, companiesCount: 0, rolesCount: 0 });
  const [companyCounts, setCompanyCounts] = useState<Record<string, number>>({});
  const [roleCounts, setRoleCounts] = useState<{ name: string; value: number }[]>([]);

  // 1. Cargar Datos Reales
  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Llamada al servicio BIM360
        const response = await Bim360Service.getProjectUsers(projectId);
        
        // Manejo robusto de respuesta
        const rawUsers = response.users || response || [];
        
        setUsers(rawUsers);
        setFilteredUsers(rawUsers);
        processStats(rawUsers);

      } catch (err: any) {
        console.error("Error loading BIM360 users:", err);
        setError("Failed to load project users.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // 2. Procesar Estadísticas
  const processStats = (userList: any[]) => {
    const companies: Record<string, number> = {};
    const roles: Record<string, number> = {};
    let activeCount = 0;

    userList.forEach((user) => {
      if (user.status === "active") activeCount++;

      const compName = user.companyName || "Not Specified";
      companies[compName] = (companies[compName] || 0) + 1;

      const userRoles = user.roles || [];
      if (userRoles.length > 0) {
        userRoles.forEach((r: any) => {
          // BIM360 a veces devuelve roles como strings
          const roleName = typeof r === 'string' ? r : (r.name || "Unknown");
          roles[roleName] = (roles[roleName] || 0) + 1;
        });
      } else {
        roles["No Role"] = (roles["No Role"] || 0) + 1;
      }
    });

    const roleCountsArray = Object.entries(roles).map(([name, count]) => ({
      name,
      value: count,
    }));

    setStats({
      total: userList.length,
      active: activeCount,
      companiesCount: Object.keys(companies).length,
      rolesCount: Object.keys(roles).length,
    });

    setCompanyCounts(companies);
    setRoleCounts(roleCountsArray);
  };

  // 3. Filtrado
  useEffect(() => {
    let result = users;
    if (selectedCompany) {
      result = result.filter((u) => (u.companyName || "Not Specified") === selectedCompany);
    }
    if (selectedRole) {
      result = result.filter((u) => {
        if (!u.roles || u.roles.length === 0) return selectedRole === "No Role";
        return u.roles.some((r: any) => {
             const rName = typeof r === 'string' ? r : r.name;
             return rName === selectedRole;
        });
      });
    }
    setFilteredUsers(result);
  }, [selectedCompany, selectedRole, users]);

  // 4. Exportar a Excel
  const handleExport = () => {
    const dataToExport = filteredUsers.map(u => ({
        Name: u.name,
        Email: u.email,
        Company: u.companyName,
        Status: u.status,
        Roles: u.roles?.map((r: any) => (typeof r === 'string' ? r : r.name)).join(', ')
    }));
    
    const ws = utils.json_to_sheet(dataToExport);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "BIM360 Users");
    writeFile(wb, `BIM360_Project_${projectId}_Users.xlsx`);
  };

  const hasFilters = selectedCompany || selectedRole;

  if (error) {
      return (
          <div className="flex h-[50vh] items-center justify-center text-red-500 gap-2">
              <AlertCircle className="h-6 w-6" />
              <span>{error}</span>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6 space-y-6 animate-in fade-in duration-500">
      
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-indigo-900 dark:text-indigo-100">BIM 360 Team</h1>
            <p className="text-muted-foreground mt-1">Manage classic project members</p>
          </div>
          <div className="flex gap-2">
            {hasFilters && (
              <Button
                variant="outline"
                onClick={() => { setSelectedCompany(null); setSelectedRole(null); }}
              >
                <FilterX className="mr-2 h-4 w-4" /> Clear Filters
              </Button>
            )}
            <Button onClick={handleExport} disabled={loading || filteredUsers.length === 0} className="bg-indigo-600 hover:bg-indigo-700">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Users" value={stats.total} icon={<Users className="h-5 w-5 text-indigo-500" />} loading={loading} />
          <StatCard title="Active Users" value={stats.active} icon={<UserCheck className="h-5 w-5 text-green-500" />} loading={loading} variant="success" description={`${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total`} />
          <StatCard title="Companies" value={stats.companiesCount} icon={<Briefcase className="h-5 w-5 text-blue-500" />} loading={loading} />
          <StatCard title="Filtered View" value={filteredUsers.length} loading={loading} variant="primary" description={hasFilters ? "Based on filters" : "All users"} />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-muted-foreground" /> Users by Company</CardTitle>
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
  );
}