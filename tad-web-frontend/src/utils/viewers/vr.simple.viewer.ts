/* global Autodesk */

const BACKEND_URL = import.meta.env.VITE_API_BACKEND_BASE_URL || "http://localhost:8080";

const toBase64Url = (s: string) =>
  btoa(s).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

const toViewerDocumentId = (input: string) => {
  const raw = (input || "").trim();
  if (!raw) throw new Error("Empty URN provided");

  if (raw.startsWith("urn:") && !raw.slice(4).includes(":")) {
    return raw;
  }

  if (!raw.startsWith("urn:") && !raw.includes(":")) {
    return `urn:${raw}`;
  }

  const normalized = raw.startsWith("urn:") ? raw : `urn:${raw}`;
  return `urn:${toBase64Url(normalized)}`;
};

async function getTwoLeggedToken(): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/api/auth/two-legged`, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Unable to get token: ${response.statusText}`);
  }
  const json = await response.json();
  const token = json?.data?.access_token || json?.access_token;
  if (!token) throw new Error("Token response is missing access_token");
  return token;
}

export const vrSimpleViewer = async (urn: string, containerId = "TADSimpleVrViwer") => {
  const accessToken = await getTwoLeggedToken();
  const container = document.getElementById(containerId);

  if (!container) {
    throw new Error(`Viewer container '${containerId}' not found`);
  }

  container.innerHTML = "";

  Autodesk.Viewing.Initializer(
    {
      env: "AutodeskProduction",
      api: "modelDerivativeV2",
      accessToken,
      getAccessToken: (cb: (token: string, expiresIn: number) => void) => cb(accessToken, 3599),
    },
    () => {
      const viewer = new Autodesk.Viewing.GuiViewer3D(container, {});

      if (viewer.start() !== 0) {
        console.error("Failed to start Autodesk viewer");
        return;
      }

      const documentId = toViewerDocumentId(urn);

      Autodesk.Viewing.Document.load(
        documentId,
        (doc: any) => {
          const defaultModel = doc.getRoot().getDefaultGeometry();
          viewer.loadDocumentNode(doc, defaultModel);

          setTimeout(() => {
            const toolbar = viewer.getToolbar?.(true);
            if (!toolbar) return;

            let group = toolbar.getControl("custom-vr-group");
            if (!group) {
              group = new Autodesk.Viewing.UI.ControlGroup("custom-vr-group");
              toolbar.addControl(group);
            }

            if (!group.getControl("custom-vr-button")) {
              const vrButton = new Autodesk.Viewing.UI.Button("custom-vr-button");
              vrButton.setToolTip("Enter VR");
              vrButton.onClick = () => {
                viewer
                  .loadExtension("Autodesk.Viewing.WebVR")
                  .then(() => console.log("WebVR extension loaded"))
                  .catch((err: unknown) => console.error("Error loading WebVR extension", err));
              };

              // Icon fallback using text to avoid external assets.
              (vrButton as any).icon.textContent = "VR";
              (vrButton as any).icon.style.fontWeight = "bold";

              group.addControl(vrButton);
            }
          }, 400);
        },
        (errorCode: number, errorMsg: string) => {
          console.error("Error loading Autodesk document:", errorCode, errorMsg);
        }
      );
    }
  );
};
