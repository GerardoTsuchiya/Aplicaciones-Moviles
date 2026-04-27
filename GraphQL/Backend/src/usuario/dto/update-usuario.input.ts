import { IsInt } from 'class-validator';
import { CreateUsuarioInput } from './create-usuario.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateUsuarioInput extends PartialType(CreateUsuarioInput) {
  @Field(() => Int)
  @IsInt()
  id: number = 0;
}
