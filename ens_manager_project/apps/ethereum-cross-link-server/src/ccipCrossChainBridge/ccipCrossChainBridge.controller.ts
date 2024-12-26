import * as common from "@nestjs/common";
import * as swagger from "@nestjs/swagger";
import { CcipCrossChainBridgeService } from "./ccipCrossChainBridge.service";
import { CcipCrossChainBridgeControllerBase } from "./base/ccipCrossChainBridge.controller.base";

@swagger.ApiTags("ccipCrossChainBridges")
@common.Controller("ccipCrossChainBridges")
export class CcipCrossChainBridgeController extends CcipCrossChainBridgeControllerBase {
  constructor(protected readonly service: CcipCrossChainBridgeService) {
    super(service);
  }
}
