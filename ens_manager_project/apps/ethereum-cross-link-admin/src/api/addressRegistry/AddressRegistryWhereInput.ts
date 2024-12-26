import { StringFilter } from "../../util/StringFilter";
import { StringNullableFilter } from "../../util/StringNullableFilter";

export type AddressRegistryWhereInput = {
  id?: StringFilter;
  registryAddress?: StringNullableFilter;
  registryName?: StringNullableFilter;
};
