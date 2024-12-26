import { Module } from "@nestjs/common";
import { AttestationManagerModuleBase } from "./base/attestationManager.module.base";
import { AttestationManagerService } from "./attestationManager.service";
import { AttestationManagerController } from "./attestationManager.controller";
import { AttestationManagerResolver } from "./attestationManager.resolver";

@Module({
  imports: [AttestationManagerModuleBase],
  controllers: [AttestationManagerController],
  providers: [AttestationManagerService, AttestationManagerResolver],
  exports: [AttestationManagerService],
})
export class AttestationManagerModule {}
