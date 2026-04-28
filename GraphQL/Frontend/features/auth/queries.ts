import { useMutation } from '@tanstack/react-query';
import { apiGraphqlFetch } from '../../lib/api';
import { useAuth } from '../../lib/authContext';

const LOGIN_MUTATION = `
    mutation Login($input: LoginInput!) {
        login(loginInput: $input) {
            accessToken
            refreshToken
        }
    }
`;

type LoginResponse = {
    login: {
        accessToken: string;
        refreshToken: string;
    };
};

export function useLogin() {
    const { setTokens } = useAuth();
    return useMutation({
        mutationFn: (input: { email: string; password: string }) =>
            apiGraphqlFetch<LoginResponse>(LOGIN_MUTATION, { input }),
        onSuccess: (data) => {
            setTokens(data.login.accessToken, data.login.refreshToken);
        },
    });
}
