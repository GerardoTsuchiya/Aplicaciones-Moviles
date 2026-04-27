# Auth con JWT para GraphQL — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar registro con contraseña, login con bcrypt + JWT (15 min), y un Guard de GraphQL para proteger operaciones autenticadas en el backend NestJS.

**Architecture:** Se crea un módulo `auth` independiente que contiene toda la lógica de autenticación. `UsuarioModule` exporta su servicio para que `AuthModule` pueda validar credenciales. El guard personalizado `GqlAuthGuard` adapta el flujo estándar de Passport para que funcione con el contexto de GraphQL (que difiere del contexto HTTP).

**Tech Stack:** NestJS 11 · `@nestjs/graphql` code-first · `@nestjs/jwt` · `passport-jwt` · `bcrypt` · `class-validator`

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `prisma/schema.prisma` | Modificar | Agregar campo `password` al modelo `User` |
| `src/usuario/dto/create-usuario.input.ts` | Modificar | Agregar campo `password` con validadores |
| `src/usuario/usuario.service.ts` | Modificar | Hash de contraseña al crear, nuevo método `findByEmail` |
| `src/usuario/usuario.module.ts` | Modificar | Exportar `UsuarioService` para que `AuthModule` lo use |
| `src/auth/dto/login.input.ts` | Crear | Input GraphQL para la mutación `login` |
| `src/auth/entities/auth-response.entity.ts` | Crear | Tipo de retorno GraphQL con `accessToken` |
| `src/auth/auth.service.ts` | Crear | Validar credenciales y generar JWT |
| `src/auth/jwt.strategy.ts` | Crear | Passport strategy: extrae y verifica el JWT del header |
| `src/auth/gql-auth.guard.ts` | Crear | Guard que adapta Passport JWT al contexto GraphQL |
| `src/auth/auth.resolver.ts` | Crear | Mutación `login` de GraphQL |
| `src/auth/auth.module.ts` | Crear | Cablear todo el módulo auth |
| `src/app.module.ts` | Modificar | Registrar `AuthModule` |

---

## Tarea 1: Instalar dependencias que faltan

**Concepto:** `bcrypt` sirve para hashear contraseñas de forma segura (usa un algoritmo deliberadamente lento y con "salt" para dificultar ataques de fuerza bruta). `passport-jwt` es la estrategia que lee el token JWT del header `Authorization`. `@nestjs/jwt` es el módulo de NestJS que envuelve la librería `jsonwebtoken` para firmar y verificar tokens.

**Archivos:**
- Ninguno nuevo — solo `package.json` se actualiza automáticamente

- [ ] **Instalar los tres paquetes**

```bash
cd Backend
npm install bcrypt passport-jwt @nestjs/jwt
```

Salida esperada: `added N packages` sin errores.

> **Nota:** Los tipos `@types/bcrypt` y `@types/passport-jwt` ya están en `devDependencies` — por eso TypeScript los reconocerá sin instalarlos de nuevo.

- [ ] **Commit**

```bash
rtk git add package.json package-lock.json && rtk git commit -m "chore: install bcrypt, passport-jwt, @nestjs/jwt"
```

---

## Tarea 2: Agregar `password` al modelo de Prisma

**Concepto:** La base de datos necesita guardar la contraseña *hasheada* del usuario. Se agrega como campo requerido (`String`, sin `?`). **Nunca** se almacena la contraseña en texto plano.

**Archivos:**
- Modificar: `prisma/schema.prisma`

- [ ] **Agregar el campo `password` al modelo `User`**

Archivo: `prisma/schema.prisma`

```prisma
model User { 
  id       Int      @id @default(autoincrement()) 
  email    String   @unique
  name     String?
  password String                          // <-- agregar esta línea
  createAt DateTime @default(now()) @map("create_at")
  todos    Todo[]

  @@map("users")
}
```

- [ ] **Sincronizar el schema con la base de datos y regenerar el cliente de Prisma**

```bash
npx prisma db push
npx prisma generate
```

`db push` aplica los cambios al esquema de MySQL sin crear archivos de migración (útil en desarrollo). `generate` regenera el cliente TypeScript en `src/generated/prisma/` para que el tipo `User` incluya el campo `password`.

Salida esperada de `db push`: `Your database is now in sync with your Prisma schema.`

> **Importante:** Si ya hay filas en la tabla `users`, `db push` fallará porque `password` es requerido y no tiene valor por defecto. Solución: agregar `@default("")` temporalmente, hacer push, quitar el default.

- [ ] **Commit**

```bash
rtk git add prisma/schema.prisma && rtk git commit -m "feat: add password field to User model"
```

