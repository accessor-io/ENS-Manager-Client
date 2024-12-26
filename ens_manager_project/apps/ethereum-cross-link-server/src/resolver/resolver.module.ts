import { Module } from "@nestjs/common";
import { ResolverModuleBase } from "./base/resolver.module.base";
import { ResolverService } from "./resolver.service";
import { ResolverController } from "./resolver.controller";
import { ResolverResolver } from "./resolver.resolver";

@Module({
  imports: [ResolverModuleBase],
  controllers: [ResolverController],
  providers: [ResolverService, ResolverResolver],
  exports: [ResolverService],
})
export class ResolverModule {}
