# Usuarios Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar una pantalla de usuarios con lista, FAB y modal para crear usuarios, preparada para autenticación JWT futura.

**Architecture:** `AuthContext` envuelve la app para guardar tokens cuando llegue el login. `apiGraphqlFetch` acepta un token opcional para no reescribirse. La pantalla usa `useUsers` y `useCreateUser` (hooks de TanStack Query) y un componente `AddUserModal` con bottom sheet animado.

**Tech Stack:** Expo 54, React Native, TypeScript, TanStack Query v5, React `createContext`, React Native `Modal` + `Animated`.

> **Nota:** El frontend no tiene configuración de tests. Se omiten pasos de TDD — los pasos de verificación son manuales en el simulador/dispositivo.

---

## Archivos

| Acción | Archivo | Responsabilidad |
|---|---|---|
| Modificar | `Frontend/lib/api.ts` | Agregar parámetro `token` opcional a `apiGraphqlFetch` |
| Crear | `Frontend/lib/authContext.tsx` | Contexto de auth con accessToken + refreshToken |
| Modificar | `Frontend/App.tsx` | Envolver app con `AuthProvider` |
| Modificar | `Frontend/features/user/queries.ts` | Corregir bugs y renombrar a `useCreateUser` |
| Crear | `Frontend/features/user/AddUserModal.tsx` | Modal con formulario para crear usuario |
| Modificar | `Frontend/features/index/HomeScreen.tsx` | Lista con avatares, FAB y `AddUserModal` |

---

### Task 1: Extender `apiGraphqlFetch` con soporte de token

**Files:**
- Modify: `Frontend/lib/api.ts`

- [ ] **Step 1: Reemplazar la función `apiGraphqlFetch`**

Abrir `Frontend/lib/api.ts` y reemplazar `apiGraphqlFetch` con:

```typescript
export async function apiGraphqlFetch<T>(
    query: string,
    variables?: Record<string, unknown>,
    token?: string | null
): Promise<T> {
    const response = await fetch(`${GRAPHQL_URL}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
    });

    const json = await response.json();

    if (json.errors?.length) {
        throw new Error(json.errors[0].message);
    }

    return json.data as T;
}
```

- [ ] **Step 2: Commit**

```bash
git add Frontend/lib/api.ts
git commit -m "feat: add optional token param to apiGraphqlFetch"
```

---

### Task 2: Crear `AuthContext`

**Files:**
- Create: `Frontend/lib/authContext.tsx`
- Modify: `Frontend/App.tsx`

- [ ] **Step 1: Crear `Frontend/lib/authContext.tsx`**

```typescript
import React, { createContext, useContext, useState } from 'react';

type AuthState = {
    accessToken: string | null;
    refreshToken: string | null;
    setTokens: (access: string, refresh: string) => void;
    clearTokens: () => void;
};

