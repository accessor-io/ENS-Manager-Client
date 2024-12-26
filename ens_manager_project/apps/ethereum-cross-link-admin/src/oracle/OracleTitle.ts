import { Oracle as TOracle } from "../api/oracle/Oracle";

export const ORACLE_TITLE_FIELD = "id";

export const OracleTitle = (record: TOracle): string => {
  return record.id?.toString() || String(record.id);
};
