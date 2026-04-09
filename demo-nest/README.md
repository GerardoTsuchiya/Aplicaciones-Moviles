# demo-nest

API GraphQL construida con **NestJS 11**, **Prisma 7** y **MySQL** en Docker. Proyecto universitario para la materia de Aplicaciones Móviles — UABC.

## Stack

| Herramienta | Rol |
|---|---|
| NestJS 11 | Framework backend |
| GraphQL + Apollo Server 5 | Protocolo de API (code-first) |
| Prisma 7 | ORM |
| MySQL 8.4 (Docker) | Base de datos |
| class-validator | Validación de DTOs |

## Entidades

- **Usuario** — `id`, `email`, `name`
- **Todo** — `id`, `titulo`, `descripcion`, `completado`

## Estructura

```
src/
  prisma/         # PrismaService (singleton global)
  usuario/        # dto/, entities/, service, resolver, module
  todo/           # dto/, entities/, service, resolver, module
  app.module.ts
prisma/
  schema.prisma
prisma.config.ts
docker-compose.yml
```

## Requisitos

- Node.js LTS
- Docker Desktop

## Cómo correr

```bash
# 1. Instalar dependencias
npm install

# 2. Crear .env en la raíz
echo 'DATABASE_URL="mysql://todo_user:1234@localhost:3306/todo_db"' > .env

# 3. Levantar base de datos
docker compose up -d

# 4. Generar cliente Prisma
npx prisma generate

# 5. Crear tablas en la BD
npx prisma db push

# 6. Iniciar en desarrollo
npm run start:dev
```

La API GraphQL queda disponible en `http://localhost:3000/graphql`.

## Ejemplo de consultas

```graphql
query {
  todos {
    id
    titulo
    completado
  }
}

mutation {
  createTodo(createTodoInput: { titulo: "Mi primer todo", completado: false }) {
    id
    titulo
  }
}
```
