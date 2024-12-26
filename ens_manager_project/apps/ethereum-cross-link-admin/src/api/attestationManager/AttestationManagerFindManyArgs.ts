import { AttestationManagerWhereInput } from "./AttestationManagerWhereInput";
import { AttestationManagerOrderByInput } from "./AttestationManagerOrderByInput";

export type AttestationManagerFindManyArgs = {
  where?: AttestationManagerWhereInput;
  orderBy?: Array<AttestationManagerOrderByInput>;
  skip?: number;
  take?: number;
};
