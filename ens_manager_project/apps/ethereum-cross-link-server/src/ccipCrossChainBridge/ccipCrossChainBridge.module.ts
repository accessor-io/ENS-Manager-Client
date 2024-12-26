import { Module } from "@nestjs/common";
import { CcipCrossChainBridgeModuleBase } from "./base/ccipCrossChainBridge.module.base";
import { CcipCrossChainBridgeService } from "./ccipCrossChainBridge.service";
import { CcipCrossChainBridgeController } from "./ccipCrossChainBridge.controller";
import { CcipCrossChainBridgeResolver } from "./ccipCrossChainBridge.resolver";

@Module({
  imports: [CcipCrossChainBridgeModuleBase],
  controllers: [CcipCrossChainBridgeController],
  providers: [CcipCrossChainBridgeService, CcipCrossChainBridgeResolver],
  exports: [CcipCrossChainBridgeService],
})
export class CcipCrossChainBridgeModule {}
