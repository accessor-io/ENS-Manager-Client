import * as common from "@nestjs/common";
import * as swagger from "@nestjs/swagger";
import { ProjectRegistryService } from "./projectRegistry.service";
import { ProjectRegistryControllerBase } from "./base/projectRegistry.controller.base";

@swagger.ApiTags("projectRegistries")
@common.Controller("projectRegistries")
export class ProjectRegistryController extends ProjectRegistryControllerBase {
  constructor(protected readonly service: ProjectRegistryService) {
    super(service);
  }
}