---

## Tarea 3: Actualizar `CreateUsuarioInput` con validación de contraseña

**Concepto:** `class-validator` permite agregar decoradores sobre las propiedades del DTO para validar los datos *antes* de que lleguen al servicio. `@IsString()` verifica el tipo; `@MinLength(6)` rechaza contraseñas muy cortas. `ValidationPipe` (ya activo globalmente en `main.ts`) ejecuta estas validaciones automáticamente y devuelve un error 400 si fallan.

**Archivos:**
- Modificar: `src/usuario/dto/create-usuario.input.ts`

- [ ] **Agregar el campo `password` con validadores**

```typescript
import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class CreateUsuarioInput {
  @Field()
  @IsEmail()
  email: string = '';

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name: string | null = null;

  @Field()
  @IsString()
  @MinLength(6)
  password: string = '';
}
```

- [ ] **Commit**

```bash
rtk git add src/usuario/dto/create-usuario.input.ts && rtk git commit -m "feat: add password field with validation to CreateUsuarioInput"
```

---

## Tarea 4: Actualizar `UsuarioService` — hash de contraseña y `findByEmail`

**Concepto:**
- El método `create()` ahora debe hashear la contraseña *antes* de guardarla. `bcrypt.hash(password, 10)` genera el hash con 10 rondas de "salting" (a mayor número, más seguro pero más lento; 10 es el estándar).
- Se agrega `findByEmail()` porque el servicio de auth necesita buscar un usuario por email para validar el login.
- Se exporta `UsuarioService` desde `UsuarioModule` para que `AuthModule` pueda inyectarlo.

**Archivos:**
- Modificar: `src/usuario/usuario.service.ts`
- Modificar: `src/usuario/usuario.module.ts`

- [ ] **Actualizar `UsuarioService`**

```typescript
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUsuarioInput } from './dto/create-usuario.input';
import { UpdateUsuarioInput } from './dto/update-usuario.input';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsuarioService {

  constructor(private readonly prismaService: PrismaService) {}

  async create(createUsuarioInput: CreateUsuarioInput) {
    const hashed = await bcrypt.hash(createUsuarioInput.password, 10);
    return this.prismaService.user.create({
      data: { ...createUsuarioInput, password: hashed },
    });
  }

  findAll() {
    return this.prismaService.user.findMany();
  }

  findOne(id: number) {
    return this.prismaService.user.findUnique({ where: { id } });
  }

  // Nuevo: lo usa AuthService para validar credenciales en el login
  findByEmail(email: string) {
    return this.prismaService.user.findUnique({ where: { email } });
  }

  update(id: number, updateUsuarioInput: UpdateUsuarioInput) {
    const { id: _, ...data } = updateUsuarioInput;
    return this.prismaService.user.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prismaService.user.delete({ where: { id } });
  }
}
```

- [ ] **Exportar `UsuarioService` desde `UsuarioModule`**

```typescript
import { Module } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { UsuarioResolver } from './usuario.resolver';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [UsuarioResolver, UsuarioService, PrismaService],
  exports: [UsuarioService],   // <-- exportar para que AuthModule lo use
})
export class UsuarioModule {}
```

- [ ] **Commit**

```bash
rtk git add src/usuario/usuario.service.ts src/usuario/usuario.module.ts && rtk git commit -m "feat: hash password on create, add findByEmail, export UsuarioService"
```

---

## Tarea 5: Crear el DTO de login y la entidad de respuesta auth

**Concepto:**
- `LoginInput` es el `@InputType()` que define los argumentos de la mutación `login` en GraphQL. Sigue la misma estructura que los otros DTOs del proyecto.
- `AuthResponse` es el `@ObjectType()` que define lo que devuelve `login`: solo el `accessToken`. No se expone el usuario completo ni otros datos sensibles.

**Archivos:**
- Crear: `src/auth/dto/login.input.ts`
- Crear: `src/auth/entities/auth-response.entity.ts`

- [ ] **Crear `src/auth/dto/login.input.ts`**

```typescript
import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email: string = '';

  @Field()
  @IsString()
  @MinLength(6)
  password: string = '';
}
```

- [ ] **Crear `src/auth/entities/auth-response.entity.ts`**

```typescript
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string = '';
}
```

- [ ] **Commit**

```bash
rtk git add src/auth/dto/login.input.ts src/auth/entities/auth-response.entity.ts && rtk git commit -m "feat: add LoginInput DTO and AuthResponse entity"
```

---

## Tarea 6: Crear `AuthService`

