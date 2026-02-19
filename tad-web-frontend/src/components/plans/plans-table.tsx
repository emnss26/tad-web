import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronUp, Filter, Plus, Search, Trash2 } from "lucide-react";
import type { PlanRow } from "./plans.types";

interface PlansTableProps {
  plans: PlanRow[];
  onInputChange: (planId: string, field: keyof PlanRow, value: string) => void;
  onAddRow: () => void;
  onRemoveRows: (ids: string[]) => void;
  selectedRows: string[];
  setSelectedRows: Dispatch<SetStateAction<string[]>>;
}

const ITEMS_PER_PAGE = 10;

export function PlansTable({
  plans,
  onInputChange,
  onAddRow,
  onRemoveRows,
  selectedRows,
  setSelectedRows,
}: PlansTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof PlanRow>("SheetNumber");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [disciplineFilter, setDisciplineFilter] = useState("");

  const uniqueDisciplines = useMemo(
    () => Array.from(new Set(plans.map((p) => p.Discipline || "Unassigned"))),
    [plans]
  );

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return plans.filter((plan) => {
      const matchText =
        !term ||
        plan.SheetName.toLowerCase().includes(term) ||
        plan.SheetNumber.toLowerCase().includes(term) ||
        plan.Discipline.toLowerCase().includes(term) ||
        String(plan.Revision).toLowerCase().includes(term) ||
        String(plan.lastModifiedTime).toLowerCase().includes(term) ||
        plan.revisionProcess.toLowerCase().includes(term) ||
        plan.revisionStatus.toLowerCase().includes(term);

      const matchDiscipline = !disciplineFilter || plan.Discipline === disciplineFilter;
      return matchText && matchDiscipline;
    });
  }, [plans, searchTerm, disciplineFilter]);

  const sorted = useMemo(() => {
    const clone = [...filtered];
    return clone.sort((a, b) => {
      let first: string | number = a[sortField] as string;
      let second: string | number = b[sortField] as string;

      if (sortField === "Revision") {
        first = parseInt(String(first || "0"), 10) || 0;
        second = parseInt(String(second || "0"), 10) || 0;
        return sortDirection === "asc" ? first - second : second - first;
      }

      if (sortField === "lastModifiedTime") {
        first = new Date(String(first || "")).getTime() || 0;
        second = new Date(String(second || "")).getTime() || 0;
        return sortDirection === "asc" ? first - second : second - first;
      }

      return sortDirection === "asc"
        ? String(first || "").localeCompare(String(second || ""))
        : String(second || "").localeCompare(String(first || ""));
    });
  }, [filtered, sortDirection, sortField]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(start, start + ITEMS_PER_PAGE);
  }, [sorted, currentPage]);

  const padded = useMemo(() => {
    const missing = ITEMS_PER_PAGE - paginated.length;
    return missing > 0
      ? [
          ...paginated,
          ...Array.from({ length: missing }, (_, index) => ({
            id: `empty-${currentPage}-${index}`,
            SheetName: "",
            SheetNumber: "",
            Discipline: "",
            Revision: "",
            lastModifiedTime: "",
            exists: false,
            revisionProcess: "",
            revisionStatus: "",
            isPlaceholder: true,
          })),
        ]
      : paginated;
  }, [paginated, currentPage]);

  const handleSort = (field: keyof PlanRow) => {
    const nextDirection = field === sortField && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(nextDirection);
    setCurrentPage(1);
  };

  const sortIndicator = (field: keyof PlanRow) => {
    if (field !== sortField) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 inline h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 inline h-4 w-4" />
    );
  };

  const visibleIds = paginated.map((row) => row.id).filter((id) => !id.startsWith("empty-"));
  const areAllVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedRows.includes(id));

  return (
    <Card className="w-full">
      <CardHeader className="bg-muted/20 pb-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-lg">Plans List</CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full min-w-[200px] md:w-64">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search plans..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setDisciplineFilter("");
                setSortField("SheetNumber");
                setSortDirection("asc");
                setCurrentPage(1);
              }}
            >
              Reset
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-1.5 h-3.5 w-3.5" />
                  {disciplineFilter ? `Disc: ${disciplineFilter}` : "Filter"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onSelect={() => {
                    setDisciplineFilter("");
                    setCurrentPage(1);
                  }}
                >
                  All Disciplines
                </DropdownMenuItem>
                {uniqueDisciplines.map((discipline) => (
                  <DropdownMenuItem
                    key={discipline}
                    onSelect={() => {
                      setDisciplineFilter(discipline);
                      setCurrentPage(1);
                    }}
                  >
                    {discipline}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={onAddRow}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => onRemoveRows(selectedRows)}
              disabled={selectedRows.length === 0}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Remove ({selectedRows.length})
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px] p-2">
                  <input
                    type="checkbox"
                    checked={areAllVisibleSelected}
                    onChange={(event) =>
                      setSelectedRows(event.target.checked ? visibleIds : [])
                    }
                  />
                </TableHead>
                <TableHead className="cursor-pointer p-2" onClick={() => handleSort("Discipline")}>
                  Discipline{sortIndicator("Discipline")}
                </TableHead>
                <TableHead className="cursor-pointer p-2" onClick={() => handleSort("SheetName")}>
                  Sheet Name{sortIndicator("SheetName")}
                </TableHead>
                <TableHead className="cursor-pointer p-2" onClick={() => handleSort("SheetNumber")}>
                  Sheet Number{sortIndicator("SheetNumber")}
                </TableHead>
                <TableHead className="p-2 text-center">In Folder</TableHead>
                <TableHead className="cursor-pointer p-2 text-right" onClick={() => handleSort("Revision")}>
                  Revision{sortIndicator("Revision")}
                </TableHead>
                <TableHead
                  className="cursor-pointer p-2 text-right"
                  onClick={() => handleSort("lastModifiedTime")}
                >
                  Last Mod. Date{sortIndicator("lastModifiedTime")}
                </TableHead>
                <TableHead className="cursor-pointer p-2 text-center" onClick={() => handleSort("revisionProcess")}>
                  Process{sortIndicator("revisionProcess")}
                </TableHead>
                <TableHead className="cursor-pointer p-2 text-center" onClick={() => handleSort("revisionStatus")}>
                  Status{sortIndicator("revisionStatus")}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {sorted.length === 0 && (searchTerm || disciplineFilter) ? (
                <TableRow>
                  <TableCell colSpan={9} className="p-8 text-center text-sm text-muted-foreground">
                    No plans found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                padded.map((plan) =>
                  plan.isPlaceholder ? (
                    <TableRow key={plan.id} className="h-10">
                      <TableCell colSpan={9} className="bg-muted/10" />
                    </TableRow>
                  ) : (
                    <TableRow key={plan.id} className="hover:bg-muted/20">
                      <TableCell className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(plan.id)}
                          onChange={(event) =>
                            setSelectedRows((previous) =>
                              event.target.checked
                                ? [...previous, plan.id]
                                : previous.filter((id) => id !== plan.id)
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          className="border-none bg-transparent focus-visible:ring-0"
                          value={plan.Discipline}
                          onChange={(event) =>
                            onInputChange(plan.id, "Discipline", event.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          className="border-none bg-transparent focus-visible:ring-0"
                          value={plan.SheetName}
                          onChange={(event) =>
                            onInputChange(plan.id, "SheetName", event.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          className="border-none bg-transparent focus-visible:ring-0"
                          value={plan.SheetNumber}
                          onChange={(event) =>
                            onInputChange(plan.id, "SheetNumber", event.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell className="p-2 text-center">{plan.exists ? "YES" : "NO"}</TableCell>
                      <TableCell className="p-2 text-right">
                        <Input
                          className="border-none bg-transparent text-right focus-visible:ring-0"
                          value={plan.Revision}
                          onChange={(event) =>
                            onInputChange(plan.id, "Revision", event.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell className="p-2 text-right">{plan.lastModifiedTime || "-"}</TableCell>
                      <TableCell className="p-2 text-center">
                        {plan.revisionProcess || "Not in a revision process"}
                      </TableCell>
                      <TableCell className="p-2 text-center">
                        {plan.revisionStatus || "Not Applicable"}
                      </TableCell>
                    </TableRow>
                  )
                )
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t p-3">
            <span className="text-sm text-muted-foreground">
              Showing {paginated.length} of {sorted.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
