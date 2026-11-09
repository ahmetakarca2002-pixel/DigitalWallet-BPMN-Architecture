import { Image } from 'expo-image';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const AVATAR_URI = 'https://api.builder.io/api/v1/image/assets/TEMP/4ace5a5dd7dbd177bb05b7221df7757df9ee6dbe?width=190';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorConfig, setErrorConfig] = useState({ visible: false, title: '', message: '' });
  const router = useRouter();

  const handleLogin = () => {
    if (!email.includes('@') || !email.includes('.')) {
      setErrorConfig({ visible: true, title: 'Geçersiz E-posta', message: 'Lütfen geçerli bir e-posta adresi girin.' });
      return;
    }
    if (password.trim().length < 6) {
      setErrorConfig({ visible: true, title: 'Kısa Şifre', message: 'Şifreniz en az 6 karakter olmalıdır.' });
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.replace('/dashboard');
    }, 1500);
  };

  return (
    <LinearGradient colors={['#040268', '#1410B4', '#040268']} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.card}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: AVATAR_URI }} style={styles.avatar} contentFit="cover" />
            </View>

            <View style={styles.titleGroup}>
              <Text style={styles.title}>Tekrar Hoş geldin, Emine</Text>
              <Text style={styles.subtitle}>Lütfen var olan hesabına giriş yap</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>E-posta</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="#A0A0A0"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Şifre</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholderTextColor="#A0A0A0"
                />
              </View>
            </View>

            <Pressable
              onPress={handleLogin}
              disabled={isLoading}
              accessibilityRole="button"
              style={({ pressed }) => [styles.buttonContainer, pressed && !isLoading && styles.pressed]}>
              <LinearGradient 
                colors={['#ED21D9', '#970DD9']} 
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Giriş Yap</Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable accessibilityRole="link">
              <Text style={styles.forgot}>
                Şifreni mi unuttun?{'\n'}
                <Text style={styles.forgotBold}>Buraya Tıkla</Text>
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Özel Hata Kutusu (Modal) */}
      <Modal transparent={true} visible={errorConfig.visible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{errorConfig.title}</Text>
            <Text style={styles.modalMessage}>{errorConfig.message}</Text>
            <Pressable 
              onPress={() => setErrorConfig({ ...errorConfig, visible: false })}
              style={({ pressed }) => [styles.modalButtonContainer, pressed && styles.pressed]}>
              <LinearGradient colors={['#ED21D9', '#970DD9']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.buttonText}>Tamam</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  card: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 32 },
  avatarWrap: { width: 95, height: 95, borderRadius: 48, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  avatar: { width: 95, height: 95 },
  titleGroup: { alignItems: 'center', gap: 8 },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', textAlign: 'center' },
  subtitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '500', textAlign: 'center' },
  form: { alignSelf: 'stretch', alignItems: 'center', gap: 16 },
  field: { width: '100%', maxWidth: 299, alignItems: 'center', gap: 8 },
  label: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', textAlign: 'center' },
  input: { width: 249, maxWidth: '100%', height: 54, borderRadius: 25, borderWidth: 2, borderColor: '#FFFFFF', paddingHorizontal: 20, color: '#FFFFFF', fontSize: 16, textAlign: 'center' },
  buttonContainer: { width: 249, maxWidth: '100%', height: 54, borderRadius: 25, overflow: 'hidden' },
  buttonGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.85 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  forgot: { color: '#FFFFFF', fontSize: 13, fontWeight: '400', textAlign: 'center' },
  forgotBold: { fontWeight: '700' },
  
  // Özel Modal Stilleri
  modalOverlay: { flex: 1, backgroundColor: 'rgba(4, 2, 104, 0.8)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '80%', backgroundColor: '#1410B4', borderRadius: 25, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#FFFFFF' },
  modalTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  modalMessage: { color: '#A0A0A0', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  modalButtonContainer: { width: 140, height: 46, borderRadius: 23, overflow: 'hidden' },
});