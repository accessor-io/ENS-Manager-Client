import { AddressRegistry as TAddressRegistry } from "../api/addressRegistry/AddressRegistry";

export const ADDRESSREGISTRY_TITLE_FIELD = "registryName";

export const AddressRegistryTitle = (record: TAddressRegistry): string => {
  return record.registryName?.toString() || String(record.id);
};
