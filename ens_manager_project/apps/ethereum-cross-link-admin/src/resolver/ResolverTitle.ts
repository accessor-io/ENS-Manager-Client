import { Resolver as TResolver } from "../api/resolver/Resolver";

export const RESOLVER_TITLE_FIELD = "id";

export const ResolverTitle = (record: TResolver): string => {
  return record.id?.toString() || String(record.id);
};
