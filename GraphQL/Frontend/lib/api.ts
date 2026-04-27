import { Platform } from 'react-native';

const GRAPHQL_URL =
    process.env.EXPO_PUBLIC_API_URL ||
    (Platform.OS === 'android'
        ? 'http://10.0.2.2:3000/graphql'
        : 'http://localhost:3000/graphql');

type RequestOptions = {
    method?: 'GET' | 'POST'| 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    token?: string | null;
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
        const errorMessage = typeof data === 'string' ? data : (data as { message?: string }).message || 'Unknown error';
        throw new Error(errorMessage);
    }
    return data as T;
}

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