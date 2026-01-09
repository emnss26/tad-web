import axios from 'axios';

const PROJECT_API_URL = 'https://developer.api.autodesk.com/project/v1';
const DATA_API_URL = 'https://developer.api.autodesk.com/data/v1';

export const DataManagementLib = {

  // ==========================================
  // HUBS (Cuentas/Hubs)
  // ==========================================

  /**
   * Obtiene la colección de Hubs accesibles para el usuario.
   * Endpoint: GET /project/v1/hubs
   */
  getHubs: async (token: string) => {
    try {
      const response = await axios.get(`${PROJECT_API_URL}/hubs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Hubs:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene datos de un Hub específico.
   * Endpoint: GET /project/v1/hubs/:hub_id
   */
  getHubDetail: async (token: string, hubId: string) => {
    try {
      const response = await axios.get(`${PROJECT_API_URL}/hubs/${hubId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Hub Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // PROJECTS (Proyectos - Data Management)
  // ==========================================

  /**
   * Obtiene la colección de proyectos dentro de un Hub.
   * Endpoint: GET /project/v1/hubs/:hub_id/projects
   */
  getHubProjects: async (token: string, hubId: string, filters?: any) => {
    try {
      const response = await axios.get(`${PROJECT_API_URL}/hubs/${hubId}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Hub Projects:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene un proyecto específico.
   * Endpoint: GET /project/v1/hubs/:hub_id/projects/:project_id
   */
  getProjectDetail: async (token: string, hubId: string, projectId: string) => {
    try {
      const response = await axios.get(`${PROJECT_API_URL}/hubs/${hubId}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching DM Project Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene las carpetas de nivel superior (Top Folders) de un proyecto.
   * Endpoint: GET /project/v1/hubs/:hub_id/projects/:project_id/topFolders
   */
  getTopFolders: async (token: string, hubId: string, projectId: string) => {
    try {

      console.log ("Project Id:", projectId);
      const response = await axios.get(`${PROJECT_API_URL}/hubs/${hubId}/projects/${projectId}/topFolders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Top Folders:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // FOLDERS (Carpetas)
  // ==========================================

  /**
   * Obtiene detalles de una carpeta por su ID.
   * Endpoint: GET /data/v1/projects/:project_id/folders/:folder_id
   */
  getFolderDetail: async (token: string, projectId: string, folderId: string) => {
    try {
      const response = await axios.get(`${DATA_API_URL}/projects/${projectId}/folders/${folderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Folder Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene el contenido (items y subcarpetas) de una carpeta.
   * Endpoint: GET /data/v1/projects/:project_id/folders/:folder_id/contents
   */
  getFolderContents: async (token: string, projectId: string, folderId: string, filters?: any) => {
    try {
      const response = await axios.get(`${DATA_API_URL}/projects/${projectId}/folders/${folderId}/contents`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters // filters puede incluir page[number], page[limit], filter[type], etc.
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Folder Contents:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // ITEMS (Archivos/Documentos)
  // ==========================================

  /**
   * Obtiene metadatos de un Item específico.
   * Endpoint: GET /data/v1/projects/:project_id/items/:item_id
   */
  getItemDetail: async (token: string, projectId: string, itemId: string) => {
    try {
      const response = await axios.get(`${DATA_API_URL}/projects/${projectId}/items/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Item Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // VERSIONS (Versiones de Archivos)
  // ==========================================

  /**
   * Obtiene una versión específica de un archivo.
   * Endpoint: GET /data/v1/projects/:project_id/versions/:version_id
   */
  getVersionDetail: async (token: string, projectId: string, versionId: string) => {
    try {
      const response = await axios.get(`${DATA_API_URL}/projects/${projectId}/versions/${versionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Version Detail:', error.response?.data || error.message);
      throw error;
    }
  }
};