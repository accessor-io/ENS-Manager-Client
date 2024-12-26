import { Args, Field, InputType, Mutation, ObjectType, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';

@InputType()
class LoginInput {
  @Field()
  username!: string;

  @Field()
  password!: string;
}

@ObjectType()
class LoginResult {
  @Field()
  username!: string;

  @Field()
  accessToken!: string;
}

@Resolver('Auth')
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => LoginResult)
  async login(
    @Args('credentials') credentials: LoginInput,
  ): Promise<LoginResult> {
    return this.authService.login(credentials.username, credentials.password);
  }
} 