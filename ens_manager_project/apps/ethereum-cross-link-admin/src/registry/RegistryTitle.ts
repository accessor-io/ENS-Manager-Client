import { Registry as TRegistry } from "../api/registry/Registry";

export const REGISTRY_TITLE_FIELD = "id";

export const RegistryTitle = (record: TRegistry): string => {
  return record.id?.toString() || String(record.id);
};
