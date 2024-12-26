import * as common from "@nestjs/common";
import * as swagger from "@nestjs/swagger";
import { GovernorService } from "./governor.service";
import { GovernorControllerBase } from "./base/governor.controller.base";

@swagger.ApiTags("governors")
@common.Controller("governors")
export class GovernorController extends GovernorControllerBase {
  constructor(protected readonly service: GovernorService) {
    super(service);
  }
}
