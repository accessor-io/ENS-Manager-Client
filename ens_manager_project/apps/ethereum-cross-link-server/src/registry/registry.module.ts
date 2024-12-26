import { Module } from "@nestjs/common";
import { RegistryModuleBase } from "./base/registry.module.base";
import { RegistryService } from "./registry.service";
import { RegistryController } from "./registry.controller";
import { RegistryResolver } from "./registry.resolver";

@Module({
  imports: [RegistryModuleBase],
  controllers: [RegistryController],
  providers: [RegistryService, RegistryResolver],
  exports: [RegistryService],
})
export class RegistryModule {}
