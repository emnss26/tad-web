export interface IDefaultRow4D {
    rowNumber: number;
    dbId: string;
    Discipline: string;
    ElementType: string;
    TypeName: string;
    Description: string;
    Length: string;
    Width: string;
    Height: string;
    Perimeter: string;
    Area: string;
    Thickness: string;
    Volume: string;
    Level: string;
    Material: string;
    PlanedConstructionStartDate: string;
    PlanedConstructionEndDate: string;
    RealConstructionStartDate: string;
    RealConstructionEndDate: string;
    [key: string]: any; // Index signature para acceso dinámico
  }
  
  export interface IDefaultRow5D {
    rowNumber: number;
    dbId: string;
    Code: string;
    Discipline: string;
    ElementType: string;
    TypeName: string;
    Description: string;
    Length: string;
    Width: string;
    Height: string;
    Perimeter: string;
    Area: string;
    Thickness: string;
    Volume: string;
    Level: string;
    Material: string;
    Unit: string;
    Quantity: string;
    UnitPrice: string;
    TotalCost: string;
    [key: string]: any;
  }
  
  export interface IDefaultRow6D {
    rowNumber: number;
    dbId: string;
    Discipline: string;
    ElementType: string;
    TypeName: string;
    Description: string;
    Length: string;
    Width: string;
    Height: string;
    Perimeter: string;
    Area: string;
    Thickness: string;
    Volume: string;
    Level: string;
    Material: string;
    EnergyConsumption: string;
    CarbonFootprint: string;
    WaterConsumption: string;
    LifeCycleStage: string;
    LEEDCategory: string;
    LEEDCredit: string;
    [key: string]: any;
  }
  
  // --- Default Objects ---
  
  export const defaultRow4D: IDefaultRow4D = {
    rowNumber: 0,
    dbId: "",
    Discipline: "",
    ElementType: "",
    TypeName: "",
    Description: "",
    Length: "",
    Width: "",
    Height: "",
    Perimeter: "",
    Area: "",
    Thickness: "",
    Volume: "",
    Level: "",
    Material: "",
    PlanedConstructionStartDate: "",
    PlanedConstructionEndDate: "",
    RealConstructionStartDate: "",
    RealConstructionEndDate: "",
  };
  
  export const defaultRow5D: IDefaultRow5D = {
    rowNumber: 0,
    dbId: "",
    Code: "",
    Discipline: "",
    ElementType: "",
    TypeName: "",
    Description: "",
    Length: "",
    Width: "",
    Height: "",
    Perimeter: "",
    Area: "",
    Thickness: "",
    Volume: "",
    Level: "",
    Material: "",
    Unit: "",
    Quantity: "",
    UnitPrice: "",
    TotalCost: "",
  };
  
  export const defaultRow6D: IDefaultRow6D = {
    rowNumber: 0,
    dbId: "",
    Discipline: "",
    ElementType: "",
    TypeName: "",
    Description: "",
    Length: "",
    Width: "",
    Height: "",
    Perimeter: "",
    Area: "",
    Thickness: "",
    Volume: "",
    Level: "",
    Material: "",
    EnergyConsumption: "",
    CarbonFootprint: "",
    WaterConsumption: "",
    LifeCycleStage: "",
    LEEDCategory: "",
    LEEDCredit: "",
  };