import * as graphql from "@nestjs/graphql";
import { OracleResolverBase } from "./base/oracle.resolver.base";
import { Oracle } from "./base/Oracle";
import { Resolver } from "../resolver/base/Resolver";
import { OracleService } from "./oracle.service";

@graphql.Resolver(() => Oracle)
export class OracleResolver extends OracleResolverBase {
  constructor(protected readonly service: OracleService) {
    super(service);
  }
}
