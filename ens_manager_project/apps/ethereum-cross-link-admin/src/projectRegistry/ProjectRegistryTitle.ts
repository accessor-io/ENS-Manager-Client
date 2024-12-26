import { ProjectRegistry as TProjectRegistry } from "../api/projectRegistry/ProjectRegistry";

export const PROJECTREGISTRY_TITLE_FIELD = "id";

export const ProjectRegistryTitle = (record: TProjectRegistry): string => {
  return record.id?.toString() || String(record.id);
};