**Concepto:**
- `validateUser()`: busca al usuario por email y compara la contraseña ingresada con el hash guardado usando `bcrypt.compare()`. Si no coincide, retorna `null`.
- `login()`: recibe el usuario ya validado y firma un JWT con `JwtService.sign()`. El payload contiene `sub` (ID del usuario, convención JWT) y `email`. El token expira en 15 minutos (configurado en el módulo, no aquí).

**Archivos:**
- Crear: `src/auth/auth.service.ts`

- [ ] **Crear `src/auth/auth.service.ts`**

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuarioService } from '../usuario/usuario.service';
import { LoginInput } from './dto/login.input';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService,
  ) {}

  // Verifica email + contraseña. Retorna el usuario sin password, o null si falla.
  async validateUser(email: string, password: string) {
    const user = await this.usuarioService.findByEmail(email);
    if (!user) return null;

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return null;

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginInput: LoginInput) {
    const user = await this.validateUser(loginInput.email, loginInput.password);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
```

- [ ] **Commit**

```bash
rtk git add src/auth/auth.service.ts && rtk git commit -m "feat: add AuthService with validateUser and login"
```

---

## Tarea 7: Crear `JwtStrategy`

**Concepto:**
Passport usa el patrón "estrategia" para desacoplar la lógica de autenticación. `JwtStrategy` le dice a Passport:
1. *Dónde* encontrar el token — aquí en el header `Authorization: Bearer <token>`.
2. *Con qué secreto* verificarlo — `JWT_SECRET` del `.env`.
3. *Qué hacer con el payload* decodificado — el método `validate()` lo transforma y lo pone en `req.user`.

El resultado de `validate()` es lo que queda disponible como `req.user` en los resolvers cuando el guard pasa.

**Archivos:**
- Crear: `src/auth/jwt.strategy.ts`

- [ ] **Crear `src/auth/jwt.strategy.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extrae el token del header: "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Rechaza tokens expirados (false = no ignorar expiración)
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'fallback-secret',
    });
  }

  // Este método recibe el payload ya decodificado y verificado.
  // Lo que retorna aquí queda en req.user.
  validate(payload: { sub: number; email: string }) {
    return { id: payload.sub, email: payload.email };
  }
}
```

- [ ] **Agregar `JWT_SECRET` al `.env` si no existe**

```env
DATABASE_URL="mysql://flaey:12345@localhost:3307/todo_db"
JWT_SECRET="una-clave-secreta-larga-y-aleatoria-aqui"
```

- [ ] **Commit**

```bash
rtk git add src/auth/jwt.strategy.ts && rtk git commit -m "feat: add JwtStrategy for passport-jwt"
```

---

## Tarea 8: Crear `GqlAuthGuard`

**Concepto:**
`AuthGuard('jwt')` de NestJS/Passport funciona bien para REST, porque extrae el `request` del contexto HTTP. En GraphQL, el contexto de ejecución es diferente: NestJS expone un `ExecutionContext` que puede ser HTTP o GraphQL.

`GqlAuthGuard` extiende `AuthGuard('jwt')` y sobreescribe `getRequest()` para usar `GqlExecutionContext` en su lugar. Así Passport puede leer el header `Authorization` de la request GraphQL.

**Archivos:**
- Crear: `src/auth/gql-auth.guard.ts`

- [ ] **Crear `src/auth/gql-auth.guard.ts`**

```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  // Sobrescribimos getRequest para que Passport lea la request
  // del contexto GraphQL en lugar del contexto HTTP.
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
```

- [ ] **Commit**

```bash
rtk git add src/auth/gql-auth.guard.ts && rtk git commit -m "feat: add GqlAuthGuard for GraphQL context"
```

---

## Tarea 9: Crear `AuthResolver`

**Concepto:**
El resolver expone la mutación `login` al schema GraphQL. Recibe un `LoginInput`, delega la lógica al `AuthService`, y retorna un `AuthResponse` con el token. El resolver **no valida credenciales** — esa lógica está en el servicio.

**Archivos:**
- Crear: `src/auth/auth.resolver.ts`

- [ ] **Crear `src/auth/auth.resolver.ts`**

```typescript
import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { AuthResponse } from './entities/auth-response.entity';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResponse)
  login(@Args('loginInput') loginInput: LoginInput) {
    return this.authService.login(loginInput);
  }
}
```

- [ ] **Commit**

```bash
rtk git add src/auth/auth.resolver.ts && rtk git commit -m "feat: add AuthResolver with login mutation"
```

---

## Tarea 10: Crear `AuthModule` y registrar en `AppModule`

**Concepto:**
`AuthModule` cablea todos los piezas del módulo. Los puntos clave:
- `JwtModule.register()` configura el secreto y la expiración del token. `expiresIn: '15m'` significa que el token es válido por 15 minutos.
- `PassportModule.register({ defaultStrategy: 'jwt' })` le dice a NestJS que use JWT como estrategia default cuando se usa `@UseGuards(GqlAuthGuard)`.
- Se importa `UsuarioModule` (no solo el servicio) para que su `UsuarioService` exportado esté disponible vía inyección de dependencias.
- `AppModule` solo necesita agregar `AuthModule` a sus imports — el módulo exporta el guard para usarlo en cualquier parte.

**Archivos:**
- Crear: `src/auth/auth.module.ts`
- Modificar: `src/app.module.ts`

- [ ] **Crear `src/auth/auth.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtStrategy } from './jwt.strategy';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  imports: [
    UsuarioModule,                          // provee UsuarioService (que está exportado)
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'fallback-secret',
      signOptions: { expiresIn: '15m' },    // token expira en 15 minutos
    }),
  ],
  providers: [AuthResolver, AuthService, JwtStrategy],
})
export class AuthModule {}
```

- [ ] **Registrar `AuthModule` en `AppModule`**

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TodoModule } from './todo/todo.module';
import { UsuarioModule } from './usuario/usuario.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: true,
    }),
    TodoModule,
    UsuarioModule,
    AuthModule,    // <-- agregar
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

- [ ] **Commit**

```bash
rtk git add src/auth/auth.module.ts src/app.module.ts && rtk git commit -m "feat: add AuthModule and register in AppModule"
```

---

## Tarea 11: Proteger una mutación con el Guard

**Concepto:**
`@UseGuards(GqlAuthGuard)` sobre un resolver (o un método del resolver) activa el flujo:
1. La request llega con header `Authorization: Bearer <token>`.
2. `GqlAuthGuard.getRequest()` extrae la request del contexto GraphQL.
3. Passport busca `JwtStrategy`, valida el token con `JWT_SECRET`.
4. Si el token es válido, `JwtStrategy.validate()` retorna `{ id, email }` que queda en `req.user`.
5. Si el token es inválido o falta, el guard lanza `UnauthorizedException` (401).

Para acceder al usuario autenticado en el resolver, se usa `@Context()` de GraphQL.

**Archivos:**
- Modificar: `src/usuario/usuario.resolver.ts`

- [ ] **Proteger `removeUsuario` como ejemplo**

```typescript
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

  // Protegido: requiere token JWT válido
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Usuario)
  removeUsuario(
    @Args('id', { type: () => Int }) id: number,
    @Context() context: any,   // context.req.user = { id, email } del token
  ) {
    return this.usuarioService.remove(id);
  }
}
```

- [ ] **Verificar que el servidor arranca sin errores**

```bash
npm run start:dev
```

Salida esperada: `[NestApplication] Nest application successfully started`

- [ ] **Probar en el Playground (`http://localhost:3000/graphql`)**

