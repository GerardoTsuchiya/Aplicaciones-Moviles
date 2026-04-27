import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Usuario } from '../../usuario/entities/usuario.entity';

@ObjectType()
export class Todo {
  @Field(() => Int)
  id: number = 0;
  @Field(() => String)
  uuid: string = '';
  @Field(() => String)
  titulo: string = '';
  @Field(() => String)
  descripcion: string = '';
  @Field(() => Boolean)
  completada: boolean = false;
  @Field(() => Date)
  createdAt: Date = new Date();
  @Field(() => Usuario)
  usuario: Usuario = new Usuario();
}
