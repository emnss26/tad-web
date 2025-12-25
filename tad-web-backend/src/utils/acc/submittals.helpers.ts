// Mapeo de estados de Autodesk a texto legible
export const SUBMITTAL_STATES: Record<string, string> = {
  "sbc-1": "Waiting for submission",
  "rev": "In review",
  "mgr-2": "Reviewed",
  "mgr-1": "Submitted",
  "sbc-2": "Closed",
  // Agrega otros si aparecen en la documentación nueva
};

export const getReadableState = (stateId: string): string => {
  return SUBMITTAL_STATES[stateId] || stateId;
};