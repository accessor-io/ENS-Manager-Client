import { Governor as TGovernor } from "../api/governor/Governor";

export const GOVERNOR_TITLE_FIELD = "id";

export const GovernorTitle = (record: TGovernor): string => {
  return record.id?.toString() || String(record.id);
};