const AuthContext = createContext<AuthState>({
    accessToken: null,
    refreshToken: null,
    setTokens: () => {},
    clearTokens: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);

    const setTokens = (access: string, refresh: string) => {
        setAccessToken(access);
        setRefreshToken(refresh);
    };

    const clearTokens = () => {
        setAccessToken(null);
        setRefreshToken(null);
    };

    return (
        <AuthContext.Provider value={{ accessToken, refreshToken, setTokens, clearTokens }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
```

- [ ] **Step 2: Envolver la app con `AuthProvider` en `Frontend/App.tsx`**

```typescript
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './lib/authContext';
import HomeScreen from './features/index/HomeScreen';

export default function App() {
    return (
        <AuthProvider>
            <QueryClientProvider client={queryClient}>
                <View style={styles.container}>
                    <HomeScreen />
                    <StatusBar style="auto" />
                </View>
            </QueryClientProvider>
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 56,
        paddingHorizontal: 16,
    },
});
```

- [ ] **Step 3: Verificar que la app sigue corriendo sin errores**

```bash
# En Frontend/
npm start
```

Esperado: app carga normalmente, sin errores en consola.

- [ ] **Step 4: Commit**

```bash
git add Frontend/lib/authContext.tsx Frontend/App.tsx
git commit -m "feat: add AuthContext with accessToken and refreshToken"
```

---

### Task 3: Corregir `useCreateUser` en `queries.ts`

**Files:**
- Modify: `Frontend/features/user/queries.ts`

- [ ] **Step 1: Reemplazar el contenido de `Frontend/features/user/queries.ts`**

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiGraphqlFetch } from '../../lib/api';
import { User } from './types';
import { queryClient } from '../../lib/queryClient';

export function useUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const data = await apiGraphqlFetch<{ usuarios: User[] }>(`
                query {
                    usuarios {
                        id
                        email
                        name
                        createAt
                    }
                }
            `);
            return data.usuarios;
        },
    });
}

export function useCreateUser() {
    return useMutation({
        mutationFn: async (newUser: { name?: string; email: string }) => {
            const data = await apiGraphqlFetch<{ createUsuario: User }>(
                `mutation CreateUsuario($email: String!, $name: String) {
                    createUsuario(createUsuarioInput: { email: $email, name: $name }) {
                        id
                        email
                        name
                        createAt
                    }
                }`,
                { email: newUser.email, name: newUser.name ?? null },
            );
            return data.createUsuario;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}
```

- [ ] **Step 2: Commit**

```bash
git add Frontend/features/user/queries.ts
git commit -m "fix: rename createUser to useCreateUser and fix mutation query"
```

---

### Task 4: Crear `AddUserModal`

**Files:**
- Create: `Frontend/features/user/AddUserModal.tsx`

- [ ] **Step 1: Crear `Frontend/features/user/AddUserModal.tsx`**

```typescript
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useCreateUser } from './queries';

type Props = {
    visible: boolean;
    onClose: () => void;
};

export default function AddUserModal({ visible, onClose }: Props) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [fieldError, setFieldError] = useState<string | null>(null);
    const slideAnim = useRef(new Animated.Value(300)).current;

    const { mutate: createUser, isPending } = useCreateUser();

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
        } else {
            slideAnim.setValue(300);
        }
    }, [visible]);

    const handleClose = () => {
        setName('');
        setEmail('');
        setFieldError(null);
        onClose();
    };

    const handleSave = () => {
        if (!email.trim()) {
            setFieldError('El email es requerido.');
            return;
        }
        setFieldError(null);
        createUser(
            { name: name.trim() || undefined, email: email.trim() },
            {
                onSuccess: handleClose,
                onError: (error: Error) => setFieldError(error.message),
            },
        );
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <Pressable style={styles.backdrop} onPress={handleClose} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Agregar usuario</Text>
                        <Pressable onPress={handleClose}>
                            <Text style={styles.closeBtn}>✕</Text>
                        </Pressable>
                    </View>

                    <Text style={styles.label}>
                        Nombre <Text style={styles.optional}>(opcional)</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. Gerardo"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />

                    <Text style={styles.label}>
                        Email <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, fieldError ? styles.inputError : null]}
                        placeholder="Ej. gerardo@uabc.edu.mx"
                        value={email}
                        onChangeText={(t) => { setEmail(t); setFieldError(null); }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    {fieldError && <Text style={styles.errorText}>{fieldError}</Text>}

                    <View style={styles.actions}>
                        <Pressable style={styles.cancelBtn} onPress={handleClose}>
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.saveBtn, isPending && styles.saveBtnDisabled]}
                            onPress={handleSave}
                            disabled={isPending}
                        >
                            <Text style={styles.saveText}>
                                {isPending ? 'Guardando...' : 'Guardar'}
                            </Text>
                        </Pressable>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 20,
        paddingBottom: 36,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
    },
    closeBtn: {
        fontSize: 18,
        color: '#888',
        padding: 4,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#555',
        marginBottom: 6,
    },
    optional: {
        fontWeight: '400',
        color: '#aaa',
    },
    required: {
        color: '#e53e3e',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        marginBottom: 16,
        color: '#111',
    },
    inputError: {
        borderColor: '#e53e3e',
        marginBottom: 4,
    },
    errorText: {
        fontSize: 12,
        color: '#e53e3e',
        marginBottom: 16,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    cancelBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelText: {
        color: '#555',
        fontWeight: '500',
    },
    saveBtn: {
        flex: 1,
        backgroundColor: '#4f46e5',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    saveBtnDisabled: {
        backgroundColor: '#a5b4fc',
    },
    saveText: {
        color: '#fff',
        fontWeight: '600',
    },
});
```

- [ ] **Step 2: Commit**

```bash
git add Frontend/features/user/AddUserModal.tsx
git commit -m "feat: add AddUserModal with animated bottom sheet"
```

---

### Task 5: Actualizar `HomeScreen`

**Files:**
- Modify: `Frontend/features/index/HomeScreen.tsx`

- [ ] **Step 1: Reemplazar el contenido de `Frontend/features/index/HomeScreen.tsx`**

```typescript
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useUsers } from '../user/queries';
import AddUserModal from '../user/AddUserModal';

export default function HomeScreen() {
    const { data, isFetching, isError } = useUsers();
    const [modalVisible, setModalVisible] = useState(false);

    if (isFetching) {
        return (
            <View>
                <Text style={styles.message}>Cargando...</Text>
            </View>
        );
    }

    if (isError) {
        return (
            <View>
                <Text style={styles.message}>Error al cargar los usuarios.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Usuarios</Text>

            <FlatList
                data={data}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => {
                    const initial = (item.name ?? item.email)[0].toUpperCase();
                    return (
                        <View style={styles.card}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{initial}</Text>
                            </View>
                            <View>
                                <Text style={styles.cardName}>{item.name ?? 'Sin nombre'}</Text>
                                <Text style={styles.cardEmail}>{item.email}</Text>
                            </View>
                        </View>
                    );
                }}
                contentContainerStyle={styles.list}
            />

            <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
                <Text style={styles.fabText}>+</Text>
            </Pressable>

            <AddUserModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    heading: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111',
        marginBottom: 16,
    },
    list: {
        paddingBottom: 80,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 3,
        elevation: 2,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e0e7ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#4f46e5',
        fontWeight: '700',
        fontSize: 16,
    },
    cardName: {
        fontWeight: '600',
        fontSize: 14,
        color: '#111',
    },
    cardEmail: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    message: {
        fontSize: 14,
        color: '#555',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 0,
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#4f46e5',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    fabText: {
        color: '#fff',
        fontSize: 28,
        lineHeight: 32,
        fontWeight: '300',
    },
});
```

- [ ] **Step 2: Verificar en el simulador**

```bash
# En Frontend/
npm start
```

Verificar:
- La lista muestra usuarios con avatar (inicial), nombre y email.
- El botón `+` está visible en la esquina inferior derecha.
- Al presionar `+`, aparece el modal animado desde abajo.
- Al llenar el formulario y presionar **Guardar**, el usuario aparece en la lista.
- Si el email ya existe, aparece el mensaje de error debajo del campo.
- Al presionar **Cancelar** o el `✕`, el modal se cierra y los campos se limpian.

- [ ] **Step 3: Commit**

```bash
git add Frontend/features/index/HomeScreen.tsx
git commit -m "feat: update HomeScreen with user cards, FAB and AddUserModal"
```
