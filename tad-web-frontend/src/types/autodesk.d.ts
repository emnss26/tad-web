declare namespace Autodesk {
  namespace Viewing {
    class GuiViewer3D {
      constructor(container: HTMLElement, config?: any);
      start(): number;
      finish(): void;
      resize(): void;
      loadDocumentNode(doc: any, geometry: any): void;
      addEventListener(event: string, callback: (e: any) => void): void;
      setSelectionMode(mode: any): void;
      getSelection(): number[];
      select(dbIds: number[]): void;
      clearSelection(): void;
      getProperties(dbId: number, onSuccess: (res: any) => void, onError?: (err: any) => void): void;
      isolate(dbIds: number[]): void;
      fitToView(dbIds: number[]): void;
      show(dbIds: number[]): void;
      showAll(): void;
      hide(dbIds: number[]): void;
      hideAll(): void;
      setThemingColor(dbId: number | null, color: THREE.Vector4 | null, model?: any): void;
      clearThemingColors(): void;
      isNodeHidden(dbId: number): boolean;
      model: any;
      toolbar: any;
    }

    class Extension {
      constructor(viewer: GuiViewer3D, options?: any);
      viewer: GuiViewer3D;
      options: any;
      load(): boolean;
      unload(): boolean;
      onToolbarCreated?(): void;
    }

    namespace UI {
      class ControlGroup {
        constructor(id: string);
        addControl(control: any): void;
        removeControl(control: any): void;
        getControl(id: string): any;
      }
      class Button {
        constructor(id: string);
        onClick: (e: any) => void;
        setToolTip(text: string): void;
        addClass(className: string): void;
      }
    }

    const SelectionMode: { MULTIPLE: number };
    const OBJECT_TREE_CREATED_EVENT: string;
    const SELECTION_CHANGED_EVENT: string;

    function Initializer(options: any, callback: () => void): void;

    namespace Document {
      function load(
        documentId: string,
        onSuccess: (doc: any) => void,
        onError: (errorCode: number, errorMsg: string) => void
      ): void;
    }

    namespace theExtensionManager {
        function registerExtension(extensionId: string, extensionClass: any): void;
    }
  }
}

declare namespace THREE {
    class Vector4 {
        constructor(x: number, y: number, z: number, w: number);
    }
    class Color {
        constructor(hex: string | number);
        r: number;
        g: number;
        b: number;
    }
}