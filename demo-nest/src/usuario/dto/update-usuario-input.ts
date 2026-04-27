import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { IsInt } from 'class-validator';
import { CreateUsuarioInput } from './create-usuario-input';

@InputType()
export class UpdateUsuarioInput extends PartialType (CreateUsuarioInput) {
    @Field(() => Int)
    @IsInt()
    id: number = 0;
}