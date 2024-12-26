import { AttestationManager as TAttestationManager } from "../api/attestationManager/AttestationManager";

export const ATTESTATIONMANAGER_TITLE_FIELD = "id";

export const AttestationManagerTitle = (
  record: TAttestationManager
): string => {
  return record.id?.toString() || String(record.id);
};
