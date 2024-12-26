import { OracleWhereInput } from "./OracleWhereInput";
import { OracleOrderByInput } from "./OracleOrderByInput";

export type OracleFindManyArgs = {
  where?: OracleWhereInput;
  orderBy?: Array<OracleOrderByInput>;
  skip?: number;
  take?: number;
};
