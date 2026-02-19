export type GeometryStatus = {
  y: boolean;
  n: boolean;
  na: boolean;
};

export interface LodCheckerRow {
  row: number;
  concepto: string;
  lodRequerido: number;
  geometriaCompleta: GeometryStatus;
  lodCompletion: GeometryStatus;
  comentarios: string;
}

export const DISCIPLINES = [
  "Architecture",
  "Exteriors",
  "Concrete Structure",
  "Steel Structure",
  "Plumbing Installation",
  "Electrical Installation",
  "Special Systems",
  "Mechanical - HVAC",
] as const;

export const DEFAULT_CONCEPTS_BY_DISCIPLINE: Record<string, Array<{ concept: string; lod: number }>> = {
  "Architecture": [
    { concept: "Walls", lod: 350 },
    { concept: "Floors", lod: 350 },
    { concept: "Roofs and Canopies", lod: 350 },
    { concept: "Stairs and Ramps", lod: 350 },
    { concept: "Doors", lod: 350 },
    { concept: "Windows", lod: 300 },
    { concept: "Panels and Facades", lod: 350 },
    { concept: "Curtain Walls", lod: 350 },
    { concept: "Railings", lod: 350 },
    { concept: "Ceilings", lod: 300 },
    { concept: "Ceiling Support (if applicable)", lod: 300 },
  ],
  "Exteriors": [
    { concept: "Walls", lod: 350 },
    { concept: "Floors", lod: 350 },
    { concept: "Roofs and Canopies", lod: 350 },
    { concept: "Stairs and Ramps", lod: 350 },
    { concept: "Doors", lod: 350 },
    { concept: "Windows", lod: 300 },
    { concept: "Panels and Facades", lod: 350 },
    { concept: "Curtain Walls", lod: 350 },
    { concept: "Railings", lod: 350 },
    { concept: "Ceilings", lod: 300 },
    { concept: "Ceiling Support (if applicable)", lod: 300 },
  ],
  "Concrete Structure": [
    { concept: "Walls", lod: 350 },
    { concept: "Floors", lod: 350 },
    { concept: "Structural Columns", lod: 350 },
    { concept: "Strucutral Framings", lod: 350 },
    { concept: "Roofs", lod: 350 },
    { concept: "Stairs", lod: 300 },
    { concept: "Railings", lod: 350 },
    { concept: "Strucutral Stiffener & Connections", lod: 350 },
  ],
  "Steel Structure": [
    { concept: "Strcutrual Steel Columns", lod: 350 },
    { concept: "Structural Steel Framings", lod: 350 },
    { concept: "Truss", lod: 350 },
    { concept: "Joist", lod: 350 },
    { concept: "Connections", lod: 350 },
    { concept: "Floors & Metal Deck", lod: 300 },
    { concept: "Stairs", lod: 350 },
    { concept: "Brace", lod: 350 },
  ],
  "Plumbing Installation": [
    { concept: "Pipes", lod: 350 },
    { concept: "Pipe Accesory", lod: 350 },
    { concept: "Pipe Fittings", lod: 350 },
    { concept: "Flex Pipes", lod: 350 },
    { concept: "Plumbing Equipment", lod: 350 },
    { concept: "Plumbing Fixture", lod: 300 },
  ],
  "Electrical Installation": [
    { concept: "Cable Tray", lod: 350 },
    { concept: "Conduit", lod: 350 },
    { concept: "Conduit Fittings", lod: 350 },
    { concept: "Cable Tray Fittings", lod: 350 },
    { concept: "Electrical Equipment", lod: 350 },
    { concept: "Ligthing Fixtures", lod: 300 },
    { concept: "Electrical Fixtrue", lod: 350 },
  ],
  "Special Systems": [
    { concept: "Cable Tray", lod: 350 },
    { concept: "Conduit", lod: 350 },
    { concept: "Conduit Fittings", lod: 350 },
    { concept: "Cable Tray Fittings", lod: 350 },
    { concept: "Electrical Equipment", lod: 350 },
    { concept: "Ligthing Fixtures", lod: 300 },
    { concept: "Communication Devices", lod: 350 },
    { concept: "Data devices", lod: 350 },
    { concept: "Fire Alarm", lod: 350 },
    { concept: "Security Devices", lod: 350 },
  ],
  "Mechanical - HVAC": [
    { concept: "Pipes", lod: 350 },
    { concept: "Pipe Accesory", lod: 350 },
    { concept: "Pipe Fittings", lod: 350 },
    { concept: "Flex Pipes", lod: 350 },
    { concept: "Plumbing Equipment", lod: 350 },
    { concept: "Plumbing Fixture", lod: 300 },
    { concept: "Plumbing Accessory", lod: 300 },
    { concept: "Plumbing Fittings", lod: 300 },
    { concept: "HVAC Ducts", lod: 350 },
    { concept: "HVAC Duct Fittings", lod: 350 },
    { concept: "HVAC Duct Accessory", lod: 350 },
    { concept: "HVAC Equipment", lod: 350 },
    { concept: "HVAC Terminal Units", lod: 350 },
  ],
};
