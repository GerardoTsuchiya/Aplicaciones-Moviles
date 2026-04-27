import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useUsers } from '../user/queries';
import AddUserModal from '../user/AddUserModal';

export default function HomeScreen() {
    const { data, isLoading, isError } = useUsers();
    const [modalVisible, setModalVisible] = useState(false);

    if (isLoading) {
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
