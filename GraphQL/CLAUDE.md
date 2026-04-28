# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

A GraphQL-based Todo/User application with a NestJS backend and React Native (Expo) frontend. University project for **Aplicaciones Móviles at UABC**.

---

## Git

This project lives inside the monorepo `GerardoTsuchiya/Aplicaciones-Moviles` on GitHub as the `GraphQL/` folder. All commits go through the parent repo at `Aplicaciones_Moviles/`. Neither `Backend/` nor `Frontend/` have their own `.git` folders.

```bash
# Commit from the parent repo root
git -C "/c/Users/slife/OneDrive/Documentos/UABC/Aplicaciones_Moviles" add GraphQL/...
git -C "/c/Users/slife/OneDrive/Documentos/UABC/Aplicaciones_Moviles" commit -m "..."
git -C "/c/Users/slife/OneDrive/Documentos/UABC/Aplicaciones_Moviles" push origin master
```

---

## Structure

```
GraphQL/
  Backend/   # NestJS + GraphQL API (code-first)
  Frontend/  # Expo React Native app
  docs/superpowers/
    specs/   # Design specs
    plans/   # Implementation plans
```

---

## Backend

**Stack:** NestJS 11 · `@nestjs/graphql` (code-first) · Apollo Server 5 · Prisma 7 · MySQL (Docker) · bcrypt · `@nestjs/jwt` · passport-jwt · class-validator

### Startup order (always do this first)

```bash
# 1. Start MySQL
docker compose up -d          # from Backend/

# 2. Start NestJS
npm run start:dev             # from Backend/
```

### Commands (run from `Backend/`)

```bash
npm run start:dev        # start with hot reload (port 3000)
npm run build            # compile TypeScript
npm run lint             # ESLint with auto-fix

npx prisma db push       # sync schema to DB (no migration)
npx prisma migrate dev   # create and apply migration
npx prisma generate      # regenerate Prisma client
npx prisma studio        # open visual DB browser

docker compose up -d     # start MySQL on port 3307
```

### Database

- **Provider:** MySQL via Docker (`docker-compose.yml`); port `3307:3306`
- **ORM:** Prisma 7 — datasource URL lives in `prisma.config.ts`, NOT in `schema.prisma`
- **Generated client** outputs to `src/generated/prisma/` — do not edit these files
- `PrismaService` uses `@prisma/adapter-mariadb` and converts `mysql://` to `mariadb://` internally

### GraphQL Architecture (code-first)

Each feature follows this pattern:
- **Entity** (`entities/*.entity.ts`) — `@ObjectType()` classes defining GraphQL schema types
- **Input** (`dto/*.input.ts`) — `@InputType()` classes for mutation arguments
- **Resolver** (`*.resolver.ts`) — handles queries/mutations; no business logic
- **Service** (`*.service.ts`) — all Prisma calls and business logic
- **Module** (`*.module.ts`) — wires resolver, service, and imports

`autoSchemaFile: true` in `AppModule` generates the SDL schema in-memory. Playground at `http://localhost:3000/graphql`.

### Current Schema

```prisma
model User {
  id       Int      @id @default(autoincrement())
  email    String   @unique
  name     String?
  password String
  createAt DateTime @default(now()) @map("create_at")
  todos    Todo[]
  @@map("users")
}

model Todo {
  uuid        String   @id @default(uuid())
  userId      Int
  titulo      String
  descripcion String?
  completada  Boolean  @default(false)
  createAt    DateTime @default(now())
  usuario     User     @relation(fields: [userId], references: [id])
}
```

### Environment Variables (`Backend/.env`)

```env
DATABASE_URL="mysql://root:12345@localhost:3307/todo_db"
JWT_SECRET="uabc-aplicaciones-moviles-jwt-secret-2026"
```

### Backend status

- `UsuarioService` — fully wired to Prisma (CRUD complete); hashes password with bcrypt on `create()`; has `findByEmail()` for auth
- `UsuarioModule` — exports `UsuarioService` so `AuthModule` can inject it
- `TodoService` — placeholder strings only, Prisma NOT wired yet
- `ValidationPipe` enabled globally in `main.ts`
- `dotenv/config` imported at top of `main.ts` — ensures `JWT_SECRET` is available at module init time
- `auth/` module fully implemented:
  - `LoginInput` DTO with `@IsEmail()` + `@MinLength(6)` on password
  - `AuthResponse` entity with `accessToken` + `refreshToken` fields
  - `AuthService` — `validateUser()` with `bcrypt.compare()`; `login()` and `refresh()` both call `signTokens()`; `signTokens()` signs two JWTs with `type: 'access'` (15m) and `type: 'refresh'` (7d)
  - `JwtStrategy` — reads `Bearer` token from `Authorization` header, `validate()` returns `{ id, email }`
  - `GqlAuthGuard` — extends `AuthGuard('jwt')`, overrides `getRequest()` for GraphQL context
  - `AuthModule` — imports `UsuarioModule`, `PassportModule`, `JwtModule` (secret from env, default `expiresIn: '15m'`)
- `createUsuario` and `removeUsuario` mutations are protected with `@UseGuards(GqlAuthGuard)`

### Auth notes

