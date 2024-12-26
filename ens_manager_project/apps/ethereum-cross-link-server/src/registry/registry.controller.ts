import * as common from "@nestjs/common";
import * as swagger from "@nestjs/swagger";
import { RegistryService } from "./registry.service";
import { RegistryControllerBase } from "./base/registry.controller.base";

@swagger.ApiTags("registries")
@common.Controller("registries")
export class RegistryController extends RegistryControllerBase {
  constructor(protected readonly service: RegistryService) {
    super(service);
  }
}
