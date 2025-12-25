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

export interface IACCUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  status: string; // active, invited, etc.
  companyName?: string;
  companyId?: string;
  roles?: Array<{ id: string; name: string }>;
  accessLevels?: {
    accountAdmin: boolean;
    projectAdmin: boolean;
    executive: boolean;
  };
  // Campos auxiliares para tu app
  projectId?: string;
  accountId?: string;
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