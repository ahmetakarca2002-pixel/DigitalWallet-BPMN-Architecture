import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { LinearGradient } from 'expo-linear-gradient';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { io } from 'socket.io-client';
import { useStore } from '../store/useStore'; // Yolu kendi proje yapına göre ayarlayabilirsin

SplashScreen.preventAutoHideAsync();

// Doğru IP adresiyle dinleyiciyi başlatıyoruz
const SOCKET_URL = 'http://192.168.1.106:3000';
const socket = io(SOCKET_URL);

const PINK_GRADIENT = ['#ED21D9', '#970DD9'] as const;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  
  // Zustand'dan SQL çekme, onaylama ve iptal/iade fonksiyonlarını alıyoruz
  const { fetchWalletData, approvePendingTransfer, cancelPendingTransfer } = useStore();

  // Global Modal State'i
  const [alertConfig, setAlertConfig] = useState({ 
    visible: false, 
    title: '', 
    message: '' 
  });

useEffect(() => {
    // UYGULAMA AÇILDIĞINDA SQL'DEN GÜNCEL VERİYİ BİR KEZ ÇEK
    fetchWalletData();

    // 1. Arka uçtan 'transfer-approved' (ONAY) sinyali geldiğinde
    socket.on('transfer-approved', (data) => {
      console.log("📱 WebSocket Sinyali Alındı (Onay):", data);
      
      approvePendingTransfer(data.amount);
      
      setAlertConfig({
        visible: true,
        title: "Transfer Onaylandı! ✅",
        message: `Beklemede olan ${data.amount} tutarındaki işleminiz banka tarafından onaylandı.`
      });
    });

    // 2. Arka uçtan 'transfer-timeout' (İPTAL/İADE/DMN REDDİ) sinyali geldiğinde
    socket.on('transfer-timeout', (data) => {
      console.log("📱 WebSocket Sinyali Alındı (İptal/Red):", data);
      
      cancelPendingTransfer(data.amount);
      
      // Eğer Camunda DMN'den bir ret mesajı geldiyse onu kullan, yoksa standart zaman aşımı mesajı göster
      const isRuleRejection = data.message && data.message !== "Zaman Aşımı / İptal";
      
      setAlertConfig({
        visible: true,
        title: isRuleRejection ? "Kural İhlali ⚠️" : "İşlem İptali ⏱️",
        message: isRuleRejection 
          ? `${data.message} İşleminiz iptal edilmiş ve tutar bakiyenize iade edilmiştir.` 
          : `Operasyon süresi dolduğu için ${data.amount} tutarındaki işleminiz iptal edilmiş ve bakiyenize iade edilmiştir.`
      });
    });

    return () => {
      socket.off('transfer-approved');
      socket.off('transfer-timeout');
    };
  }, []);
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="dashboard" />
      </Stack>

      {/* Global Özel Modal Alert Kutusu */}
      <Modal transparent={true} visible={alertConfig.visible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{alertConfig.title}</Text>
            <Text style={styles.modalMessage}>{alertConfig.message}</Text>
            <Pressable 
              onPress={() => setAlertConfig({ ...alertConfig, visible: false })}
              style={({ pressed }) => [styles.modalButtonContainer, pressed && styles.pressed]}>
              <LinearGradient colors={PINK_GRADIENT} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.buttonText}>Tamam</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  // Modal Stilleri
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(4, 2, 104, 0.8)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalCard: { 
    width: '80%', 
    backgroundColor: '#1410B4', 
    borderRadius: 25, 
    padding: 24, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#FFFFFF' 
  },
  modalTitle: { 
    color: '#FFFFFF', 
    fontSize: 20, 
    fontWeight: '700', 
    marginBottom: 12, 
    textAlign: 'center' 
  },
  modalMessage: { 
    color: '#A0A0A0', 
    fontSize: 14, 
    textAlign: 'center', 
    marginBottom: 24 
  },
  modalButtonContainer: { 
    width: 140, 
    height: 46, 
    borderRadius: 23, 
    overflow: 'hidden' 
  },
  buttonGradient: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 18, 
    fontWeight: '700' 
  },
  pressed: { 
    opacity: 0.6 
  }
});