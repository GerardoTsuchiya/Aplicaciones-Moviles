import { InputType, Int, Field } from '@nestjs/graphql';
import { IsEmail, IsOptional, MaxLength } from 'class-validator';

@InputType()
export class CreateTodoInput {
  @Field()
  @IsEmail()
  email: string = '';

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(255)
  description?: string;
    @MaxLength(255)
  name: string  | null = null;
}
