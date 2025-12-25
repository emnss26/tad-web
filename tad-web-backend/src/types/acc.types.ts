// --- GENERALES ---
export interface IProjectProduct {
  key: string;
  status: string;
  icon: string;
  name: string;
  language: string;
}

// --- PROYECTOS ---
export interface IACCProjectAdminDetails {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  status?: string;
  jobId?: string;
  addressLine1?: string;
  city?: string;
  stateOrProvince?: string;
  postalCode?: string;
  country?: string;
  timezone?: string;
  projectValue?: { value: number; currency: string; };
  accountId: string;
  platform: string;
  products: IProjectProduct[];
}

// --- USUARIOS ---
export interface IACCUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  status: string;
  companyName?: string;
  roles?: Array<{ id: string; name: string }>;
  // Campos DB
  projectId?: string;
  accountId?: string;
}

// --- ISSUES ---
export interface IACCIssue {
  id: string;
  displayId: number | string;
  title: string;
  description: string;
  status: string;
  issueTypeId: string;
  issueTypeName: string; // Enriquecido
  // Fechas
  dueDate?: string;
  startDate?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  openedAt?: string;
  // Usuarios (Nombres)
  assignedTo: string;
  createdBy: string;
  openedBy: string;
  closedBy: string;
  updatedBy: string;
  // Extras
  customAttributes?: any[];
}

// --- RFIS ---
export interface IACCRfi {
  id: string;
  customIdentifier: string;
  title: string;
  question: string;
  status: string;
  priority: string;
  discipline: string;
  category: string;
  officialResponse?: string;
  // Usuarios (Nombres)
  managerId: string; // Manager Name
  assignedTo: string;
  reviewerId: string; // Reviewer Name
  createdBy: string;
  respondedBy: string;
  updatedBy: string;
  closedBy: string;
  // Fechas
  dueDate?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

// --- SUBMITTALS ---
export interface IACCSubmittal {
  id: string;
  identifier: string | number; // El ID numérico interno
  customIdentifier?: string; // El ID Humano (001-A)
  specId?: string;
  specIdentifier?: string; // Enriquecido
  specTitle?: string;      // Enriquecido
  subsection?: string;
  title: string;
  description?: string;
  priority: string;
  revision: number;
  stateId: string;
  status: string; // Estado legible (Mapping)
  // Fechas
  dueDate?: string;
  submitterDueDate?: string;
  publishedDate?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Usuarios (Nombres)
  submittedBy: string;
  sentToReviewBy: string;
  publishedBy: string;
  respondedBy: string;
  createdBy: string;
  updatedBy: string;
  manager: string; // Manager Name
}