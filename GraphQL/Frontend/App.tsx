import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider, useAuth } from './lib/authContext';
import HomeScreen from './features/index/HomeScreen';
import LoginScreen from './features/auth/LoginScreen';

function AppContent() {
    const { accessToken, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!accessToken) {
        return <LoginScreen />;
    }

    return (
        <View style={styles.container}>
            <HomeScreen />
            <StatusBar style="auto" />
        </View>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <QueryClientProvider client={queryClient}>
                <AppContent />
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
