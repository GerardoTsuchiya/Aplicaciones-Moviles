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
