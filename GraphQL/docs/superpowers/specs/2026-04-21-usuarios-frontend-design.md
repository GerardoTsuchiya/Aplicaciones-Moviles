# Spec: Pantalla de Usuarios con Modal para Agregar

**Fecha:** 2026-04-21  
**Proyecto:** GraphQL / Frontend (Expo React Native)

---

## Objetivo

Construir una pantalla en el frontend existente que liste los usuarios registrados y permita agregar uno nuevo mediante un modal, consumiendo el API GraphQL del backend NestJS.

---

## Layout

- **Lista de usuarios** con `FlatList`, cada ítem muestra avatar con inicial, nombre y email.
- **Botón flotante (FAB)** `+` en la esquina inferior derecha que abre el modal.
- Estado de carga (`isFetching`) y error (`isError`) ya manejados en `HomeScreen` — se mantiene ese patrón.

---

## Modal — Agregar usuario

- Se implementa como un `Modal` de React Native (tipo `transparent` + fondo semitransparente), estilo *bottom sheet* animado con `Animated.spring` al aparecer.
- **Campos:**
  - `Nombre` — `TextInput`, opcional
  - `Email` — `TextInput`, requerido, `keyboardType="email-address"`
- **Botones:** Cancelar (cierra el modal, limpia el formulario) y Guardar.
- **Guardar** llama a la mutación `createUsuario`, se deshabilita mientras la mutación está pendiente (`isPending`).
- Al guardar con éxito: cierra el modal, limpia el formulario e invalida la query `['users']` para refrescar la lista automáticamente.
- Si el servidor responde con error (ej. email duplicado), se muestra el mensaje debajo del campo `Email`.

---

## Arquitectura

### Archivos nuevos / modificados

| Archivo | Acción | Descripción |
|---|---|---|
| `features/user/queries.ts` | Modificar | Corregir `createUser` (actualmente tiene bugs) y convertirlo en hook `useCreateUser` |
| `features/user/AddUserModal.tsx` | Nuevo | Componente del modal con formulario |
| `features/index/HomeScreen.tsx` | Modificar | Añadir FAB y renderizar `AddUserModal` |

### Flujo de datos

```
HomeScreen
  └── useUsers()            → lista usuarios vía GraphQL query
  └── FAB onPress           → setModalVisible(true)
  └── AddUserModal
        └── useCreateUser() → mutación createUsuario
        └── onSuccess       → queryClient.invalidateQueries(['users']) + cerrar modal
```

---

## Correcciones necesarias en `queries.ts`

`createUser` tiene dos bugs que deben corregirse:

1. Usa `useMutation` directamente en la función (no es un hook válido fuera de un componente) — debe renombrarse a `useCreateUser` y usarse como hook.
2. La mutation string referencia `createUsuarioInput` en lugar de `createUsuario` — debe corregirse para coincidir con el resolver del backend.

---

## Preparación para autenticación futura

El profesor implementará login con bcrypt + JWT (access token + refresh token) en una clase próxima. Para no reescribir código cuando llegue ese momento:

### `lib/authContext.tsx` (nuevo)

Contexto mínimo que almacena los tokens. Hoy los valores son `null`; cuando el login esté listo, solo habrá que poblarlos.

```ts
type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (access: string, refresh: string) => void;
  clearTokens: () => void;
};
```

`App.tsx` envuelve toda la app con `<AuthProvider>`.

### `lib/api.ts` — firma extendida

`apiGraphqlFetch` acepta un token opcional para que las queries protegidas futuras no requieran reescribir la función:

```ts
export async function apiGraphqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string | null   // ← nuevo parámetro opcional
): Promise<T>
```

Cuando `token` está presente, se incluye `Authorization: Bearer <token>` en el header.

---

## Restricciones

- No agregar navegación ni rutas nuevas — todo en la pantalla actual.
- No instalar librerías nuevas — usar primitivos de React Native (`Modal`, `Animated`, `TextInput`) y `createContext` de React.
- Mantener el patrón existente: queries en `features/<domain>/queries.ts`, tipos en `features/<domain>/types.ts`.
