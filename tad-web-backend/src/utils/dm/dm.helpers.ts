import { DataManagementLib } from '../../libs/dm/data.management';

// Interfaces para tipado
export interface FolderNode {
    id: string;
    name: string;
    type: 'folders';
    children: FolderNode[];
}

export interface FileItem {
    id: string;
    name: string;
    type: 'items';
    folderId: string;
    folderName: string;
    extension: string;
    urn: string;         
    versionNumber?: number; // Opcional, por si quieres la punta
}

/**
 * Helper recursivo para armar el árbol de carpetas (solo carpetas)
 */
export const buildFolderTreeRecursively = async (
    token: string, 
    projectId: string, 
    folderId: string, 
    folderName: string
): Promise<FolderNode> => {
    // 1. Obtener contenido
    const contents = await DataManagementLib.getFolderContents(token, projectId, folderId);
    
    // 2. Filtrar solo subcarpetas
    const subFolders = contents.data.filter((item: any) => item.type === 'folders');

    // 3. Recursividad
    const children = await Promise.all(
        subFolders.map(async (folder: any) => {
            return await buildFolderTreeRecursively(
                token, 
                projectId, 
                folder.id, 
                folder.attributes.name
            );
        })
    );

    return {
        id: folderId,
        name: folderName,
        type: 'folders',
        children: children
    };
};

/**
 * Helper recursivo para buscar archivos específicos (flattened list)
 */
export const searchFilesRecursively = async (
    token: string,
    projectId: string,
    folderId: string,
    folderName: string,
    allowedExtensions: string[]
): Promise<FileItem[]> => {
    let collectedFiles: FileItem[] = [];

    // 1. Obtener contenido
    const contents = await DataManagementLib.getFolderContents(token, projectId, folderId);

    // 2. Procesar Archivos (Items)
    const items = contents.data.filter((item: any) => item.type === 'items');
    
    items.forEach((item: any) => {
        const name = item.attributes.displayName;
        const extension = name.split('.').pop()?.toLowerCase();
        
        // Obtenemos el Version ID (URN) desde la relación 'tip' (La punta/última versión)
        // Esto corresponde a lo que viste en "included", pero accesible directamente desde el item.
        const versionId = item.relationships?.tip?.data?.id;

        if (extension && allowedExtensions.includes(extension)) {
            collectedFiles.push({
                id: item.id,                  // Item ID (Lineage)
                name: name,
                type: 'items',
                folderId: folderId,
                folderName: folderName,
                extension: extension,
                urn: versionId,               // <--- ESTO ES LO QUE VA AL VIEWER
                // Info extra por si la quieres mostrar
                versionNumber: item.attributes.versionNumber 
            });
        }
    });

    // 3. Procesar Subcarpetas (Recursividad)
    const subFolders = contents.data.filter((item: any) => item.type === 'folders');

    const subFolderResults = await Promise.all(
        subFolders.map(async (subFolder: any) => {
            return await searchFilesRecursively(
                token, 
                projectId, 
                subFolder.id, 
                subFolder.attributes.name, 
                allowedExtensions
            );
        })
    );

    // 4. Aplanar resultados
    subFolderResults.forEach(files => {
        collectedFiles = [...collectedFiles, ...files];
    });

    return collectedFiles;
};