import { useState } from 'react';
import { TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password) {
      Alert.alert('Fill in all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      // If email confirmation is disabled in Supabase, session fires immediately
      // and RootLayoutNav redirects automatically. Otherwise show a message.
      Alert.alert('Check your email', 'We sent you a confirmation link.');
      router.replace('/(auth)/login' as never);
    } catch (err: unknown) {
      Alert.alert('Registration failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = [
    styles.input,
    { borderColor: Colors[colorScheme].icon, color: Colors[colorScheme].text },
  ];

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.heading}>Create account</ThemedText>
      <TextInput
        style={inputStyle}
        placeholder="Email"
        placeholderTextColor={Colors[colorScheme].icon}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={inputStyle}
        placeholder="Password (min 6 characters)"
        placeholderTextColor={Colors[colorScheme].icon}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable
        style={[styles.button, { backgroundColor: Colors[colorScheme].tint }]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <ThemedText style={styles.buttonText}>Register</ThemedText>
        }
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  heading: { textAlign: 'center', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  button: { padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
