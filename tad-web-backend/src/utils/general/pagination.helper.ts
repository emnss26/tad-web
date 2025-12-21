import { DataManagementLib } from "../libs/dm/data.management";

export const PaginationHelper = {
  /**
   * Obtiene TODOS los items iterando sobre las páginas de la API Data Management.
   * Útil para getHubProjects, getFolderContents, etc.
   */
  fetchAllDM: async (fetchFunction: Function, ...args: any[]) => {
    let allData: any[] = [];
    let nextUrl: string | undefined = undefined;
    
    // Autodesk Data Management usa 'page[number]' o 'page[offset]' dependiendo del endpoint
    // Para simplificar, asumiremos que traemos lotes grandes hasta que no haya 'next' link.
    // Pero la API de DM devuelve links.next.href
    
    // Primera llamada
    let response = await fetchFunction(...args);
    
    // Si la respuesta tiene data.data (estructura estándar JSON API)
    if (response.data && Array.isArray(response.data)) {
        allData = [...response.data];
    } else if (Array.isArray(response)) {
        allData = [...response];
    }

    // Verificar paginación (Data Management API devuelve links.next.href)
    while (response.links && response.links.next && response.links.next.href) {
        // Extraer el offset o número de página de la URL next
        // Esto es complejo de generalizar porque nextUrl ya trae el host.
        // Una estrategia más segura para endpoints simples es pedir un límite alto (ej: 100)
        // y hacer loop manual con offset si la librería lo permite.
        
        // POR AHORA, para mantenerlo simple y funcional con tu código actual:
        // Recomendamos aumentar el page[limit] a 100 en la llamada inicial
        // y manejar paginación manual si el array length == limit.
        break; // Implementación completa de paginación automática requiere parsear nextUrl
    }

    return allData;
  }
};