import { Module } from "@nestjs/common";
import { GovernorModuleBase } from "./base/governor.module.base";
import { GovernorService } from "./governor.service";
import { GovernorController } from "./governor.controller";
import { GovernorResolver } from "./governor.resolver";

@Module({
  imports: [GovernorModuleBase],
  controllers: [GovernorController],
  providers: [GovernorService, GovernorResolver],
  exports: [GovernorService],
})
export class GovernorModule {}
