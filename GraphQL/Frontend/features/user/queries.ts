import { useQuery, useMutation } from '@tanstack/react-query';
import { apiGraphqlFetch } from '../../lib/api';
import { useAuth } from '../../lib/authContext';
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
    const { accessToken, refreshToken, setTokens, clearTokens } = useAuth();
    return useMutation({
        mutationFn: async (newUser: { name?: string; email: string; password: string }) => {
            const data = await apiGraphqlFetch<{ createUsuario: User }>(
                `mutation CreateUsuario($input: CreateUsuarioInput!) {
                    createUsuario(createUsuarioInput: $input) {
                        id
                        email
                        name
                        createAt
                    }
                }`,
                { input: { email: newUser.email, name: newUser.name ?? null, password: newUser.password } },
                accessToken,
                { refreshToken, setTokens, clearTokens },
            );
            return data.createUsuario;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}
