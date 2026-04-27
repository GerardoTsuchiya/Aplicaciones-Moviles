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
