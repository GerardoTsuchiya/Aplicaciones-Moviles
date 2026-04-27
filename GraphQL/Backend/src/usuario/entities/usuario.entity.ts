import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Todo } from '../../todo/entities/todo.entity';

@ObjectType()
export class Usuario {
  @Field(() => Int)
  id: number = 0;

  @Field(() => String, { nullable: true, description: 'The name of the user' })
  name: string | null = null;

  @Field(() => String)
  email: string = '';

  @Field(() => Date)
  createAt: Date = new Date();

  @Field(() => [Todo], { nullable: true, description: 'List of todos associated with the user' })
  todos?: Todo[];
}
