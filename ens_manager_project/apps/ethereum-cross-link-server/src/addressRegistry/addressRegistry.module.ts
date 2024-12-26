import { Module } from "@nestjs/common";
import { AddressRegistryModuleBase } from "./base/addressRegistry.module.base";
import { AddressRegistryService } from "./addressRegistry.service";
import { AddressRegistryController } from "./addressRegistry.controller";
import { AddressRegistryResolver } from "./addressRegistry.resolver";

@Module({
  imports: [AddressRegistryModuleBase],
  controllers: [AddressRegistryController],
  providers: [AddressRegistryService, AddressRegistryResolver],
  exports: [AddressRegistryService],
})
export class AddressRegistryModule {}
