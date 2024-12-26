import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { GovernorServiceBase } from "./base/governor.service.base";

@Injectable()
export class GovernorService extends GovernorServiceBase {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }
}