Flujo de prueba:
1. Crear usuario:
```graphql
mutation {
  createUsuario(createUsuarioInput: {
    email: "test@test.com"
    name: "Test User"
    password: "123456"
  }) {
    id email name
  }
}
```

2. Login:
```graphql
mutation {
  login(loginInput: { email: "test@test.com", password: "123456" }) {
    accessToken
  }
}
```

3. Copiar el `accessToken`. En el Playground, ir a **HTTP HEADERS** (abajo) y poner:
```json
{ "Authorization": "Bearer <pegar token aquí>" }
```

4. Llamar `removeUsuario` — debe funcionar solo con el token.

5. Llamar `removeUsuario` sin el header — debe retornar error `401 Unauthorized`.

- [ ] **Commit final**

```bash
rtk git add src/usuario/usuario.resolver.ts && rtk git commit -m "feat: protect removeUsuario with GqlAuthGuard"
```

---

## Resumen del flujo completo

```
Cliente                          Backend
  |                                 |
  |-- mutation login(email, pass) -->|
  |                           AuthResolver.login()
  |                           AuthService.validateUser()
  |                             bcrypt.compare(pass, hash)  ✓
  |                           JwtService.sign({ sub, email })
  |<-- { accessToken: "eyJ..." } ---|
  |                                 |
  |-- mutation removeUsuario ------->|
  |  Header: Authorization: Bearer eyJ...
  |                           GqlAuthGuard.canActivate()
  |                           JwtStrategy.validate(payload)
  |                           req.user = { id, email }   ✓
  |                           UsuarioResolver.removeUsuario()
  |<-- { id, email, name, ... } ----|
```
