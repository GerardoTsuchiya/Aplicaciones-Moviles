# Design: Edit and Delete Todo Endpoints

**Date:** 2026-03-26
**Project:** Demo-Back (Express.js in-memory todos API)

## Summary

Add two new endpoints to `index.js`: `PATCH /todo/:id` to update a todo's title, and `DELETE /todo/:id` to remove a todo. Also remove the existing dead code in `POST /todo` (lines 51–53).

## Endpoints

### PATCH /todo/:id

- **Purpose:** Update the `title` of an existing todo.
- **Body:** `{ "title": "nuevo título" }`
- **Validation:** `title` must be present and non-empty (whitespace-only rejected). The title is trimmed before saving, consistent with `POST /todo`.
- **Ignored fields:** Any fields other than `title` in the request body are silently ignored.
- **Errors:**
  - `404` if ID not found: `{ status: 404, message: "Todo not found" }`. A non-numeric `:id` will not match any element and also returns `404`.
  - `400` if title is missing or blank: `{ status: 400, message: "Title is required" }`
- **Success:** `200` with the updated todo: `{ status: 200, message: "Todo updated", data: <todo> }`
- **Mutation:** Updates the `title` field in-place on the array element.

### DELETE /todo/:id

- **Purpose:** Remove a todo by ID.
- **Errors:**
  - `404` if ID not found: `{ status: 404, message: "Todo not found" }`. A non-numeric `:id` will not match any element and also returns `404`.
- **Success:** `200` with the deleted todo: `{ status: 200, message: "Todo deleted", data: <todo> }`
- **Mutation:** Removes the element from the array using `splice`. Note: since ID assignment in `POST /todo` uses `last.id + 1`, IDs can be reused after deletion — this is expected behavior in this in-memory implementation.

## Dead Code Removal

The `POST /todo` handler has unreachable code at lines 51–53 (a duplicate validation block after the `try/catch` that always returns). This will be removed as part of this change.

## Response Shape

All responses follow the existing convention: `{ status, message, data }`.

## Files Changed

- `index.js` — add `PATCH /todo/:id`, add `DELETE /todo/:id`, remove dead code in `POST /todo`
