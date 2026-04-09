# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start:dev       # start with hot reload (use this for development)
npm run build           # compile TypeScript to dist/
npm run start:prod      # run compiled build
npm run test            # run all tests
npm run test:watch      # run tests in watch mode
npm run test -- --testPathPattern=auth  # run a single test file by name
npm run lint            # run ESLint with auto-fix
```

## TypeScript Configuration

The project uses `"module": "CommonJS"` and `"moduleResolution": "node"` — **do not change these to ESNext/bundler**, even if Prisma docs suggest it. NestJS compiles and runs TypeScript directly via Node.js (not a bundler), so CommonJS is required.

## Architecture

This is a NestJS 11 REST API. Each feature lives in its own module folder under `src/` with this structure:

```
src/
  <feature>/
    dto/           # request body shapes, validated with class-validator
    <feature>.controller.ts   # HTTP layer only, no business logic
    <feature>.service.ts      # all business logic and Prisma calls
    <feature>.module.ts       # wires controller + service, declares exports
  prisma/
    prisma.service.ts         # singleton PrismaClient wrapper
    prisma.module.ts          # exported as global module
  app.module.ts
  main.ts
```

## Key Libraries

| Package | Purpose |
|---|---|
| `@nestjs/passport` + `passport-jwt` | JWT authentication strategy |
| `@nestjs/jwt` | JWT signing and verification |
| `bcrypt` | Password hashing (10 rounds) |
| `@prisma/client` | Database ORM |
| `class-validator` + `class-transformer` | DTO validation (enabled globally via `ValidationPipe`) |

## Prisma

Prisma 7 uses `prisma.config.ts` (not `schema.prisma`) for the datasource URL. The `datasource` block in `schema.prisma` has **no `url` field** — this is intentional.

```bash
npx prisma db push      # push schema changes to database
npx prisma generate     # regenerate client after schema changes
npx prisma studio       # visual DB browser
```

## Environment Variables

`.env` must contain:
```
DATABASE_URL="postgresql://..."   # Supabase Session Pooler URL (not Direct)
JWT_SECRET="..."
```

## Conventions

- Use NestJS HTTP exceptions (`NotFoundException`, `ConflictException`, etc.) — never throw raw errors
- Never return the `password` field — always destructure it out before returning a user
- JWT payload shape: `{ sub: user.id, email: user.email }`, expiry: `7d`
- Protected routes use `@UseGuards(JwtAuthGuard)`
