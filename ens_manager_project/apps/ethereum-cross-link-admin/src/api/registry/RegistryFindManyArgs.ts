import { RegistryWhereInput } from "./RegistryWhereInput";
import { RegistryOrderByInput } from "./RegistryOrderByInput";

export type RegistryFindManyArgs = {
  where?: RegistryWhereInput;
  orderBy?: Array<RegistryOrderByInput>;
  skip?: number;
  take?: number;
};
