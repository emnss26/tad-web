// --- GENERALES ---
export interface IProjectProduct {
  key: string;
  status: string;
  icon: string;
  name: string;
  language: string;
}

// --- PROYECTOS (Admin API) ---
export interface IACCProjectAdminDetails {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  status?: string;
  jobId?: string; // A veces viene como jobNumber
  addressLine1?: string;
  city?: string;
  stateOrProvince?: string;
  postalCode?: string;
  country?: string;
  timezone?: string;
  projectValue?: {
    value: number;
    currency: string;
  };
  accountId: string;
  platform: string;
  products: IProjectProduct[];
  // Agrega más campos según descubras en la API
}

// --- ISSUES (Futuro) ---
export interface IACCIssue {
  id: string;
  title: string;
  status: string;
  // ... lo llenaremos cuando migremos el controlador de Issues
}

// --- RFIs (Futuro) ---
export interface IACCRfi {
  id: string;
  title: string;
  // ...
}