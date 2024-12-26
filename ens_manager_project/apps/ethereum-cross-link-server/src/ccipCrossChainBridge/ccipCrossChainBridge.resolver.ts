import * as graphql from "@nestjs/graphql";
import { CcipCrossChainBridgeResolverBase } from "./base/ccipCrossChainBridge.resolver.base";
import { CcipCrossChainBridge } from "./base/CcipCrossChainBridge";
import { Resolver } from "../resolver/base/Resolver";
import { CcipCrossChainBridgeService } from "./ccipCrossChainBridge.service";

@graphql.Resolver(() => CcipCrossChainBridge)
export class CcipCrossChainBridgeResolver extends CcipCrossChainBridgeResolverBase {
  constructor(protected readonly service: CcipCrossChainBridgeService) {
    super(service);
  }
}
