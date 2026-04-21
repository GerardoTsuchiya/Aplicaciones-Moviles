# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

A GraphQL-based Todo/User application with a NestJS backend and React Native (Expo) frontend. University project for **Aplicaciones Móviles at UABC**.

---

## Structure

```
GraphQL/
  Backend/   # NestJS + GraphQL API (code-first)
  Frontend/  # Expo React Native app (has its own git repo inside)
  docs/superpowers/
    specs/   # Design specs
    plans/   # Implementation plans
```

> **Important:** `Frontend/` has its own embedded git repository. Commit frontend changes with:
> `git -C "path/to/GraphQL/Frontend" add <file> && git -C "path/to/GraphQL/Frontend" commit -m "..."`

---

## Backend

**Stack:** NestJS 11 · `@nestjs/graphql` (code-first) · Apollo Server 5 · Prisma 7 · MySQL (Docker)

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
DATABASE_URL="mysql://flaey:12345@localhost:3307/todo_db"
```

### Backend status

- `UsuarioService` — fully wired to Prisma (CRUD complete)
- `TodoService` — placeholder strings only, Prisma NOT wired yet
- `ValidationPipe` enabled globally in `main.ts`
- `UpdateUsuarioInput` correctly strips `id` before passing to Prisma `update()`
- `findOne` resolver is nullable (`{ nullable: true }`)

---

## Frontend

**Stack:** Expo 54 · React Native · TypeScript · TanStack Query v5

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

Physical devices cannot reach `localhost` — they need the LAN IP of the machine running the backend. The `.env` already has the IP set; update it if the network changes.

### Architecture

- `lib/api.ts` — `apiFetch` (REST) and `apiGraphqlFetch(query, variables?, token?)` (GraphQL)
- `lib/authContext.tsx` — `AuthContext` with `accessToken`, `refreshToken`, `setTokens`, `clearTokens` (tokens are in-memory only, not persisted)
- `lib/queryClient.ts` — shared TanStack Query client
- `features/<domain>/queries.ts` — hooks using `useQuery`/`useMutation`
- `features/<domain>/types.ts` — TypeScript interfaces

### Implemented screens

**HomeScreen** (`features/index/HomeScreen.tsx`)
- `FlatList` of users with avatar (first letter), name, email
- FAB (+) bottom-right opens `AddUserModal`
- Uses `isLoading` (not `isFetching`) for the loading guard

**AddUserModal** (`features/user/AddUserModal.tsx`)
- Animated bottom sheet (`Animated.spring`)
- Fields: Name (optional), Email (required)
- Calls `useCreateUser`, disables Guardar while `isPending`
- On success: closes modal, clears form, invalidates `['users']` query
- Shows server error (e.g. duplicate email) below the Email field

### Hooks (`features/user/queries.ts`)

- `useUsers()` — queries `usuarios { id email name createAt }`
- `useCreateUser()` — mutation `createUsuario(createUsuarioInput: { email, name })`

---

## GraphQL Operations

| Operation | Type | Backend status |
|---|---|---|
| `usuarios` | Query | ✅ Prisma wired |
| `usuario(id)` | Query | ✅ Prisma wired |
| `createUsuario` | Mutation | ✅ Prisma wired |
| `updateUsuario` | Mutation | ✅ Prisma wired |
| `removeUsuario` | Mutation | ✅ Prisma wired |
| `todos` | Query | ⚠️ Placeholder |
| `todo(id)` | Query | ⚠️ Placeholder |
| `createTodo` | Mutation | ⚠️ Placeholder |
| `updateTodo` | Mutation | ⚠️ Placeholder |
| `removeTodo` | Mutation | ⚠️ Placeholder |

---

## What's next (próxima clase)

The professor will implement **login with bcrypt + JWT** (access token + refresh token). The frontend is already prepared:
- `AuthContext` stores tokens — connect `setTokens` to the login response
- `apiGraphqlFetch` accepts a `token` parameter — pass `accessToken` from context for protected queries
- Navigation library not yet chosen — wait for professor's instructions before adding routing

---

## Conventions

- Field `createAt` (not `createdAt`) across Prisma schema, entities, and frontend types — keep consistent
- `Todo` uses a `uuid` string PK; `User` uses an `Int` autoincrement PK
- No test framework configured in Frontend — verification is manual via device/simulator
