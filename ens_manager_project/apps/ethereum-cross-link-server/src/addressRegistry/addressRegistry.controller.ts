import * as common from "@nestjs/common";
import * as swagger from "@nestjs/swagger";
import { AddressRegistryService } from "./addressRegistry.service";
import { AddressRegistryControllerBase } from "./base/addressRegistry.controller.base";

@swagger.ApiTags("addressRegistries")
@common.Controller("addressRegistries")
export class AddressRegistryController extends AddressRegistryControllerBase {
  constructor(protected readonly service: AddressRegistryService) {
    super(service);
  }
}
