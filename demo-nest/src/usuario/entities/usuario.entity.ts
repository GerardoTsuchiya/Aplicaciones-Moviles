import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Usuario {
  @Field(() => Int)
  id!: number;

  @Field()
  email!: string;

  @Field(() => String, { nullable: true })
  name!: string | null;
}
