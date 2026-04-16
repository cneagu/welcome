import { useState, useEffect } from 'react';
import {
  ScrollView,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { generateImage } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Post {
  id: string;
  prompt: string;
  original_image_url: string | null;
  generated_image_url: string | null;
  created_at: string;
}

export default function ChatScreen() {
  const { session, signOut } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const [prompt, setPrompt] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Post[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error && data) setHistory(data as Post[]);
      setHistoryLoading(false);
    }
    loadHistory();
  }, []);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    if (!prompt.trim()) {
      Alert.alert('Enter a prompt');
      return;
    }
    if (!imageUri) {
      Alert.alert('Pick an image first');
      return;
    }
    if (!session?.access_token) return;

    setLoading(true);
    try {
      const result = await generateImage(prompt.trim(), imageUri, session.access_token);

      const newPost: Post = {
        id: Date.now().toString(),
        prompt: prompt.trim(),
        original_image_url: imageUri,
        generated_image_url: result.url,
        created_at: new Date().toISOString(),
      };
      setHistory(prev => [newPost, ...prev]);
      setPrompt('');
      setImageUri(null);
    } catch (err: unknown) {
      Alert.alert('Generation failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const borderColor = Colors[colorScheme].icon;
  const tint = Colors[colorScheme].tint;
  const textColor = Colors[colorScheme].text;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.container}>
        {/* Input area */}
        <ThemedView style={[styles.inputArea, { borderBottomColor: borderColor }]}>
          <TextInput
            style={[styles.textInput, { borderColor, color: textColor }]}
            placeholder="Describe the edit to apply to your image..."
            placeholderTextColor={Colors[colorScheme].icon}
            value={prompt}
            onChangeText={setPrompt}
            multiline
          />
          <ThemedView style={styles.row}>
            <Pressable
              style={[styles.pickerButton, { borderColor: tint }]}
              onPress={pickImage}
            >
              <ThemedText style={{ color: tint }}>
                {imageUri ? '✓ Image selected' : '+ Add image'}
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.submitButton, { backgroundColor: tint }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <ThemedText style={styles.submitText}>Generate</ThemedText>
              }
            </Pressable>
          </ThemedView>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.preview} />
          )}
        </ThemedView>

        {/* History */}
        <ScrollView
          style={styles.history}
          contentContainerStyle={styles.historyContent}
          keyboardShouldPersistTaps="handled"
        >
          {historyLoading && <ActivityIndicator style={{ marginTop: 24 }} />}
          {!historyLoading && history.length === 0 && (
            <ThemedText style={styles.emptyText}>
              No generations yet. Pick an image and enter a prompt to get started.
            </ThemedText>
          )}
          {history.map(post => (
            <ThemedView key={post.id} style={styles.card}>
              <ThemedText type="defaultSemiBold">{post.prompt}</ThemedText>
              {post.generated_image_url ? (
                <Image
                  source={{ uri: post.generated_image_url }}
                  style={styles.resultImage}
                  resizeMode="cover"
                />
              ) : null}
              <ThemedText style={styles.timestamp}>
                {new Date(post.created_at).toLocaleString()}
              </ThemedText>
            </ThemedView>
          ))}
        </ScrollView>

        <Pressable onPress={signOut} style={styles.signOut}>
          <ThemedText type="link">Sign out</ThemedText>
        </Pressable>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inputArea: {
    padding: 16,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', gap: 8 },
  pickerButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '600' },
  preview: { width: 80, height: 80, borderRadius: 8 },
  history: { flex: 1 },
  historyContent: { gap: 16, padding: 16 },
  card: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.3)',
  },
  resultImage: { width: '100%', aspectRatio: 1, borderRadius: 8 },
  timestamp: { fontSize: 12, opacity: 0.5 },
  emptyText: { textAlign: 'center', opacity: 0.5, marginTop: 40 },
  signOut: { padding: 16, alignItems: 'center' },
});
