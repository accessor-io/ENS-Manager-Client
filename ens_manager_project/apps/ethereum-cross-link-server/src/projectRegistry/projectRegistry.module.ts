import { Module } from "@nestjs/common";
import { ProjectRegistryModuleBase } from "./base/projectRegistry.module.base";
import { ProjectRegistryService } from "./projectRegistry.service";
import { ProjectRegistryController } from "./projectRegistry.controller";
import { ProjectRegistryResolver } from "./projectRegistry.resolver";

@Module({
  imports: [ProjectRegistryModuleBase],
  controllers: [ProjectRegistryController],
  providers: [ProjectRegistryService, ProjectRegistryResolver],
  exports: [ProjectRegistryService],
})
export class ProjectRegistryModule {}