- `password` field is NOT exposed in `UsuarioEntity` (no `@Field()`) — never returned by GraphQL
- JWT payload: `{ sub: user.id, email: user.email, type: 'access'|'refresh' }` — `sub` maps to `id` in `JwtStrategy.validate()`
- `refresh()` in `AuthService` rejects tokens where `type !== 'refresh'` to prevent access tokens being used as refresh tokens
- `GqlAuthGuard` is necessary because `AuthGuard('jwt')` reads HTTP context by default; GraphQL needs `GqlExecutionContext.create(context).getContext().req`

---

## Frontend

**Stack:** Expo 54 · React Native · TypeScript · TanStack Query v5 · expo-secure-store

### Commands (run from `Frontend/`)

```bash
npm start            # Expo dev server
npm run android      # Android emulator
npm run ios          # iOS simulator
```

### Environment Variables (`Frontend/.env`)

```env
EXPO_PUBLIC_API_URL="http://<YOUR_LAN_IP>:3000/graphql"
```

Physical devices cannot reach `localhost` — they need the LAN IP of the machine running the backend. Update this if the network changes. **Restart the Expo dev server after changing `.env`** — `EXPO_PUBLIC_*` variables are only read at startup.

### Architecture

- `lib/api.ts` — `apiFetch` (REST) and `apiGraphqlFetch(query, variables?, token?, authOptions?)` (GraphQL). `AuthOptions` enables auto-refresh: on `Unauthorized` error, calls `refreshToken` mutation and retries once. Backward compatible — existing calls without `authOptions` work unchanged.
- `lib/authContext.tsx` — `AuthContext` with `accessToken`, `refreshToken`, `isLoading`, `setTokens`, `clearTokens`. Reads both tokens from `expo-secure-store` on mount. `setTokens` / `clearTokens` update state AND SecureStore. `isLoading` is `true` while reading SecureStore to prevent LoginScreen flash.
- `lib/queryClient.ts` — shared TanStack Query client
- `features/<domain>/queries.ts` — hooks using `useQuery`/`useMutation`
- `features/<domain>/types.ts` — TypeScript interfaces

### Implemented screens

**App.tsx** — conditional rendering via `AppContent` component (child of `AuthProvider`):
- `isLoading` → `<ActivityIndicator>`
- `!accessToken` → `<LoginScreen>`
- authenticated → `<HomeScreen>`

**LoginScreen** (`features/auth/LoginScreen.tsx`)
- Email + password form
- Calls `useLogin`, disables button while `isPending`
- On success: `setTokens(access, refresh)` → App re-renders → HomeScreen
- Shows server error below password field

**HomeScreen** (`features/index/HomeScreen.tsx`)
- `FlatList` of users with avatar (first letter), name, email
- FAB (+) bottom-right opens `AddUserModal`

**AddUserModal** (`features/user/AddUserModal.tsx`)
- Animated bottom sheet (`Animated.spring`)
- Fields: Name (optional), Email (required), Password (required, min 6 chars)
- Calls `useCreateUser` (protected — requires JWT), disables Guardar while `isPending`
- On success: closes modal, clears form, invalidates `['users']` query
- Shows validation/server error below the Password field

### Hooks

**`features/auth/queries.ts`**
- `useLogin()` — mutation `login(loginInput: { email, password })` → calls `setTokens` on success

**`features/user/queries.ts`**
- `useUsers()` — queries `usuarios { id email name createAt }` (public)
- `useCreateUser()` — mutation `createUsuario(createUsuarioInput: { email, name?, password })` — passes `accessToken` + `authOptions` for auto-refresh (protected)

---

## GraphQL Operations

| Operation | Type | Auth | Backend status |
|---|---|---|---|
| `usuarios` | Query | ❌ | ✅ Prisma wired |
| `usuario(id)` | Query | ❌ | ✅ Prisma wired |
| `createUsuario` | Mutation | ✅ JWT | ✅ Prisma wired |
| `updateUsuario` | Mutation | ❌ | ✅ Prisma wired |
| `removeUsuario` | Mutation | ✅ JWT | ✅ Prisma wired |
| `login` | Mutation | ❌ | ✅ returns `accessToken` + `refreshToken` |
| `refreshToken(token)` | Mutation | ❌ | ✅ verifies refresh JWT, returns new pair |
| `todos` | Query | ❌ | ⚠️ Placeholder |
| `todo(id)` | Query | ❌ | ⚠️ Placeholder |
| `createTodo` | Mutation | ❌ | ⚠️ Placeholder |
| `updateTodo` | Mutation | ❌ | ⚠️ Placeholder |
| `removeTodo` | Mutation | ❌ | ⚠️ Placeholder |

---

## What's next

### Navigation library
Not yet chosen — wait for professor's instructions before adding React Navigation or Expo Router.

### Logout button
No logout button in the UI yet. Can be added with a single call to `clearTokens()` from `useAuth()` — it clears state and deletes both keys from SecureStore.

### Todo module
`TodoService` still returns placeholder strings. Needs to be wired to Prisma.

---

## Conventions

- Field `createAt` (not `createdAt`) across Prisma schema, entities, and frontend types — keep consistent
- `Todo` uses a `uuid` string PK; `User` uses an `Int` autoincrement PK
- No test framework configured in Frontend — verification is manual via device/simulator
- Never expose `password` in GraphQL — `UsuarioEntity` intentionally has no `@Field()` for password
