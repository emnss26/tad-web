import config from "../config";
import { AecModelsLib, IElementGroupResult } from "../libs/aec/aec.models";
import { AecProjectsLib, IAecProject } from "../libs/aec/aec.projects";

export interface IAecResolvedProject {
  dmProjectId: string;
  aecProjectId: string;
  name: string;
  raw: IAecProject;
}

const normalizeText = (value: unknown): string => String(value || "").trim();

const tryDecodeUri = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const canonicalizeDmProjectId = (value: unknown): string => {
  const decoded = tryDecodeUri(normalizeText(value));
  const noPrefix = decoded.replace(/^b\./i, "");
  return noPrefix.toLowerCase();
};

const buildDmProjectVariants = (value: string): string[] => {
  const raw = normalizeText(value);
  if (!raw) return [];

  const decoded = tryDecodeUri(raw);
  const canonical = canonicalizeDmProjectId(decoded);
  if (!canonical) return [];

  return Array.from(new Set([raw, decoded, canonical, `b.${canonical}`]));
};

const hasViewerVersionUrn = (urn: string): boolean => String(urn || "").includes("urn:adsk.wipprod:fs.file:vf.");

const resolveModelUrn = (model: IElementGroupResult): string => {
  const candidates = [
    model?.alternativeIdentifiers?.fileVersionUrn,
    model?.alternativeIdentifiers?.fileUrn,
  ].filter(Boolean) as string[];

  const versionUrn = candidates.find(hasViewerVersionUrn);
  return versionUrn || candidates[0] || "";
};

export const AecProjectService = {
  async getAecProjects(token: string): Promise<IAecProject[]> {
    const hubAecId = String(config.aps.hubAecId || "").trim();
    if (!hubAecId) {
      throw new Error("Missing APS_HUB_AEC_ID in environment");
    }

    return AecProjectsLib.getAllProjects(token, hubAecId);
  },

  async resolveProjectByDmId(token: string, dmProjectId: string): Promise<IAecResolvedProject | null> {
    const candidates = buildDmProjectVariants(dmProjectId);
    if (!candidates.length) return null;
    const candidateCanon = canonicalizeDmProjectId(dmProjectId);

    const projects = await AecProjectService.getAecProjects(token);
    const found = projects.find((project) => {
      const dmId = normalizeText(project?.alternativeIdentifiers?.dataManagementAPIProjectId);
      if (!dmId) return false;

      const dmIdDecoded = tryDecodeUri(dmId);
      const dmIdCanon = canonicalizeDmProjectId(dmIdDecoded);

      return (
        candidates.includes(dmId) ||
        candidates.includes(dmIdDecoded) ||
        dmIdCanon === candidateCanon
      );
    });

    if (!found?.id) {
      return null;
    }

    const dmResolved = normalizeText(found.alternativeIdentifiers?.dataManagementAPIProjectId || dmProjectId);

    return {
      dmProjectId: dmResolved,
      aecProjectId: found.id,
      name: normalizeText(found.name),
      raw: found,
    };
  },

  async getModelsByDmProjectId(token: string, dmProjectId: string) {
    const resolved = await AecProjectService.resolveProjectByDmId(token, dmProjectId);
    if (!resolved) return null;

    const models = await AecModelsLib.getModels(token, resolved.aecProjectId);
    const normalized = (Array.isArray(models) ? models : []).map((model) => ({
      ...model,
      urn: resolveModelUrn(model),
      name: String(model?.name || ""),
    }));

    return {
      project: resolved,
      models: normalized,
    };
  },
};
