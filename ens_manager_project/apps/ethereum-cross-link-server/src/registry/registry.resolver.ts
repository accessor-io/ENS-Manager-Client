import * as graphql from "@nestjs/graphql";
import { RegistryResolverBase } from "./base/registry.resolver.base";
import { Registry } from "./base/Registry";
import { Resolver } from "../resolver/base/Resolver";
import { RegistryService } from "./registry.service";

@graphql.Resolver(() => Registry)
export class RegistryResolver extends RegistryResolverBase {
  constructor(protected readonly service: RegistryService) {
    super(service);
  }
}
