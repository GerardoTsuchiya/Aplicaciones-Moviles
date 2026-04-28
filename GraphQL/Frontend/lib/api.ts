import { Platform } from 'react-native';

const GRAPHQL_URL =
    process.env.EXPO_PUBLIC_API_URL ||
    (Platform.OS === 'android'
        ? 'http://10.0.2.2:3000/graphql'
        : 'http://localhost:3000/graphql');

type RequestOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    token?: string | null;
};

export type AuthOptions = {
    refreshToken: string | null;
    setTokens: (access: string, refresh: string) => void;
    clearTokens: () => void;
};

export async function apiFetch<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { method = 'GET', body, token } = options;
    const baseUrl = GRAPHQL_URL.replace(/\/graphql\/?$/, '');

    const response = await fetch(`${baseUrl}/${endpoint}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    let data: unknown = null;

    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (!response.ok) {
        const errorMessage =
            typeof data === 'string'
                ? data
                : (data as { message?: string }).message || 'Unknown error';
        throw new Error(errorMessage);
    }
    return data as T;
}

async function doGraphqlFetch<T>(
    query: string,
    variables?: Record<string, unknown>,
    token?: string | null
): Promise<{ data: T; errors?: Array<{ message: string }> }> {
    const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
    });
    return response.json();
}

const REFRESH_MUTATION = `
    mutation RefreshToken($token: String!) {
        refreshToken(token: $token) { accessToken refreshToken }
    }
`;

type RefreshData = { refreshToken: { accessToken: string; refreshToken: string } };

export async function apiGraphqlFetch<T>(
    query: string,
    variables?: Record<string, unknown>,
    token?: string | null,
    authOptions?: AuthOptions
): Promise<T> {
    const json = await doGraphqlFetch<T>(query, variables, token);

    if (json.errors?.length) {
        const message = json.errors[0].message;

        if (message.includes('Unauthorized') && authOptions?.refreshToken) {
            const refreshJson = await doGraphqlFetch<RefreshData>(
                REFRESH_MUTATION,
                { token: authOptions.refreshToken }
            );

            if (refreshJson.errors?.length || !refreshJson.data?.refreshToken) {
                authOptions.clearTokens();
                throw new Error(refreshJson.errors?.[0]?.message ?? 'Session expired');
            }

            const { accessToken: newAccess, refreshToken: newRefresh } =
                refreshJson.data.refreshToken;
            authOptions.setTokens(newAccess, newRefresh);

            const retryJson = await doGraphqlFetch<T>(query, variables, newAccess);
            if (retryJson.errors?.length) throw new Error(retryJson.errors[0].message);
            return retryJson.data as T;
        }

        throw new Error(message);
    }

    return json.data as T;
}
