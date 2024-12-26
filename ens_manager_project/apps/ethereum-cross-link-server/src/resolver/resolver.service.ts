import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ResolverServiceBase } from "./base/resolver.service.base";

@Injectable()
export class ResolverService extends ResolverServiceBase {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }
}
