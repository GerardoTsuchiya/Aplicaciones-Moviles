import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class CreateUsuarioInput {
    @Field()
    @IsEmail()
    email: string = '';

    @Field(() => String, { nullable: true})
    @IsOptional()
    @IsString()
    @MaxLength(50)
    name: string | null = null;
}