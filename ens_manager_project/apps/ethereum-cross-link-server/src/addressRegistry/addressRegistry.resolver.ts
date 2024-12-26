import * as graphql from "@nestjs/graphql";
import { AddressRegistryResolverBase } from "./base/addressRegistry.resolver.base";
import { AddressRegistry } from "./base/AddressRegistry";
import { Resolver } from "../resolver/base/Resolver";
import { AddressRegistryService } from "./addressRegistry.service";

@graphql.Resolver(() => AddressRegistry)
export class AddressRegistryResolver extends AddressRegistryResolverBase {
  constructor(protected readonly service: AddressRegistryService) {
    super(service);
  }
}
