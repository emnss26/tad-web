import { AccAdminLib } from '../../libs/acc/acc.admin';

// --- 1. LÓGICA DE MAPEO DE USUARIOS ---

/**
 * Recorre una lista de items (Issues), extrae los IDs de usuarios únicos
 * y busca sus nombres en la API de Autodesk.
 */
export const mapUserIdsToNames = async (token: string, projectId: string, items: any[]): Promise<Record<string, string>> => {
  const userFields = ["createdBy", "assignedTo", "closedBy", "openedBy", "updatedBy", "ownerId"];
  const userIds = new Set<string>();

  // 1. Recolectar IDs únicos
  items.forEach(item => {
    userFields.forEach(field => {
      if (item[field]) userIds.add(item[field]);
    });
  });

  const uniqueUserIds = Array.from(userIds);
  const userMap: Record<string, string> = {};

  // 2. Buscar nombres en paralelo (Con manejo de errores individual)
  await Promise.all(uniqueUserIds.map(async (userId) => {
    try {
      const user = await AccAdminLib.getProjectUserDetail(token, projectId, userId);
      const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
      userMap[userId] = name || 'Unknown User';
    } catch (error) {
      // Si el usuario ya no existe o falla la API, ponemos default
      userMap[userId] = 'Unknown User';
    }
  }));

  return userMap;
};

// --- 2. LÓGICA DE ATRIBUTOS PERSONALIZADOS ---

/**
 * Crea un mapa de { DefinitionID -> { OptionID -> HumanReadableValue } }
 */
export const buildCustomAttributeValueMap = (attributeDefinitions: any[]) => {
  const valueMap: Record<string, any> = {};

  attributeDefinitions.forEach((def) => {
    if (def.metadata?.list?.options && Array.isArray(def.metadata.list.options)) {
      const optionsMap: Record<string, any> = {};
      def.metadata.list.options.forEach((option: any) => {
        optionsMap[option.id] = option.value;
      });
      valueMap[def.id] = optionsMap;
    }
  });

  return valueMap;
};

/**
 * Reemplaza los IDs de los atributos personalizados por sus valores legibles
 */
export const enrichCustomAttributes = (issues: any[], attributeValueMap: any) => {
  return issues.map((issue) => {
    if (!Array.isArray(issue.customAttributes)) return issue;

    const enrichedAttributes = issue.customAttributes.map((attr: any) => {
      const readableValue = attributeValueMap?.[attr.attributeDefinitionId]?.[attr.value];
      return {
        ...attr,
        readableValue: readableValue || attr.value, // Si no hay mapa, devuelve el valor original
      };
    });

    return {
      ...issue,
      customAttributes: enrichedAttributes,
    };
  });
};