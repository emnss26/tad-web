export interface PlanRow {
  id: string;
  SheetName: string;
  SheetNumber: string;
  Discipline: string;
  Revision: string;
  lastModifiedTime: string;
  exists: boolean;
  revisionProcess: string;
  revisionStatus: string;
  isPlaceholder?: boolean;
}

export interface PlanCount {
  id: string;
  value: number;
}

