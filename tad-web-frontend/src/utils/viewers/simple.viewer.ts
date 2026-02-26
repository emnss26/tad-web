// Declaración global para evitar errores de TS si no usas @types/forge-viewer
declare const Autodesk: any;

const backendUrl = import.meta.env.VITE_API_BACKEND_BASE_URL || "http://localhost:8080";

/**
 * Inicializa el Autodesk Viewer en el contenedor 'TADSimpleViwer'.
 * @param urn - La URN cruda (sin base64) que viene de tu backend (ej: urn:adsk.wipprod:fs.file:vf...)
 */
export const simpleViewer = async (urn: string): Promise<void> => {
  try {
    // 1. Obtener Token del Backend
    const response = await fetch(`${backendUrl}/api/auth/two-legged`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token: ${response.statusText}`);
    }

    const json = await response.json();
    // Asumimos que tu endpoint devuelve { data: { access_token: "..." } }
    const token = json.data?.access_token || json.access_token;

    if (!token) {
      console.error("Viewer Error: No access token provided by backend.");
      return;
    }

    // 2. Configuración del Viewer
    const options = {
      env: "AutodeskProduction",
      api: "modelDerivativeV2", // Importante para nuevos formatos SVF2
      accessToken: token,
    };

    const container = document.getElementById("TADSimpleViwer");
    if (!container) {
      console.error("Viewer Error: Container 'TADSimpleViwer' not found in DOM!");
      return;
    }

    // 3. Inicializar Autodesk Global
    Autodesk.Viewing.Initializer(options, () => {
      // Crear instancia del GUI Viewer (con barras de herramientas)
      const viewer = new Autodesk.Viewing.GuiViewer3D(container);

      const errorCode = viewer.start();
      if (errorCode !== 0) {
        console.error("Viewer Error: Failed to start viewer, error code:", errorCode);
        return;
      }

      // 4. Cargar el Modelo
      // IMPORTANTE: El viewer necesita la URN en Base64.
      // Tu backend devuelve la URN plana, así que aquí la codificamos.
      const documentId = `urn:${btoa(urn)}`;

      Autodesk.Viewing.Document.load(
        documentId,
        (doc: any) => {
          // Éxito: Cargar la geometría por defecto (Vista 3D principal)
          const defaultModel = doc.getRoot().getDefaultGeometry();
          viewer.loadDocumentNode(doc, defaultModel);
        },
        (errorCode: number, errorMsg: string) => {
          // Error
          console.error("Viewer Error: Could not load document.", errorCode, errorMsg);
        }
      );
    });

  } catch (error) {
    console.error("Viewer Critical Error:", error);
  }
};
