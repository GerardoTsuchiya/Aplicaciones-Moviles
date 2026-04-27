import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class CreateUsuarioInput {
  @Field()
  @IsEmail()
  email: string = '';

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name: string | null = null;

  @Field()
  @IsString()
  @MinLength(6)
  password: string = '';
}
