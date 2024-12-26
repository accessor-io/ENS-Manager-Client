import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AttestationManagerServiceBase } from "./base/attestationManager.service.base";

@Injectable()
export class AttestationManagerService extends AttestationManagerServiceBase {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }
}
