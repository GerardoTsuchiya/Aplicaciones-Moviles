import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

type AuthState = {
    accessToken: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    setTokens: (access: string, refresh: string) => void;
    clearTokens: () => void;
};

const AuthContext = createContext<AuthState>({
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    setTokens: () => {},
    clearTokens: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadTokens() {
            try {
                const available = await SecureStore.isAvailableAsync();
                if (available) {
                    const [access, refresh] = await Promise.all([
                        SecureStore.getItemAsync(ACCESS_KEY),
                        SecureStore.getItemAsync(REFRESH_KEY),
                    ]);
                    setAccessToken(access);
                    setRefreshToken(refresh);
                }
            } catch {
                // SecureStore unavailable — permanece en memoria
            } finally {
                setIsLoading(false);
            }
        }
        loadTokens();
    }, []);

    const setTokens = (access: string, refresh: string) => {
        setAccessToken(access);
        setRefreshToken(refresh);
        SecureStore.setItemAsync(ACCESS_KEY, access).catch(() => {});
        SecureStore.setItemAsync(REFRESH_KEY, refresh).catch(() => {});
    };

    const clearTokens = () => {
        setAccessToken(null);
        setRefreshToken(null);
        SecureStore.deleteItemAsync(ACCESS_KEY).catch(() => {});
        SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {});
    };

    return (
        <AuthContext.Provider value={{ accessToken, refreshToken, isLoading, setTokens, clearTokens }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
