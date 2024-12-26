import { Module } from "@nestjs/common";
import { OracleModuleBase } from "./base/oracle.module.base";
import { OracleService } from "./oracle.service";
import { OracleController } from "./oracle.controller";
import { OracleResolver } from "./oracle.resolver";

@Module({
  imports: [OracleModuleBase],
  controllers: [OracleController],
  providers: [OracleService, OracleResolver],
  exports: [OracleService],
})
export class OracleModule {}
