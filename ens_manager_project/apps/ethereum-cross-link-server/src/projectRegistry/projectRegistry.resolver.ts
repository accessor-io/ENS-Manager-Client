import * as graphql from "@nestjs/graphql";
import { ProjectRegistryResolverBase } from "./base/projectRegistry.resolver.base";
import { ProjectRegistry } from "./base/ProjectRegistry";
import { Resolver } from "../resolver/base/Resolver";
import { ProjectRegistryService } from "./projectRegistry.service";

@graphql.Resolver(() => ProjectRegistry)
export class ProjectRegistryResolver extends ProjectRegistryResolverBase {
  constructor(protected readonly service: ProjectRegistryService) {
    super(service);
  }
}
