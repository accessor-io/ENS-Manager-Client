import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AddressRegistryServiceBase } from "./base/addressRegistry.service.base";

@Injectable()
export class AddressRegistryService extends AddressRegistryServiceBase {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }
}
