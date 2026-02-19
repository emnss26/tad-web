import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Edit3, Plus, X } from "lucide-react";
import type { LodCheckerRow } from "./lod-checker.types";
import { createGeometryStatus, makeDefaultRows } from "./lod-checker.utils";

interface LodCheckerTableProps {
  discipline: string;
  rows: LodCheckerRow[];
  onRowsChange: (rows: LodCheckerRow[]) => void;
}

interface StatusButtonProps {
  isActive: boolean;
  onClick: () => void;
  colorClass: string;
  label: string;
}

function StatusButton({ isActive, onClick, colorClass, label }: StatusButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      onClick={onClick}
      className={`h-5 w-5 rounded-full p-0 text-xs ${
        isActive
          ? `${colorClass} text-white`
          : "border border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100"
      }`}
    >
      {label}
    </Button>
  );
}

export function LodCheckerTable({ discipline, rows, onRowsChange }: LodCheckerTableProps) {
  const [data, setData] = useState<LodCheckerRow[]>(rows);
  const [editingConceptRow, setEditingConceptRow] = useState<number | null>(null);
  const [editingLodRow, setEditingLodRow] = useState<number | null>(null);
  const [tempConcept, setTempConcept] = useState("");
  const [tempLod, setTempLod] = useState("");

  useEffect(() => {
    if (rows.length > 0) {
      setData(rows);
      return;
    }

    const defaults = makeDefaultRows(discipline);
    setData(defaults);
    onRowsChange(defaults);
  }, [discipline, onRowsChange, rows]);

  const setAndPropagate = (nextRows: LodCheckerRow[]) => {
    setData(nextRows);
    onRowsChange(nextRows);
  };

  const addRow = () => {
    const nextRowNumber = data.length ? Math.max(...data.map((item) => item.row)) + 1 : 1;
    const nextRows = [
      ...data,
      {
        row: nextRowNumber,
        concepto: "New Item",
        lodRequerido: 300,
        geometriaCompleta: createGeometryStatus("N"),
        lodCompletion: createGeometryStatus("N"),
        comentarios: "",
      },
    ];

    setAndPropagate(nextRows);
  };

  const toggleGeometry = (row: number, status: "y" | "n" | "na") => {
    const nextRows = data.map((item) =>
      item.row === row
        ? {
            ...item,
            geometriaCompleta: {
              y: status === "y",
              n: status === "n",
              na: status === "na",
            },
          }
        : item
    );

    setAndPropagate(nextRows);
  };

  const toggleLod = (row: number, status: "y" | "n" | "na") => {
    const nextRows = data.map((item) =>
      item.row === row
        ? {
            ...item,
            lodCompletion: {
              y: status === "y",
              n: status === "n",
              na: status === "na",
            },
          }
        : item
    );

    setAndPropagate(nextRows);
  };

  const updateComments = (row: number, value: string) => {
    const nextRows = data.map((item) => (item.row === row ? { ...item, comentarios: value } : item));
    setAndPropagate(nextRows);
  };

  const saveConcept = (row: number) => {
    const nextRows = data.map((item) =>
      item.row === row ? { ...item, concepto: tempConcept.trim() || item.concepto } : item
    );
    setAndPropagate(nextRows);
    setEditingConceptRow(null);
    setTempConcept("");
  };

  const saveLod = (row: number) => {
    const numeric = Number(tempLod);
    const nextRows = data.map((item) =>
      item.row === row
        ? {
            ...item,
            lodRequerido: Number.isFinite(numeric) && numeric > 0 ? numeric : item.lodRequerido,
          }
        : item
    );

    setAndPropagate(nextRows);
    setEditingLodRow(null);
    setTempLod("");
  };

  const complianceStats = useMemo(() => {
    const total = data.length;
    const completed = data.filter((item) => item.geometriaCompleta.y && item.lodCompletion.y).length;
    return total ? Math.round((completed / total) * 100) : 0;
  }, [data]);

  const geometryStats = useMemo(() => {
    const validRows = data.filter((item) => !item.geometriaCompleta.na);
    const yesRows = validRows.filter((item) => item.geometriaCompleta.y).length;
    return {
      total: validRows.length,
      yes: yesRows,
      percentage: validRows.length ? Math.round((yesRows / validRows.length) * 100) : 0,
    };
  }, [data]);

  const lodStats = useMemo(() => {
    const validRows = data.filter((item) => !item.lodCompletion.na);
    const yesRows = validRows.filter((item) => item.lodCompletion.y).length;
    return {
      total: validRows.length,
      yes: yesRows,
      percentage: validRows.length ? Math.round((yesRows / validRows.length) * 100) : 0,
    };
  }, [data]);

  return (
    <div className="mx-auto w-full max-w-4xl bg-white p-2">
      <Card className="mb-2 bg-white">
        <CardContent className="px-2 py-1">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-black">{discipline.toUpperCase()} LOD CHECK</h2>
            <div className="flex items-center space-x-2 text-xs">
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                % COMPLETE
              </Badge>
              <span className="font-semibold">{complianceStats}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow">
        <CardContent className="p-0">
          <Table className="bg-white text-xs">
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-8 py-0.5 text-center">#</TableHead>
                <TableHead className="w-56 py-0.5">CONCEPT</TableHead>
                <TableHead className="w-32 py-0.5 text-center">REQ. LOD</TableHead>
                <TableHead className="w-24 py-0.5 text-center">GEOMETRY COMPLETE</TableHead>
                <TableHead className="w-24 py-0.5 text-center">LOD COMPLIANCE</TableHead>
                <TableHead className="w-80 py-0.5">COMMENTS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={`${item.row}-${item.concepto}`} className={index % 2 === 0 ? "" : "bg-gray-50"}>
                  <TableCell className="px-1 py-0.5 text-center">{item.row}</TableCell>

                  <TableCell className="px-1 py-0.5">
                    {editingConceptRow === item.row ? (
                      <div className="flex space-x-1">
                        <Input
                          value={tempConcept}
                          onChange={(event) => setTempConcept(event.target.value)}
                          onKeyDown={(event) => event.key === "Enter" && saveConcept(item.row)}
                          className="py-0 text-xs"
                          autoFocus
                        />
                        <Button size="sm" className="p-0.5" onClick={() => saveConcept(item.row)}>
                          <Check size={12} />
                        </Button>
                        <Button size="sm" className="p-0.5" variant="outline" onClick={() => setEditingConceptRow(null)}>
                          <X size={12} />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="flex cursor-pointer items-center justify-between"
                        onClick={() => {
                          setEditingConceptRow(item.row);
                          setTempConcept(item.concepto);
                        }}
                      >
                        <span>{item.concepto}</span>
                        <Edit3 size={12} />
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="px-1 py-0.5 text-center">
                    {editingLodRow === item.row ? (
                      <div className="flex justify-center space-x-1">
                        <Input
                          value={tempLod}
                          onChange={(event) => setTempLod(event.target.value)}
                          onKeyDown={(event) => event.key === "Enter" && saveLod(item.row)}
                          className="w-16 py-0 text-xs"
                          type="number"
                          autoFocus
                        />
                        <Button size="sm" className="p-0.5" onClick={() => saveLod(item.row)}>
                          <Check size={12} />
                        </Button>
                        <Button size="sm" className="p-0.5" variant="outline" onClick={() => setEditingLodRow(null)}>
                          <X size={12} />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer"
                        onClick={() => {
                          setEditingLodRow(item.row);
                          setTempLod(String(item.lodRequerido));
                        }}
                      >
                        <span className="font-semibold text-blue-600">{item.lodRequerido}</span>
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="space-x-1 px-1 py-0.5 text-center">
                    <StatusButton
                      isActive={item.geometriaCompleta.y}
                      onClick={() => toggleGeometry(item.row, "y")}
                      colorClass="bg-green-500 hover:bg-green-600"
                      label="Y"
                    />
                    <StatusButton
                      isActive={item.geometriaCompleta.n}
                      onClick={() => toggleGeometry(item.row, "n")}
                      colorClass="bg-red-500 hover:bg-red-600"
                      label="N"
                    />
                    <StatusButton
                      isActive={item.geometriaCompleta.na}
                      onClick={() => toggleGeometry(item.row, "na")}
                      colorClass="bg-yellow-400 hover:bg-yellow-500"
                      label="NA"
                    />
                  </TableCell>

                  <TableCell className="space-x-1 px-1 py-0.5 text-center">
                    <StatusButton
                      isActive={item.lodCompletion.y}
                      onClick={() => toggleLod(item.row, "y")}
                      colorClass="bg-green-500 hover:bg-green-600"
                      label="Y"
                    />
                    <StatusButton
                      isActive={item.lodCompletion.n}
                      onClick={() => toggleLod(item.row, "n")}
                      colorClass="bg-red-500 hover:bg-red-600"
                      label="N"
                    />
                    <StatusButton
                      isActive={item.lodCompletion.na}
                      onClick={() => toggleLod(item.row, "na")}
                      colorClass="bg-yellow-400 hover:bg-yellow-500"
                      label="NA"
                    />
                  </TableCell>

                  <TableCell className="px-1 py-0.5">
                    <textarea
                      value={item.comentarios}
                      onChange={(event) => updateComments(item.row, event.target.value)}
                      placeholder="Add comments..."
                      className="min-h-[60px] w-full rounded-md border border-input px-1 py-0.5 text-xs"
                    />
                  </TableCell>
                </TableRow>
              ))}

              <TableRow className="bg-gray-50 text-xs font-bold">
                <TableCell className="px-1 py-0.5">
                  <Button size="sm" className="p-0.5" onClick={addRow}>
                    <Plus size={12} />
                  </Button>
                </TableCell>
                <TableCell className="px-1 py-0.5">TOTAL</TableCell>
                <TableCell className="px-1 py-0.5" />
                <TableCell className="px-1 py-0.5">
                  {geometryStats.yes}/{geometryStats.total} ({geometryStats.percentage}%)
                </TableCell>
                <TableCell className="px-1 py-0.5">
                  {lodStats.yes}/{lodStats.total} ({lodStats.percentage}%)
                </TableCell>
                <TableCell className="px-1 py-0.5">
                  <Badge variant="secondary">Overall: {complianceStats}%</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
