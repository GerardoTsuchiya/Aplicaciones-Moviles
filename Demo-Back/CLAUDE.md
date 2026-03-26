# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install      # install dependencies
npm run dev      # start with hot reload (nodemon)
npm start        # start without hot reload (node index.js)
npm test         # run tests (jest + supertest)
```

Server runs on `http://localhost:6969`.

## Project

Plain Express.js 5.x backend. No TypeScript, no build step, no framework — just `index.js` as the entry point. CORS is enabled globally via the `cors` package. Data is stored in-memory and resets on server restart.

The parent directory (`../`) contains a separate NestJS + Prisma project (`task-manager-api`). This `Demo-Back` project is independent from it.

## Structure

```
Demo-Back/
  index.js          # entire application — Express setup, in-memory data, all routes
  index.test.js     # Jest + supertest tests
  package.json
```

## Testing

Tests use **Jest** and **supertest**. The app is exported via `module.exports = app` so supertest can import it without starting the server (`require.main === module` guard around `app.listen`).

```bash
npm test
```

## In-Memory Data

```js
let todos = [
  { id: 1, title: "Comprar leche", completed: false },
  { id: 2, title: "Hacer ejercicio", completed: true },
];
```

New todos are assigned `id = last.id + 1`. No database.

## API Endpoints

All responses follow the shape `{ status, message, data }`.

| Method | Route      | Description        |
|--------|------------|--------------------|
| GET    | /todo      | List all todos     |
| GET    | /todo/:id  | Get a todo by ID   |
| POST   | /todo      | Create a todo      |
| PATCH  | /todo/:id  | Update a todo      |
| DELETE | /todo/:id  | Delete a todo      |

### GET /todo

Returns all todos.

```json
{ "status": 200, "message": "Todos los elementos", "data": [...] }
```

### GET /todo/:id

Returns the todo with the given numeric ID.

- `404` if not found: `{ "status": 404, "message": "Todo not found" }`

### POST /todo

Body (JSON): `{ "title": "string" }`

- `title` is required and must be non-empty (whitespace-only rejected).
- Created todo has `completed: false`.
- `id` is assigned as `last.id + 1`.
- Returns `201` on success.
- Returns `400` if body is missing or title is invalid.

### PATCH /todo/:id

Body (JSON): `{ "title": "string" }`

- Updates the `title` of an existing todo.
- `title` is required and must be non-empty (whitespace-only rejected).
- `completed` is not modified by this endpoint.
- Returns `200` with the updated todo.
- Returns `404` if the todo does not exist.
- Returns `400` if title is missing or empty.

### DELETE /todo/:id

- Removes the todo from the in-memory array.
- Returns `200` with the deleted todo.
- Returns `404` if the todo does not exist.
