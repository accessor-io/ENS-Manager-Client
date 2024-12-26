import * as graphql from "@nestjs/graphql";
import { ResolverResolverBase } from "./base/resolver.resolver.base";
import { Resolver } from "./base/Resolver";
import { ResolverService } from "./resolver.service";

@graphql.Resolver(() => Resolver)
export class ResolverResolver extends ResolverResolverBase {
  constructor(protected readonly service: ResolverService) {
    super(service);
  }
}
