import { AddressRegistryWhereInput } from "./AddressRegistryWhereInput";
import { AddressRegistryOrderByInput } from "./AddressRegistryOrderByInput";

export type AddressRegistryFindManyArgs = {
  where?: AddressRegistryWhereInput;
  orderBy?: Array<AddressRegistryOrderByInput>;
  skip?: number;
  take?: number;
};
