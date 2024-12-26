import * as graphql from "@nestjs/graphql";
import { GovernorResolverBase } from "./base/governor.resolver.base";
import { Governor } from "./base/Governor";
import { Resolver } from "../resolver/base/Resolver";
import { GovernorService } from "./governor.service";

@graphql.Resolver(() => Governor)
export class GovernorResolver extends GovernorResolverBase {
  constructor(protected readonly service: GovernorService) {
    super(service);
  }
}
