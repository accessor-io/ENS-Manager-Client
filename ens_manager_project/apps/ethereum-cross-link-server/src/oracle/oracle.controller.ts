import * as common from "@nestjs/common";
import * as swagger from "@nestjs/swagger";
import { OracleService } from "./oracle.service";
import { OracleControllerBase } from "./base/oracle.controller.base";

@swagger.ApiTags("oracles")
@common.Controller("oracles")
export class OracleController extends OracleControllerBase {
  constructor(protected readonly service: OracleService) {
    super(service);
  }
}
