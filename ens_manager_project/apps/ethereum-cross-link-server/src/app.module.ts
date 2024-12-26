import { Module } from "@nestjs/common";
import { CcipCrossChainBridgeModule } from "./ccipCrossChainBridge/ccipCrossChainBridge.module";
import { RegistryModule } from "./registry/registry.module";
import { AddressRegistryModule } from "./addressRegistry/addressRegistry.module";
import { AttestationManagerModule } from "./attestationManager/attestationManager.module";
import { GovernorModule } from "./governor/governor.module";
import { ResolverModule } from "./resolver/resolver.module";
import { OracleModule } from "./oracle/oracle.module";
import { ProjectRegistryModule } from "./projectRegistry/projectRegistry.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SecretsManagerModule } from "./providers/secrets/secretsManager.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import { ServeStaticOptionsService } from "./serveStaticOptions.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { AuthModule } from './auth/auth.module';

@Module({
  controllers: [],
  imports: [
    CcipCrossChainBridgeModule,
    RegistryModule,
    AddressRegistryModule,
    AttestationManagerModule,
    GovernorModule,
    ResolverModule,
    OracleModule,
    ProjectRegistryModule,
    HealthModule,
    PrismaModule,
    SecretsManagerModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRootAsync({
      useClass: ServeStaticOptionsService,
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: (configService: ConfigService) => {
        const playground = configService.get("GRAPHQL_PLAYGROUND");
        const introspection = configService.get("GRAPHQL_INTROSPECTION");
        return {
          autoSchemaFile: "schema.graphql",
          sortSchema: true,
          playground,
          introspection: playground || introspection,
        };
      },
      inject: [ConfigService],
      imports: [ConfigModule],
    }),
    AuthModule,
  ],
  providers: [],
})
export class AppModule {}
