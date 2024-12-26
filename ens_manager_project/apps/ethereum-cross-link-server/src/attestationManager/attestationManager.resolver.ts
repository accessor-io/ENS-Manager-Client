import * as graphql from "@nestjs/graphql";
import { AttestationManagerResolverBase } from "./base/attestationManager.resolver.base";
import { AttestationManager } from "./base/AttestationManager";
import { Resolver } from "../resolver/base/Resolver";
import { AttestationManagerService } from "./attestationManager.service";

@graphql.Resolver(() => AttestationManager)
export class AttestationManagerResolver extends AttestationManagerResolverBase {
  constructor(protected readonly service: AttestationManagerService) {
    super(service);
  }
}
