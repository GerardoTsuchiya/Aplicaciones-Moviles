# SecureStore + Refresh Token + Login Screen — Design Spec

**Date:** 2026-04-27  
**Project:** GraphQL / Aplicaciones Móviles — UABC  

---

## Goal

Persistir tokens JWT en el dispositivo con `expo-secure-store`, implementar refresh token stateless en el backend, y agregar una pantalla de login. El usuario queda autenticado entre sesiones sin volver a ingresar credenciales hasta que el refresh token expire (7 días).

---

## Architecture

```
App arrancar
  ↓
AuthContext.useEffect → lee SecureStore
  ├─ tokens encontrados → HomeScreen
  └─ sin tokens → LoginScreen
                    ↓
              login(email, password)  →  Backend
                    ↓
              setTokens(access, refresh)
              SecureStore.set('accessToken')
              SecureStore.set('refreshToken')
                    ↓
              HomeScreen

Petición protegida falla (token expirado)
  ↓
api.ts → refreshToken(refreshToken)  →  Backend
  ├─ falla → clearTokens() → LoginScreen
  └─ éxito → setTokens(nuevoAccess, nuevoRefresh)
              → reintenta petición original
```

---

## Backend Changes

### Files modified

| File | Change |
|---|---|
| `src/auth/entities/auth-response.entity.ts` | Add `refreshToken` field |
| `src/auth/auth.service.ts` | `login()` signs two tokens; new `refresh()` method |
| `src/auth/auth.resolver.ts` | New `refreshToken` mutation |

### Token strategy

Both tokens are **stateless JWTs** signed with `JWT_SECRET`. No new database table.

- `accessToken` — payload `{ sub, email, type: 'access' }`, expires `15m`
- `refreshToken` — payload `{ sub, email, type: 'refresh' }`, expires `7d`

The `type` field distinguishes them: `refresh()` rejects any token where `type !== 'refresh'`, preventing access tokens from being used as refresh tokens.

### AuthResponse (updated)

```typescript
@ObjectType()
export class AuthResponse {
  @Field() accessToken: string = '';
  @Field() refreshToken: string = '';
}
```

### AuthService (updated)

```typescript
// login() — signs both tokens
async login(loginInput: LoginInput): Promise<AuthResponse> {
  const user = await this.validateUser(loginInput.email, loginInput.password);
  if (!user) throw new UnauthorizedException('Credenciales inválidas');
  return this.signTokens(user.id, user.email);
}

// refresh() — verifies refresh token, returns new pair
async refresh(token: string): Promise<AuthResponse> {
  // jwtService.verify() throws if expired or invalid
  const payload = this.jwtService.verify<{ sub: number; email: string; type: string }>(token);
  if (payload.type !== 'refresh') throw new UnauthorizedException('Token inválido');
  return this.signTokens(payload.sub, payload.email);
}

// signTokens() — shared helper to sign both tokens
private signTokens(userId: number, email: string): AuthResponse {
  const base = { sub: userId, email };
  return {
    accessToken:  this.jwtService.sign({ ...base, type: 'access' },  { expiresIn: '15m' }),
    refreshToken: this.jwtService.sign({ ...base, type: 'refresh' }, { expiresIn: '7d' }),
  };
}
```

### AuthResolver (updated)

```typescript
@Mutation(() => AuthResponse)
login(@Args('loginInput') loginInput: LoginInput) {
  return this.authService.login(loginInput);
}

@Mutation(() => AuthResponse)
refreshToken(@Args('token') token: string) {
  return this.authService.refresh(token);
}
```

---

## Frontend Changes

### Files modified / created

| File | Action | Description |
|---|---|---|
| `lib/authContext.tsx` | Modify | Add SecureStore persistence + `isLoading` |
| `lib/api.ts` | Modify | Add auto-refresh on 401/Unauthorized |
| `App.tsx` | Modify | Conditional rendering based on auth state |
| `features/auth/LoginScreen.tsx` | Create | Login form UI |
| `features/auth/queries.ts` | Create | `useLogin` hook |

### AuthContext (updated contract)

```typescript
type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;          // true while SecureStore is being read on startup
  setTokens: (access: string, refresh: string) => void;
  clearTokens: () => void;
};
```

**Behavior:**
- On mount: reads `'accessToken'` and `'refreshToken'` from SecureStore, sets state, sets `isLoading: false`
- `setTokens(access, refresh)`: updates state + calls `SecureStore.setItemAsync` for both keys
- `clearTokens()`: clears state + calls `SecureStore.deleteItemAsync` for both keys

### App.tsx (updated)

```tsx
const { accessToken, isLoading } = useAuth();

if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;
if (!accessToken) return <LoginScreen />;
return <HomeScreen />;
```

No navigation library — screen switching happens automatically when `accessToken` changes in context.

### LoginScreen

**Location:** `features/auth/LoginScreen.tsx`

**Fields:**
- Email — `keyboardType="email-address"`, `autoCapitalize="none"`, `autoCorrect={false}`
- Password — `secureTextEntry={true}`

**Behavior:**
- "Iniciar sesión" button disabled while `isPending`
- On success: `setTokens(access, refresh)` → App re-renders → HomeScreen
- On error: shows server error message below the password field

### useLogin hook

**Location:** `features/auth/queries.ts`

```typescript
export function useLogin() {
  const { setTokens } = useAuth();
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      return apiGraphqlFetch<{ login: { accessToken: string; refreshToken: string } }>(
        `mutation Login($input: LoginInput!) {
          login(loginInput: $input) { accessToken refreshToken }
        }`,
        { input }
      );
    },
    onSuccess: (data) => {
      setTokens(data.login.accessToken, data.login.refreshToken);
    },
  });
}
```

### Auto-refresh in api.ts

`apiGraphqlFetch` accepts an optional `authOptions` parameter:

```typescript
type AuthOptions = {
  refreshToken: string | null;
  setTokens: (access: string, refresh: string) => void;
  clearTokens: () => void;
};

export async function apiGraphqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string | null,
  authOptions?: AuthOptions
): Promise<T>
```

**Auto-refresh flow:**
1. Execute request normally
2. If `json.errors[0].message` includes `'Unauthorized'` AND `authOptions?.refreshToken` exists:
   - Call `refreshToken` mutation with the stored refresh token
   - On success: call `setTokens(newAccess, newRefresh)`, retry original request once
   - On failure: call `clearTokens()`, throw error (triggers redirect to LoginScreen)
3. Retry happens only once — if it fails again, throw the error

**Backward compatibility:** All existing calls to `apiGraphqlFetch` without `authOptions` continue to work unchanged. The auto-refresh only activates when `authOptions` is provided.

---

## Installation

```bash
# In Frontend/
npx expo install expo-secure-store
```

`npx expo install` (instead of `npm install`) ensures the version is compatible with the current Expo SDK.

---

## SecureStore keys

| Key | Value |
|---|---|
| `'accessToken'` | JWT access token string |
| `'refreshToken'` | JWT refresh token string |

---

## Error handling

| Scenario | Behavior |
|---|---|
| SecureStore unavailable | `isAvailableAsync()` check — graceful degradation to in-memory only |
| Invalid credentials | `UnauthorizedException` from backend — shown below password field |
| Expired access token | Auto-refresh triggered in `api.ts` |
| Expired refresh token | `clearTokens()` → LoginScreen |
| Network error | Propagated as-is to TanStack Query error state |

---

## Out of scope

- Biometric authentication (`requireAuthentication` option)
- Logout button on HomeScreen (can be added later with `clearTokens()`)
- Token rotation on every request
- Refresh token revocation (no DB table)
