import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class CreateTodoInput {
  @Field()
  @IsString()
  titulo: string = '';

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion: string | null = null;

  @Field()
  @IsBoolean()
  completado: boolean = false;
}
