import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioInput } from './dto/create-usuario.input';
import { UpdateUsuarioInput } from './dto/update-usuario.input';
import { GqlAuthGuard } from '../auth/gql-auth.guard';

@Resolver(() => Usuario)
export class UsuarioResolver {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Mutation(() => Usuario)
  createUsuario(@Args('createUsuarioInput') createUsuarioInput: CreateUsuarioInput) {
    return this.usuarioService.create(createUsuarioInput);
  }

  @Query(() => [Usuario], { name: 'usuarios' })
  findAll() {
    return this.usuarioService.findAll();
  }

  @Query(() => Usuario, { name: 'usuario', nullable: true })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.usuarioService.findOne(id);
  }

  @Mutation(() => Usuario)
  updateUsuario(@Args('updateUsuarioInput') updateUsuarioInput: UpdateUsuarioInput) {
    return this.usuarioService.update(updateUsuarioInput.id, updateUsuarioInput);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Usuario)
  removeUsuario(
    @Args('id', { type: () => Int }) id: number,
    @Context() context: any,
  ) {
    return this.usuarioService.remove(id);
  }
}
