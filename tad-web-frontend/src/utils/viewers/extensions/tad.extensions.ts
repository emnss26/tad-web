export class CategorySelectionExtension extends Autodesk.Viewing.Extension {
    private _group: Autodesk.Viewing.UI.ControlGroup | null = null;
    private _button: Autodesk.Viewing.UI.Button | null = null;
  
    constructor(viewer: Autodesk.Viewing.GuiViewer3D, options: any) {
      super(viewer, options);
    }
  
    load(): boolean {
      return true;
    }
  
    unload(): boolean {
      if (this._button && this._group) {
        this._group.removeControl(this._button);
        this._button = null;
      }
      return true;
    }
  
    onToolbarCreated(): void {
      this._group = this.viewer.toolbar.getControl("TADCustomControls") as Autodesk.Viewing.UI.ControlGroup;
      if (!this._group) {
        this._group = new Autodesk.Viewing.UI.ControlGroup("TADCustomControls");
        this.viewer.toolbar.addControl(this._group);
      }
  
      this._button = new Autodesk.Viewing.UI.Button("selectCategoryButton");
      this._button.addClass("selectCategoryIcon");
      this._button.setToolTip("Isolate elements by Category (Visible Only)");
      this._button.onClick = () => this.handleIsolation();
  
      this._group.addControl(this._button);
    }
  
    // ---- Helpers (FIX isNodeHidden) ----
    private isNodeVisibleSafe(dbId: number): boolean {
      try {
        // Prefer viewer API (existe en muchas versiones)
        if (typeof (this.viewer as any).isNodeVisible === "function") {
          return (this.viewer as any).isNodeVisible(dbId, this.viewer.model);
        }
  
        // Fallback: visibilityManager
        const vm = (this.viewer as any).visibilityManager || (this.viewer as any).impl?.visibilityManager;
        if (vm && typeof vm.isNodeVisible === "function") return vm.isNodeVisible(dbId);
        if (vm && typeof vm.isNodeHidden === "function") return !vm.isNodeHidden(dbId);
      } catch (e) {}
  
      // Si no podemos determinar, asumimos visible (para no “vaciar” selección)
      return true;
    }
  
    private getAllLeafNodes(instanceTree: any, parentId: number, leafDbIds: number[]) {
      instanceTree.enumNodeChildren(parentId, (childId: number) => {
        if (instanceTree.getChildCount(childId) === 0) {
          leafDbIds.push(childId);
        } else {
          this.getAllLeafNodes(instanceTree, childId, leafDbIds);
        }
      });
    }
  
    private findCategoryProp(props: any[]): any | null {
      if (!Array.isArray(props)) return null;
      return (
        props.find((p: any) => p.displayName === "Category") ||
        props.find((p: any) => p.displayName === "Categoría") ||
        props.find((p: any) => p.displayName === "Categoria") ||
        null
      );
    }
  
    private handleIsolation(): void {
      const selection = this.viewer.getSelection();
      if (!selection || selection.length === 0) {
        console.warn("No selected elements.");
        return;
      }
  
      if (!this.viewer.model) {
        console.warn("Viewer model not ready.");
        return;
      }
  
      const baseDbId = selection[0];
  
      this.viewer.getProperties(
        baseDbId,
        (result: any) => {
          const categoryProp = this.findCategoryProp(result?.properties);
          if (!categoryProp) {
            console.warn("Selected element does not have a 'Category' property.");
            return;
          }
  
          const categoryValue = categoryProp.displayValue;
          const instanceTree = this.viewer.model.getData()?.instanceTree;
          if (!instanceTree) return;
  
          // Hacemos match solo sobre hojas (geometría)
          const allLeaves: number[] = [];
          this.getAllLeafNodes(instanceTree, instanceTree.getRootId(), allLeaves);
  
          // Filtrar visibles (FIX)
          const visibleLeaves = allLeaves.filter((dbId) => this.isNodeVisibleSafe(dbId));
  
          // Bulk props sobre visibles
          this.viewer.model.getBulkProperties(
            visibleLeaves,
            ["Category"], // filtro de propiedades
            (items: any[]) => {
              const matchingDbIds = (items || [])
                .filter((item) => {
                  const cat = this.findCategoryProp(item?.properties);
                  return cat && cat.displayValue === categoryValue;
                })
                .map((item) => item.dbId);
  
              if (!matchingDbIds.length) {
                console.warn("No elements matched the selected Category (within visible).");
                return;
              }
  
              this.viewer.isolate(matchingDbIds);
              this.viewer.fitToView(matchingDbIds);
            }
          );
        },
        (err: any) => console.error(err)
      );
    }
  }
  
  export class ModeDataExtractionExtension extends Autodesk.Viewing.Extension {
    private _group: Autodesk.Viewing.UI.ControlGroup | null = null;
    private _button: Autodesk.Viewing.UI.Button | null = null;
  
    constructor(viewer: Autodesk.Viewing.GuiViewer3D, options: any) {
      super(viewer, options);
    }
  
    load(): boolean {
      return true;
    }
  
    unload(): boolean {
      if (this._button && this._group) {
        this._group.removeControl(this._button);
      }
      return true;
    }
  
    onToolbarCreated(): void {
      this._group = this.viewer.toolbar.getControl("allDataExtractionControls") as Autodesk.Viewing.UI.ControlGroup;
      if (!this._group) {
        this._group = new Autodesk.Viewing.UI.ControlGroup("allDataExtractionControls");
        this.viewer.toolbar.addControl(this._group);
      }
  
      this._button = new Autodesk.Viewing.UI.Button("extractDataButton");
      this._button.addClass("extractDataIcon");
      this._button.setToolTip("Extract Data from Selection");
  
      this._button.onClick = () => {
        const selection = this.viewer.getSelection();
        if (selection.length === 0) return;
  
        selection.forEach((dbId) => {
          this.viewer.getProperties(
            dbId,
            (data: any) => {
              const propertiesMap = (data?.properties || []).reduce((acc: any, prop: any) => {
                acc[prop.displayName] = prop.displayValue || "Not Specified";
                return acc;
              }, {});
  
              const event = new CustomEvent("dbIdDataExtracted", {
                detail: { dbId, properties: propertiesMap },
                
              });
              window.dispatchEvent(event);
            },
            (err: any) => console.error(err)
          );
        });
        
      };

      
  
      this._group.addControl(this._button);
    }
  }
  
  export class TypeNameSelectionExtension extends Autodesk.Viewing.Extension {
    private _group: Autodesk.Viewing.UI.ControlGroup | null = null;
    private _button: Autodesk.Viewing.UI.Button | null = null;
  
    constructor(viewer: Autodesk.Viewing.GuiViewer3D, options: any) {
      super(viewer, options);
    }
  
    load() { return true; }
    unload() {
      if (this._button && this._group) this._group.removeControl(this._button);
      return true;
    }
  
    private getAllDescendants(instanceTree: any, parentId: number, dbIdArray: number[]) {
      instanceTree.enumNodeChildren(parentId, (childId: number) => {
        dbIdArray.push(childId);
        this.getAllDescendants(instanceTree, childId, dbIdArray);
      });
    }
  
    onToolbarCreated() {
      this._group = this.viewer.toolbar.getControl("TADCustomControls") as Autodesk.Viewing.UI.ControlGroup;
      if (!this._group) {
        this._group = new Autodesk.Viewing.UI.ControlGroup("TADCustomControls");
        this.viewer.toolbar.addControl(this._group);
      }
  
      this._button = new Autodesk.Viewing.UI.Button("selectTypeNameButton");
      this._button.addClass("selectTypeCategoryIcon");
      this._button.setToolTip('Isolate elements by "Type Name"');
  
      this._button.onClick = () => {
        const selection = this.viewer.getSelection();
        if (!selection.length) return;
  
        const baseDbId = selection[0];
        this.viewer.getProperties(
          baseDbId,
          (result: any) => {
            const typeNameProp = (result?.properties || []).find((p: any) => p.displayName === "Type Name");
            if (!typeNameProp) {
              console.warn("Element missing 'Type Name'.");
              return;
            }
  
            const typeNameValue = typeNameProp.displayValue;
            const instanceTree = this.viewer.model?.getData()?.instanceTree;
            if (!instanceTree) return;
  
            const allDbIds: number[] = [];
            this.getAllDescendants(instanceTree, instanceTree.getRootId(), allDbIds);
  
            this.viewer.model.getBulkProperties(allDbIds, ["Type Name"], (items: any[]) => {
              const matching = (items || [])
                .filter((item) => {
                  const p = (item?.properties || []).find((prop: any) => prop.displayName === "Type Name");
                  return p && p.displayValue === typeNameValue;
                })
                .map((i) => i.dbId);
  
              this.viewer.isolate(matching);
              this.viewer.fitToView(matching);
            });
          },
          (err: any) => console.error(err)
        );
      };
  
      this._group.addControl(this._button);
    }
  }
  
  export class VisibleSelectionExtension extends Autodesk.Viewing.Extension {
    private _group: Autodesk.Viewing.UI.ControlGroup | null = null;
    private _button: Autodesk.Viewing.UI.Button | null = null;
  
    constructor(viewer: Autodesk.Viewing.GuiViewer3D, options: any) {
      super(viewer, options);
    }
  
    load() { return true; }
    unload() {
      if (this._button && this._group) this._group.removeControl(this._button);
      return true;
    }
  
    private isNodeVisibleSafe(dbId: number): boolean {
      try {
        if (typeof (this.viewer as any).isNodeVisible === "function") {
          return (this.viewer as any).isNodeVisible(dbId, this.viewer.model);
        }
        const vm = (this.viewer as any).visibilityManager || (this.viewer as any).impl?.visibilityManager;
        if (vm && typeof vm.isNodeVisible === "function") return vm.isNodeVisible(dbId);
        if (vm && typeof vm.isNodeHidden === "function") return !vm.isNodeHidden(dbId);
      } catch (e) {}
      return true;
    }
  
    private getAllLeafNodes(instanceTree: any, parentId: number, leafDbIds: number[]) {
      instanceTree.enumNodeChildren(parentId, (childId: number) => {
        if (instanceTree.getChildCount(childId) === 0) {
          leafDbIds.push(childId);
        } else {
          this.getAllLeafNodes(instanceTree, childId, leafDbIds);
        }
      });
    }
  
    onToolbarCreated() {
      this._group = this.viewer.toolbar.getControl("TADCustomControls") as Autodesk.Viewing.UI.ControlGroup;
      if (!this._group) {
        this._group = new Autodesk.Viewing.UI.ControlGroup("TADCustomControls");
        this.viewer.toolbar.addControl(this._group);
      }
  
      this._button = new Autodesk.Viewing.UI.Button("selectVisibleButton");
      this._button.addClass("selectVisibleIcon");
      this._button.setToolTip("Select all visible geometry");
  
      this._button.onClick = () => {
        const instanceTree = this.viewer.model?.getData()?.instanceTree;
        if (!instanceTree) return;
  
        const leaves: number[] = [];
        this.getAllLeafNodes(instanceTree, instanceTree.getRootId(), leaves);
  
        // FIX: ya no usamos isNodeHidden
        const visibleLeaves = leaves.filter((dbId) => this.isNodeVisibleSafe(dbId));
  
        this.viewer.select(visibleLeaves);
      };
  
      this._group.addControl(this._button);
    }
  }
  
  Autodesk.Viewing.theExtensionManager.registerExtension("CategorySelectionExtension", CategorySelectionExtension);
  Autodesk.Viewing.theExtensionManager.registerExtension("ModeDataExtractionExtension", ModeDataExtractionExtension);
  Autodesk.Viewing.theExtensionManager.registerExtension("TypeNameSelectionExtension", TypeNameSelectionExtension);
  Autodesk.Viewing.theExtensionManager.registerExtension("VisibleSelectionExtension", VisibleSelectionExtension);
  
