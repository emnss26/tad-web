export const isolateObjectsInViewer = (
    viewer: Autodesk.Viewing.GuiViewer3D | null,
    dbIds: (number | string)[]
  ): void => {
    const ids = dbIds.map((id) => Number(id));
    console.debug("viewer isolate:", viewer);
    console.debug("dbIds isolate :", ids);
    
    if (viewer && ids.length > 0) {
      viewer.isolate(ids);
      viewer.fitToView(ids);
    } else {
      console.error("Viewer no inicializado o no se encontraron elementos a aislar.");
    }
  };
  
  export const showAllObjects = (viewer: Autodesk.Viewing.GuiViewer3D | null): void => {
    console.debug("viewer:", viewer);
    if (viewer) {
      // isolate() sin argumentos muestra todo, pero showAll() es más explícito
      viewer.isolate([]); 
      viewer.showAll();
    } else {
      console.error("Viewer no inicializado.");
    }
  };
  
  export const hideObjectsInViewer = (
    viewer: Autodesk.Viewing.GuiViewer3D | null,
    dbIds: (number | string)[]
  ): void => {
    const ids = dbIds.map((id) => Number(id));
    console.debug("viewer:", viewer);
    console.debug("dbIds:", ids);
    
    if (viewer && ids.length > 0) {
      viewer.hide(ids);
    } else {
      console.error("Viewer no inicializado o no hay elementos para ocultar.");
    }
  };
  
  export const highlightObjectsInViewer = (
    viewer: Autodesk.Viewing.GuiViewer3D | null,
    dbIds: (number | string)[]
  ): void => {
    const ids = dbIds.map((id) => Number(id));
    
    if (viewer && ids.length > 0) {
      viewer.clearSelection();
      viewer.select(ids);
    } else {
      console.error("Viewer no inicializado o no hay elementos para resaltar.");
    }
  };
  
  export const applyFilterToViewer = async (
    filterType: "isolate" | "hide" | "highlight",
    filterValue: string,
    viewer: Autodesk.Viewing.GuiViewer3D | null,
    backendUrl: string,
    projectId: string
  ): Promise<void> => {
    try {
      const response = await fetch(`${backendUrl}/filter-elements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filterType, filterValue, projectId }),
      });
  
      const data = await response.json();
      if (!data.dbIds || data.dbIds.length === 0) {
        console.warn(`No se encontraron elementos para el filtro: ${filterValue}`);
        return;
      }
  
      console.debug("Data de elementos filtrados:", data.dbIds);
  
      switch (filterType) {
        case "isolate":
          isolateObjectsInViewer(viewer, data.dbIds);
          break;
        case "hide":
          hideObjectsInViewer(viewer, data.dbIds);
          break;
        case "highlight":
          highlightObjectsInViewer(viewer, data.dbIds);
          break;
        default:
          console.error("Acción no reconocida:", filterType);
      }
    } catch (error) {
      console.error("Error al aplicar filtro en el visor:", error);
    }
  };
  
  export const resetViewerView = (viewer: Autodesk.Viewing.GuiViewer3D | null): void => {
    if (viewer) {
      viewer.isolate([]); // Vacío resetea el aislamiento
      viewer.clearThemingColors();
      viewer.showAll();
    } else {
      console.error("Viewer no inicializado.");
    }
  };