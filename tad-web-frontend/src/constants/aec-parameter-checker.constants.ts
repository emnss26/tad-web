export interface AecDisciplineCategory {
  id: string;
  name: string;
  query: string;
}

export interface AecDisciplineConfig {
  id: string;
  name: string;
  categories: AecDisciplineCategory[];
}

export const AEC_DISCIPLINES: AecDisciplineConfig[] = [
  {
    id: "ARC",
    name: "Architecture",
    categories: [
      { id: "arc_walls", name: "Walls", query: "Walls" },
      { id: "arc_floors", name: "Floors", query: "Floors" },
      { id: "arc_roofs", name: "Roofs", query: "Roofs" },
      { id: "arc_doors", name: "Doors", query: "Doors" },
      { id: "arc_windows", name: "Windows", query: "Windows" },
      { id: "arc_rooms", name: "Rooms", query: "Rooms" },
      { id: "arc_railings", name: "Railings", query: "Railings" },
      { id: "arc_stairs", name: "Stairs", query: "Stairs" },
      
    ],
  },
  {
    id: "STR",
    name: "Structural",
    categories: [
      { id: "str_foundations", name: "Structural Foundations", query: "Structural Foundations" },
      { id: "str_columns", name: "Structural Columns", query: "Structural Columns" },
      { id: "str_framing", name: "Structural Framing", query: "Structural Framing" },
      { id: "str_walls", name: "Structural Walls", query: "Walls" },
      { id: "str_floors", name: "Floors", query: "Floors" },
      { id: "str_rebar", name: "Structural Rebar", query: "Structural Rebars" },
    ],
  },
  {
    id: "MEC",
    name: "Mechanical",
    categories: [
      { id: "mec_ducts", name: "Ducts", query: "Ducts" },
      { id: "mec_duct_fittings", name: "Duct Fittings", query: "Duct Fittings" },
      { id: "mec_duct_accessories", name: "Duct Accessories", query: "Duct Accessories" },
      { id: "mec_air_terminals", name: "Air Terminals", query: "Air Terminals" },
      { id: "mec_equipment", name: "Mechanical Equipment", query: "Mechanical Equipment" },
    ],
  },
  {
    id: "ELE",
    name: "Electrical",
    categories: [
      { id: "ele_equipment", name: "Electrical Equipment", query: "Electrical Equipment" },
      { id: "ele_fixtures", name: "Electrical Fixtures", query: "Electrical Fixtures" },
      { id: "ele_lighting_fixtures", name: "Lighting Fixtures", query: "Lighting Fixtures" },
      { id: "ele_lighting_devices", name: "Lighting Devices", query: "Lighting Devices" },
      { id: "ele_conduits", name: "Conduits", query: "Conduits" },
      { id: "ele_cable_trays", name: "Cable Trays", query: "Cable Trays" },
    ],
  },
  {
    id: "PLU",
    name: "Plumbing",
    categories: [
      { id: "plu_pipes", name: "Pipes", query: "Pipes" },
      { id: "plu_fittings", name: "Pipe Fittings", query: "Pipe Fittings" },
      { id: "plu_accessories", name: "Pipe Accessories", query: "Pipe Accessories" },
      { id: "plu_fixtures", name: "Plumbing Fixtures", query: "Plumbing Fixtures" },
      { id: "plu_mech_equipment", name: "Mechanical Equipment", query: "Mechanical Equipment" },
    ],
  },
  {
    id: "SPS",
    name: "Special Systems",
    categories: [
      { id: "sps_data", name: "Data Devices", query: "Data Devices" },
      { id: "sps_comm", name: "Communication Devices", query: "Communication Devices" },
      { id: "sps_security", name: "Security Devices", query: "Security Devices" },
      { id: "sps_fire", name: "Fire Alarm Devices", query: "Fire Alarm Devices" },
    ],
  },
];

export const getDisciplineById = (disciplineId: string) =>
  AEC_DISCIPLINES.find((discipline) => discipline.id === disciplineId) || AEC_DISCIPLINES[0];

