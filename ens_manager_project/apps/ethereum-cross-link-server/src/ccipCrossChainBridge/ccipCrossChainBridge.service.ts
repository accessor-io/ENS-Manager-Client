import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CcipCrossChainBridgeServiceBase } from "./base/ccipCrossChainBridge.service.base";

@Injectable()
export class CcipCrossChainBridgeService extends CcipCrossChainBridgeServiceBase {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }
}
