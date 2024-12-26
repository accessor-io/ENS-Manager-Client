import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ProjectRegistryServiceBase } from "./base/projectRegistry.service.base";

@Injectable()
export class ProjectRegistryService extends ProjectRegistryServiceBase {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }
}
