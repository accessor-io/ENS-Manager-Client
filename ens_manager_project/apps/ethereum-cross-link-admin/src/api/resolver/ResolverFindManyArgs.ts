import { ResolverWhereInput } from "./ResolverWhereInput";
import { ResolverOrderByInput } from "./ResolverOrderByInput";

export type ResolverFindManyArgs = {
  where?: ResolverWhereInput;
  orderBy?: Array<ResolverOrderByInput>;
  skip?: number;
  take?: number;
};
