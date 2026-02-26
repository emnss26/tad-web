export const isolateObjectsInViewer = (
  viewer: Autodesk.Viewing.GuiViewer3D | null,
  dbIds: (number | string)[]
): void => {
  const ids = dbIds.map((id) => Number(id));

  if (viewer && ids.length > 0) {
    viewer.isolate(ids);
    viewer.fitToView(ids);
  } else {
    console.error("Viewer not initialized or no elements were found to isolate.");
  }
};

export const showAllObjects = (viewer: Autodesk.Viewing.GuiViewer3D | null): void => {
  if (viewer) {
    // isolate() with no args reveals all, but showAll() is explicit.
    viewer.isolate([]);
    viewer.showAll();
  } else {
    console.error("Viewer not initialized.");
  }
};

export const hideObjectsInViewer = (
  viewer: Autodesk.Viewing.GuiViewer3D | null,
  dbIds: (number | string)[]
): void => {
  const ids = dbIds.map((id) => Number(id));

  if (viewer && ids.length > 0) {
    viewer.hide(ids);
  } else {
    console.error("Viewer not initialized or no elements were provided to hide.");
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
    console.error("Viewer not initialized or no elements were provided to highlight.");
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
      return;
    }

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
        console.error("Unknown action:", filterType);
    }
  } catch (error) {
    console.error("Failed to apply viewer filter:", error);
  }
};

export const resetViewerView = (viewer: Autodesk.Viewing.GuiViewer3D | null): void => {
  if (viewer) {
    // Empty isolation restores all visibility.
    viewer.isolate([]);
    viewer.clearThemingColors();
    viewer.showAll();
  } else {
    console.error("Viewer not initialized.");
  }
};
