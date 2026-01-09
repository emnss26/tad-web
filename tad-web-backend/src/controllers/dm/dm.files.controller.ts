import { Request, Response } from 'express';
import { DataManagementLib } from '../../libs/dm/data.management';
import { searchFilesRecursively } from '../../utils/dm/dm.helpers';
import { getToken } from '../../utils/auth/auth.utils';

export const GetProjectModelFiles = async (req: Request, res: Response) => {
    try {
        const token = getToken(req);

        if (!token) {
            return res.status(401).json({
                data: null,
                error: "Unauthorized",
                message: "Authorization token is required."
            });
        }

        const { projectId } = req.params;
        const { hubId } = req.query;

        if (!hubId) {
            return res.status(400).json({ 
                data: null, 
                error: "Bad Request", 
                message: "Missing hubId query parameter" 
            });
        }

        // --- CORRECCIÓN CLAVE ---
        // La API de Data Management requiere que el Project ID inicie con "b."
        const formattedProjectId = projectId.startsWith('b.') ? projectId : `b.${projectId}`;
        // ------------------------

        const TARGET_EXTENSIONS = ['rvt', 'dwg', 'nwd'];

        console.log(`[DM] Fetching models for Project: ${formattedProjectId}, Hub: ${hubId}`);

        // 1. Obtener Top Folders usando el ID formateado
        const topFoldersData = await DataManagementLib.getTopFolders(token, hubId as string, formattedProjectId);

        // 2. Buscar recursivamente (Pasamos el ID formateado también aquí)
        const allFilesNested = await Promise.all(
            topFoldersData.data.map(async (topFolder: any) => {
                return await searchFilesRecursively(
                    token, 
                    formattedProjectId, // <--- Usar ID con 'b.'
                    topFolder.id, 
                    topFolder.attributes.name,
                    TARGET_EXTENSIONS
                );
            })
        );

        const flatFilesList = allFilesNested.flat();

        return res.status(200).json({
            data: flatFilesList,
            count: flatFilesList.length,
            message: "Model files retrieved successfully"
        });

    } catch (error: any) {
        // Mejoramos el log de error para ver detalles de Axios
        const errorDetail = error.response?.data || error.message;
        console.error("Error fetching model files:", errorDetail);
        
        return res.status(500).json({ 
            data: null,
            error: errorDetail,
            message: "Failed to retrieve model files"
        });
    }
};