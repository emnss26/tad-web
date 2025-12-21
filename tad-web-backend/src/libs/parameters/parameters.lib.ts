import axios from 'axios';

const PARAMETERS_API_URL = 'https://developer.api.autodesk.com/parameters/v1';

export const ParametersLib = {
  
  // ==========================================
  // GROUPS (Grupos)
  // ==========================================

  /**
   * Lista todos los grupos en la cuenta especificada.
   * Nota: Actualmente solo se soporta un grupo por cuenta (ID coincide con Account ID).
   * Endpoint: GET /accounts/{accountId}/groups
   */
  getGroups: async (token: string, accountId: string) => {
    try {
      const response = await axios.get(`${PARAMETERS_API_URL}/accounts/${accountId}/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Parameter Groups:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene detalles de un grupo específico.
   * Endpoint: GET /accounts/{accountId}/groups/{groupId}
   */
  getGroupDetail: async (token: string, accountId: string, groupId: string) => {
    try {
      const response = await axios.get(`${PARAMETERS_API_URL}/accounts/${accountId}/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Group Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // COLLECTIONS (Colecciones)
  // ==========================================

  /**
   * Lista todas las colecciones de parámetros en un grupo.
   * Endpoint: GET /accounts/{accountId}/groups/{groupId}/collections
   */
  getCollections: async (token: string, accountId: string, groupId: string, filters?: any) => {
    try {
      const response = await axios.get(`${PARAMETERS_API_URL}/accounts/${accountId}/groups/${groupId}/collections`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters // Soporta limit, offset, etc.
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Parameter Collections:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene detalles de una colección de parámetros.
   * Endpoint: GET /accounts/{accountId}/groups/{groupId}/collections/{collectionId}
   */
  getCollectionDetail: async (token: string, accountId: string, groupId: string, collectionId: string) => {
    try {
      const response = await axios.get(`${PARAMETERS_API_URL}/accounts/${accountId}/groups/${groupId}/collections/${collectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Collection Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // PARAMETERS (Parámetros)
  // ==========================================

  /**
   * Lista parámetros dentro de una colección.
   * Endpoint: GET /accounts/{accountId}/groups/{groupId}/collections/{collectionId}/parameters
   */
  getCollectionParameters: async (token: string, accountId: string, groupId: string, collectionId: string, filters?: any) => {
    try {
      const response = await axios.get(`${PARAMETERS_API_URL}/accounts/${accountId}/groups/${groupId}/collections/${collectionId}/parameters`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Collection Parameters:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene la definición de un parámetro específico.
   * Endpoint: GET /parameters/{parameterId}
   */
  getParameterDetail: async (token: string, parameterId: string) => {
    try {
      const response = await axios.get(`${PARAMETERS_API_URL}/parameters/${parameterId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Parameter Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Crea nuevas definiciones de parámetros.
   * Max 50 por request. Datos inmutables: id, name, dataTypeId, readOnly.
   * Endpoint: POST /accounts/{accountId}/groups/{groupId}/collections/{collectionId}/parameters
   */
  createParameters: async (token: string, accountId: string, groupId: string, collectionId: string, payload: any) => {
    try {
      const response = await axios.post(
        `${PARAMETERS_API_URL}/accounts/${accountId}/groups/${groupId}/collections/${collectionId}/parameters`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error creating Parameters:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Actualiza una lista de parámetros (descripción, metadatos, etiquetas, categorías Revit).
   * Max 10 por request.
   * Endpoint: PATCH /accounts/{accountId}/groups/{groupId}/collections/{collectionId}/parameters
   */
  updateParameters: async (token: string, accountId: string, groupId: string, collectionId: string, payload: any) => {
    try {
      const response = await axios.patch(
        `${PARAMETERS_API_URL}/accounts/${accountId}/groups/${groupId}/collections/${collectionId}/parameters`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error updating Parameters:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // SPECS (Especificaciones / Tipos de Datos)
  // ==========================================

  /**
   * Lista las especificaciones (tipos de datos) del sistema o definidas por el usuario.
   * Endpoint: GET /specs
   * @param filters Puede incluir 'accountId' para ver specs de usuario (enumeraciones) o 'id' para buscar específicas.
   */
  getSpecs: async (token: string, filters?: any) => {
    try {
      const response = await axios.get(`${PARAMETERS_API_URL}/specs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Specs:', error.response?.data || error.message);
      throw error;
    }
  }
};