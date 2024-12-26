import * as common from "@nestjs/common";
import * as swagger from "@nestjs/swagger";
import { AttestationManagerService } from "./attestationManager.service";
import { AttestationManagerControllerBase } from "./base/attestationManager.controller.base";

@swagger.ApiTags("attestationManagers")
@common.Controller("attestationManagers")
export class AttestationManagerController extends AttestationManagerControllerBase {
  constructor(protected readonly service: AttestationManagerService) {
    super(service);
  }
}
