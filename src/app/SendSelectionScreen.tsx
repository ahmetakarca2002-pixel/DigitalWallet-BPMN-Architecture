import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const OPTIONS = [
  { key: 'own', label: 'HESAPLARIM ARASI', route: '/BetweenMyAccountScreen', icon: 'swap-horizontal' },
  { key: 'eft', label: 'BAŞKA HESABA (EFT)', route: '/AnotherAccountHavaleEFT', icon: 'bank-transfer' },
  { key: 'fast', label: 'KOLAY ADRES (FAST)', route: '/transfer/fast', icon: 'lightning-bolt-outline' },
  { key: 'swift', label: 'SWIFT (Döviz Transferi)', route: '/AnotherAccount2SWIFT', icon: 'earth' },
] as const;

const BG_GRADIENT = ['#040268', '#1410B4', '#040268'] as const;

function BackArrow() {
  return (
    <View style={styles.backBox}>
      <View style={styles.backLine} />
      <View style={styles.backHead} />
    </View>
  );
}

export default function SendSelectionScreen() {
  const navigateBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleSelect = (route: string) => {
    router.push(route as any);
  };

  return (
    <LinearGradient colors={BG_GRADIENT} style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.frame}>
          <Pressable
            onPress={navigateBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Geri"
            style={styles.backButton}
          >
            <BackArrow />
          </Pressable>

          <Text style={styles.title}>Para Gönder</Text>

          <View style={styles.card}>
            {OPTIONS.map((option) => (
              <Pressable
                key={option.key}
                onPress={() => handleSelect(option.route)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
                <MaterialCommunityIcons name={option.icon as any} size={24} color="#FFFFFF" style={styles.optionIcon} />
                <Text style={styles.optionText}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const montserrat = Platform.select({ ios: 'Montserrat', default: undefined });

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  frame: { width: 375, minHeight: 812, paddingTop: 76 },
  backButton: { marginLeft: 17, width: 40, height: 40 },
  backBox: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backLine: { position: 'absolute', left: 11, top: 19, width: 18, height: 2, backgroundColor: '#FFFFFF', borderRadius: 1 },
  backHead: { position: 'absolute', left: 11, top: 14, width: 10, height: 10, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#FFFFFF', transform: [{ rotate: '45deg' }] },
  title: { marginLeft: 27, marginTop: 9, color: '#FFFFFF', fontSize: 18, lineHeight: 22, fontWeight: '700', fontFamily: montserrat },
  
  // YENİ: Dashboard alt menüsündeki gibi kalın, koyu lacivert ve derin gölgeli "katmanlı" kart
  card: { 
    marginLeft: 28, 
    marginTop: 42, 
    width: 317, 
    backgroundColor: '#020024', // Menünün koyu lacivert zemin rengi
    borderRadius: 30,
    paddingTop: 30,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 30,
    gap: 14,
    elevation: 15, // Android için derin gölge
    shadowColor: '#000', // iOS için derin gölge
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  
  option: {
    height: 65,
    borderWidth: 1,
    borderColor: '#2A2770',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 16, 180, 0.2)' // Menüdeki butonların hafif opak arka planı
  },
  optionIcon: {
    marginRight: 14,
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  pressed: { opacity: 0.6 },
});