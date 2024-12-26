import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RegistryServiceBase } from "./base/registry.service.base";

@Injectable()
export class RegistryService extends RegistryServiceBase {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }
}
