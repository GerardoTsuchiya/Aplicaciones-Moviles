import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Todo {
  @Field(() => Int)
  id!: number;

  @Field()
  titulo!: string;

  @Field(() => String, { nullable: true })
  descripcion!: string | null;

  @Field()
  completado!: boolean;
}
