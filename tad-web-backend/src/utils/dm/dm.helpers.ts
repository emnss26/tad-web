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

export interface FolderContentNode {
    id: string;
    name: string;
    type: 'folder' | 'file';
    children?: FolderContentNode[];
    versiontype?: string | null;
    version?: number | null;
    version_urn?: string | null;
    versionschema?: string | null;
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

/**
 * Helper recursivo para armar un Ã¡rbol de carpetas + archivos.
 * Se usa en el flujo de project plans para mapping de archivos por carpeta.
 */
export const buildFolderContentTreeRecursively = async (
    token: string,
    projectId: string,
    folderId: string,
    folderName: string
): Promise<FolderContentNode> => {
    const contents = await DataManagementLib.getFolderContents(token, projectId, folderId);
    const entries = contents?.data || [];

    const folders = entries.filter((item: any) => item.type === 'folders');
    const files = entries.filter((item: any) => item.type === 'items');

    const folderChildren = await Promise.all(
        folders.map(async (folder: any) => {
            return await buildFolderContentTreeRecursively(
                token,
                projectId,
                folder.id,
                folder.attributes?.name || folder.attributes?.displayName || 'Folder'
            );
        })
    );

    const fileChildren: FolderContentNode[] = files.map((file: any) => ({
        id: file.id,
        name: file.attributes?.displayName || file.attributes?.name || 'Unnamed file',
        type: 'file',
        versiontype: file.attributes?.extension?.type === 'versions:autodesk.bim360:File'
            ? file.attributes?.extension?.data?.id || null
            : null,
        version: typeof file.attributes?.extension?.version === 'number'
            ? file.attributes.extension.version
            : null,
        version_urn: file.relationships?.tip?.data?.id || null,
        versionschema: file.attributes?.extension?.schema || null,
    }));

    return {
        id: folderId,
        name: folderName,
        type: 'folder',
        children: [...folderChildren, ...fileChildren],
    };
};
