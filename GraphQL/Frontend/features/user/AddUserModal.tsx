import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useCreateUser } from './queries';

type Props = {
    visible: boolean;
    onClose: () => void;
};

export default function AddUserModal({ visible, onClose }: Props) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fieldError, setFieldError] = useState<string | null>(null);
    const slideAnim = useRef(new Animated.Value(300)).current;

    const { mutate: createUser, isPending } = useCreateUser();

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
        } else {
            slideAnim.setValue(300);
        }
    }, [visible, slideAnim]);

    const handleClose = () => {
        setName('');
        setEmail('');
        setPassword('');
        setFieldError(null);
        onClose();
    };

    const handleSave = () => {
        if (!email.trim()) {
            setFieldError('El email es requerido.');
            return;
        }
        if (!password.trim()) {
            setFieldError('La contraseña es requerida.');
            return;
        }
        if (password.trim().length < 6) {
            setFieldError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        setFieldError(null);
        createUser(
            { name: name.trim() || undefined, email: email.trim(), password: password.trim() },
            {
                onSuccess: handleClose,
                onError: (error: Error) => setFieldError(error.message),
            },
        );
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <Pressable style={styles.backdrop} onPress={handleClose} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Agregar usuario</Text>
                        <Pressable onPress={handleClose}>
                            <Text style={styles.closeBtn}>✕</Text>
                        </Pressable>
                    </View>

                    <Text style={styles.label}>
                        Nombre <Text style={styles.optional}>(opcional)</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. Gerardo"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />

                    <Text style={styles.label}>
                        Email <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. gerardo@uabc.edu.mx"
                        value={email}
                        onChangeText={(t) => { setEmail(t); setFieldError(null); }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>
                        Contraseña <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, fieldError ? styles.inputError : null]}
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChangeText={(t) => { setPassword(t); setFieldError(null); }}
                        secureTextEntry
                    />
                    {fieldError && <Text style={styles.errorText}>{fieldError}</Text>}

                    <View style={styles.actions}>
                        <Pressable style={styles.cancelBtn} onPress={handleClose}>
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.saveBtn, isPending && styles.saveBtnDisabled]}
                            onPress={handleSave}
                            disabled={isPending}
                        >
                            <Text style={styles.saveText}>
                                {isPending ? 'Guardando...' : 'Guardar'}
                            </Text>
                        </Pressable>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 20,
        paddingBottom: 36,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
    },
    closeBtn: {
        fontSize: 18,
        color: '#888',
        padding: 4,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#555',
        marginBottom: 6,
    },
    optional: {
        fontWeight: '400',
        color: '#aaa',
    },
    required: {
        color: '#e53e3e',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        marginBottom: 16,
        color: '#111',
    },
    inputError: {
        borderColor: '#e53e3e',
        marginBottom: 4,
    },
    errorText: {
        fontSize: 12,
        color: '#e53e3e',
        marginBottom: 16,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    cancelBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelText: {
        color: '#555',
        fontWeight: '500',
    },
    saveBtn: {
        flex: 1,
        backgroundColor: '#4f46e5',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    saveBtnDisabled: {
        backgroundColor: '#a5b4fc',
    },
    saveText: {
        color: '#fff',
        fontWeight: '600',
    },
});
