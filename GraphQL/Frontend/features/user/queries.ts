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
