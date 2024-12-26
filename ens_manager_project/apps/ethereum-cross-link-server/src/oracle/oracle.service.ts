import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OracleServiceBase } from "./base/oracle.service.base";

@Injectable()
export class OracleService extends OracleServiceBase {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }
}
