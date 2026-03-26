# Demo-Back

Simple in-memory Todos REST API built with Express.js 5.x. Data resets on server restart.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev    # development with hot reload (nodemon)
npm start      # production (node index.js)
npm test       # run tests (jest + supertest)
```

Server runs on `http://localhost:6969`.

## Endpoints

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

Returns the todo with the given numeric ID. `404` if not found.

### POST /todo

Body (JSON):

```json
{ "title": "Buy milk" }
```

`title` is required and must be non-empty. Returns `201` with the created todo.

### PATCH /todo/:id

Body (JSON):

```json
{ "title": "Updated title" }
```

`title` is required and must be non-empty. Returns the updated todo. `404` if not found.

### DELETE /todo/:id

Deletes the todo and returns it. `404` if not found.
