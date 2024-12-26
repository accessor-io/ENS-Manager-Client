import { ProjectRegistryWhereInput } from "./ProjectRegistryWhereInput";
import { ProjectRegistryOrderByInput } from "./ProjectRegistryOrderByInput";

export type ProjectRegistryFindManyArgs = {
  where?: ProjectRegistryWhereInput;
  orderBy?: Array<ProjectRegistryOrderByInput>;
  skip?: number;
  take?: number;
};
