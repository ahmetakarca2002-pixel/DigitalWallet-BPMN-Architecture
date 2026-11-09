import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import axios from 'axios';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { useEffect } from 'react'; // useEffect'i içe aktardığınızdan emin olun
const PINK_GRADIENT = ['#ED21D9', '#970DD9'] as const;

export default function SendMoneyScreen() {
  
const { sendMoney, balance, customerType, fetchWalletData } = useStore(); // fetchWalletData eklendi
  
  // Sayfa ilk açıldığında güncel müşteri tipini ve bakiyeyi çekmek için
  useEffect(() => {
    fetchWalletData();
  }, []);  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // YENİ: Onay kutusu stateleri eklendi
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    amount: 0,
    fee: 0,
    recipient: ''
  });

  const [alertConfig, setAlertConfig] = useState({ 
    visible: false, 
    title: '', 
    message: '', 
    isSuccess: false 
  });

  const disabled = isLoading || !recipient || !amount;

  const navigateBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleModalOk = () => {
    const wasSuccess = alertConfig.isSuccess;
    setAlertConfig({ ...alertConfig, visible: false });
    if (wasSuccess) {
      router.replace('/dashboard');
    }
  };

  // 1. ADIM: "Onayla ve Gönder" butonuna basınca komisyon hesaplanıp onay sorulur
  const handlePreSend = () => {
    if (disabled) return;
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    
    // Front-end bazlı basit komisyon hesaplaması (Bunu istersen Camunda'ya da sorabiliriz ama UI için hızlıca burada hesaplıyoruz)
    // Gerçekte, veritabanından çekilen müşteri tipini kullanıyoruz. Varsayılan olarak STANDART komisyonu uyguluyoruz.
    let calculatedFee = 5.00;
    if (customerType === "VIP") {
      calculatedFee = 0.00;
    }

    setConfirmModal({
      visible: true,
      amount: parsedAmount,
      fee: calculatedFee,
      recipient: recipient
    });
  };

  // 2. ADIM: Alert box'ta "Onayla" denilirse gerçek API isteği atılır
  const executeTransfer = async () => {
    setConfirmModal({ ...confirmModal, visible: false });
    setIsLoading(true);

    const parsedAmount = confirmModal.amount;
    const url = 'http://192.168.1.106:3000/api/transfer';

    try {
      const response = await axios.post(url, {
        senderId: "Ahmet_123",
        recipientIban: confirmModal.recipient,
        amount: parsedAmount
      });

      if (response.status === 200 || response.status === 204) {
        // useStore'a komisyon bilgisini de geçiyoruz
        sendMoney(confirmModal.recipient, parsedAmount, confirmModal.fee); 
        setIsLoading(false);
        
        setAlertConfig({
          visible: true,
          title: parsedAmount > 10000 ? "İşlem Beklemede" : "Başarılı",
          message: parsedAmount > 10000 
            ? "10.000 TL üzeri transferler güvenlik gereği operasyon onayına düşmektedir."
            : "Transferiniz gerçekleştirildi.",
          isSuccess: true
        });
      }
    } catch (error) {
      console.error("API Hatası:", error);
      setIsLoading(false);
      setAlertConfig({
        visible: true,
        title: "Hata",
        message: "İşlem sunucuya iletilemedi. Bağlantınızı kontrol edin.",
        isSuccess: false
      });
    }
  };

  return (
    <LinearGradient colors={['#040268', '#1410B4', '#040268']} style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.content}>
            
            <Pressable 
              onPress={navigateBack} 
              hitSlop={12}
              style={styles.backButton}>
              <Text style={styles.backArrow}>←</Text>
            </Pressable>

            <Text style={styles.title}>Para Gönder</Text>
            <Text style={styles.balanceLabel}>Mevcut Bakiye</Text>
            
            <Text style={styles.balance}>
              ₺{balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </Text>

            <LinearGradient
              colors={PINK_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}>
              <TextInput
                style={styles.input}
                placeholder="Alıcı (Ad Soyad veya IBAN)"
                placeholderTextColor="#FFFFFF"
                value={recipient}
                onChangeText={setRecipient}
              />
              <TextInput
                style={styles.input}
                placeholder="Tutar (₺)"
                placeholderTextColor="#FFFFFF"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </LinearGradient>

            <Pressable
              onPress={handlePreSend}
              disabled={disabled}
              style={({ pressed }) => [
                styles.button,
                (pressed || disabled) && styles.pressed,
              ]}>
              <LinearGradient
                colors={PINK_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}>
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Onayla ve Gönder</Text>
                )}
              </LinearGradient>
            </Pressable>
            
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* YENİ: Transfer Onay Alert Box */}
      <Modal transparent={true} visible={confirmModal.visible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Transfer Onayı</Text>
            <Text style={styles.modalMessage}>
              <Text style={{fontWeight: '700'}}>{confirmModal.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text> tutarı,{'\n'}
              <Text style={{fontWeight: '700'}}>{confirmModal.recipient}</Text> alıcısına,{'\n'}
              <Text style={{fontWeight: '700', color: '#ED21D9'}}>{confirmModal.fee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text> komisyon ile gönderilecektir.{'\n\n'}
              Onaylıyor musunuz?
            </Text>
            
            <View style={styles.confirmButtonsRow}>
              <Pressable 
                onPress={() => setConfirmModal({ ...confirmModal, visible: false })}
                style={[styles.modalButtonContainer, { flex: 1, marginRight: 10, borderWidth: 1, borderColor: '#FFFFFF' }]}>
                <View style={[styles.buttonGradient, { backgroundColor: 'transparent' }]}>
                  <Text style={styles.buttonText}>İptal</Text>
                </View>
              </Pressable>
              
              <Pressable 
                onPress={executeTransfer}
                style={[styles.modalButtonContainer, { flex: 1 }]}>
                <LinearGradient colors={PINK_GRADIENT} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={styles.buttonText}>Onayla</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Mevcut Sonuç Alert Box */}
      <Modal transparent={true} visible={alertConfig.visible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{alertConfig.title}</Text>
            <Text style={styles.modalMessage}>{alertConfig.message}</Text>
            <Pressable 
              onPress={handleModalOk}
              style={({ pressed }) => [styles.modalButtonContainer, pressed && styles.pressed, { width: 140 }]}>
              <LinearGradient colors={PINK_GRADIENT} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
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
  content: { flex: 1, paddingHorizontal: 27, paddingTop: 12 },
  backButton: { alignSelf: 'flex-start', marginLeft: -8 },
  backArrow: { color: '#FFFFFF', fontSize: 34, lineHeight: 40 },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginTop: 20 },
  balanceLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginTop: 20 },
  balance: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 7 },
  card: {
    marginTop: 40,
    borderRadius: 25,
    paddingVertical: 42,
    paddingHorizontal: 28,
    gap: 32,
  },
  input: {
    height: 54,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingHorizontal: 22,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    alignSelf: 'center',
    width: 249,
    height: 54,
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 66,
  },
  buttonGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  pressed: { opacity: 0.6 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(4, 2, 104, 0.8)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '80%', backgroundColor: '#1410B4', borderRadius: 25, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#FFFFFF' },
  modalTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  modalMessage: { color: '#A0A0A0', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  modalButtonContainer: { height: 46, borderRadius: 23, overflow: 'hidden' },
  confirmButtonsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' }
});