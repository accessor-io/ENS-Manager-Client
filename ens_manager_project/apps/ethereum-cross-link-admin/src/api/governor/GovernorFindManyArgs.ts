import { GovernorWhereInput } from "./GovernorWhereInput";
import { GovernorOrderByInput } from "./GovernorOrderByInput";

export type GovernorFindManyArgs = {
  where?: GovernorWhereInput;
  orderBy?: Array<GovernorOrderByInput>;
  skip?: number;
  take?: number;
};
