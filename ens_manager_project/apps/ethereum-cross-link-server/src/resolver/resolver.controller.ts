import * as common from "@nestjs/common";
import * as swagger from "@nestjs/swagger";
import { ResolverService } from "./resolver.service";
import { ResolverControllerBase } from "./base/resolver.controller.base";

@swagger.ApiTags("resolvers")
@common.Controller("resolvers")
export class ResolverController extends ResolverControllerBase {
  constructor(protected readonly service: ResolverService) {
    super(service);
  }
}
