import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Modal, Switch } from 'react-native';
import { useStore } from '../store/useStore'; 

const PINK_GRADIENT = ['#ED21D9', '#970DD9'] as const;
const BG_GRADIENT = ['#040268', '#1410B4', '#040268'] as const;
const PLACEHOLDER = 'rgba(255,255,255,0.7)';

const ACCOUNT_TYPES = ['VADESIZ', 'VADELI'];
const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP'];

function ChevronIcon({ down, open }: { down?: boolean; open?: boolean }) {
  const rotate = down ? (open ? '-135deg' : '45deg') : '45deg';
  return (
    <View style={styles.iconBox}>
      <View style={[styles.chevron, down ? styles.chevronDown : null, { transform: [{ rotate }] }]} />
    </View>
  );
}

function BackArrow() {
  return (
    <View style={styles.backBox}>
      <View style={styles.backLine} />
      <View style={styles.backHead} />
    </View>
  );
}

export default function OpenNewAccountScreen() {
  const { accounts, fetchWalletData } = useStore();
  
  const [accountType, setAccountType] = useState('');
  const [currency, setCurrency] = useState('');
  const [sourceAccount, setSourceAccount] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [daysToMaturity, setDaysToMaturity] = useState(''); // YENİ: Vade günü
  const [isCurrencyConverted, setIsCurrencyConverted] = useState(false);

  const [showAccountTypes, setShowAccountTypes] = useState(false);
  const [showCurrencies, setShowCurrencies] = useState(false);
  const [showSourceAccounts, setShowSourceAccounts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', isSuccess: false });

  useEffect(() => {
    fetchWalletData();
  }, []);

  const goBack = () => router.canGoBack() ? router.back() : router.replace('/');

  const handleModalOk = () => {
    const wasSuccess = alertConfig.isSuccess;
    setAlertConfig({ ...alertConfig, visible: false });
    if (wasSuccess) router.replace('/dashboard');
  };

  // YENİ: Eğer hesap VADELI ise vade günü boş olamaz
  const isFormFilled = accountType && currency && sourceAccount && amount.trim().length > 0 && (accountType === 'VADELI' ? daysToMaturity.trim().length > 0 : true);
  const isCrossCurrency = sourceAccount && currency && sourceAccount.currency !== currency;

  const executeAccountOpening = async () => {
    if (!isFormFilled || isLoading) return;
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    const parsedDays = parseInt(daysToMaturity) || 0;
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Hata', 'Geçerli bir başlangıç tutarı girin.');
      return;
    }

    if (accountType === 'VADELI' && (isNaN(parsedDays) || parsedDays <= 0)) {
      Alert.alert('Hata', 'Geçerli bir vade gün sayısı girin.');
      return;
    }

    if (isCrossCurrency && !isCurrencyConverted) {
      Alert.alert('Kur Onayı Gerekli', 'Farklı para birimleri arası aktarım için kur dönüşümü onayını vermelisiniz.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('http://192.168.1.106:3000/api/open-account', {
        customerId: 'Ahmet_123',
        sourceAccountNumber: sourceAccount.account_number,
        senderAccountType: sourceAccount.account_type,
        senderCurrency: sourceAccount.currency || 'TRY',
        receiverAccountType: accountType,
        receiverCurrency: currency,
        amount: parsedAmount,
        daysToMaturity: parsedDays, // YENİ: Vade günü API'ye gönderiliyor
        isCurrencyConverted: isCurrencyConverted,
        isAccountExpired: false 
      });

      if (response.status === 200) {
        setAlertConfig({
          visible: true,
          title: "Talimat Alındı",
          message: "Yeni hesap açılış ve bakiye aktarım talebiniz işleme alınmıştır. Durumu işlem geçmişinden takip edebilirsiniz.",
          isSuccess: true
        });
      }
    } catch (error) {
      console.error('Hesap açma hatası:', error);
      Alert.alert('Hata', 'İşlem gerçekleştirilemedi. Bakiyenizi kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={BG_GRADIENT} style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
        <ScrollView style={styles.root} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.frame}>
            <Pressable onPress={goBack} hitSlop={8} style={styles.backButton}>
              <BackArrow />
            </Pressable>

            <Text style={styles.title}>{'Yeni Hesap Aç'}</Text>

            <View style={styles.card}>
              
              <Pressable onPress={() => setShowAccountTypes(!showAccountTypes)} style={styles.field}>
                <Text style={[styles.input, styles.fullInput, { color: accountType ? '#FFFFFF' : PLACEHOLDER }]}>
                  {accountType ? `${accountType} HESAP` : 'Açılacak Hesap Tipi'}
                </Text>
                <ChevronIcon down open={showAccountTypes} />
              </Pressable>
              {showAccountTypes && (
                <View style={styles.typeList}>
                  {ACCOUNT_TYPES.map((type) => (
                    <Pressable key={type} onPress={() => { setAccountType(type); setShowAccountTypes(false); }} style={styles.typeItem}>
                      <Text style={styles.typeText}>{type}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* YENİ: Eğer hesap VADELI ise Vade Günü inputu çıkar */}
              {accountType === 'VADELI' && (
                <View style={styles.field}>
                  <TextInput
                    style={[styles.input, styles.fullInput]}
                    placeholder="Vade (Gün Sayısı) Örn: 32"
                    placeholderTextColor={PLACEHOLDER}
                    keyboardType="number-pad"
                    value={daysToMaturity}
                    onChangeText={setDaysToMaturity}
                  />
                  <Text style={styles.currency}>Gün</Text>
                </View>
              )}

              <Pressable onPress={() => setShowCurrencies(!showCurrencies)} style={styles.field}>
                <Text style={[styles.input, styles.fullInput, { color: currency ? '#FFFFFF' : PLACEHOLDER }]}>
                  {currency || 'Döviz Cinsi (Para Birimi)'}
                </Text>
                <ChevronIcon down open={showCurrencies} />
              </Pressable>
              {showCurrencies && (
                <View style={styles.typeList}>
                  {CURRENCIES.map((curr) => (
                    <Pressable key={curr} onPress={() => { setCurrency(curr); setShowCurrencies(false); }} style={styles.typeItem}>
                      <Text style={styles.typeText}>{curr}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Pressable onPress={() => setShowSourceAccounts(!showSourceAccounts)} style={styles.field}>
                <Text style={[styles.input, styles.fullInput, { color: sourceAccount ? '#FFFFFF' : PLACEHOLDER }]} numberOfLines={1}>
                  {sourceAccount ? `${sourceAccount.account_type} (${sourceAccount.currency}) - ${sourceAccount.balance} ₺` : 'İlk Aktarım Yapılacak Hesap'}
                </Text>
                <ChevronIcon down open={showSourceAccounts} />
              </Pressable>
              {showSourceAccounts && (
                <View style={styles.typeList}>
                  {accounts.map((acc) => (
                    <Pressable key={acc.id} onPress={() => { setSourceAccount(acc); setShowSourceAccounts(false); }} style={styles.typeItem}>
                      <Text style={styles.typeText}>{acc.account_type} ({acc.currency || 'TRY'}) - {acc.account_number}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={[styles.field, (!isCrossCurrency ? styles.lastField : {})]}>
                <TextInput
                  style={[styles.input, styles.fullInput]}
                  placeholder="Başlangıç Tutarı"
                  placeholderTextColor={PLACEHOLDER}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
                <Text style={styles.currency}>{sourceAccount?.currency || currency || 'Birim'}</Text>
              </View>

              {isCrossCurrency && (
                <View style={[styles.field, styles.lastField, { justifyContent: 'space-between', paddingRight: 15 }]}>
                  <Text style={[styles.input, { marginLeft: 20, flex: 1 }]} numberOfLines={2}>
                    Kur dönüşüm işlemlerini{'\n'}ve komisyonları onaylıyorum
                  </Text>
                  <Switch
                    value={isCurrencyConverted}
                    onValueChange={setIsCurrencyConverted}
                    trackColor={{ false: '#2A2770', true: '#ED21D9' }}
                    thumbColor={'#FFFFFF'}
                  />
                </View>
              )}

            </View>

            <Pressable
              accessibilityRole="button"
              disabled={!isFormFilled || isLoading}
              onPress={executeAccountOpening}
              style={({ pressed }) => [styles.confirmWrap, (pressed || !isFormFilled) && styles.pressed]}>
              <LinearGradient colors={PINK_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.confirmButton}>
                {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.confirmText}>Onayla ve Hesap Aç</Text>}
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal transparent={true} visible={alertConfig.visible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{alertConfig.title}</Text>
            <Text style={styles.modalMessage}>{alertConfig.message}</Text>
            <Pressable onPress={handleModalOk} style={styles.modalButtonContainer}>
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

const montserrat = Platform.select({ ios: 'Montserrat', default: undefined });
const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  frame: { width: 375, minHeight: 812, paddingTop: 76 },
  backButton: { marginLeft: 17, width: 40, height: 40 },
  backBox: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backLine: { position: 'absolute', left: 11, top: 19, width: 18, height: 2, backgroundColor: '#FFFFFF', borderRadius: 1 },
  backHead: { position: 'absolute', left: 11, top: 14, width: 10, height: 10, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#FFFFFF', transform: [{ rotate: '45deg' }] },
  title: { marginLeft: 27, marginTop: 9, color: '#FFFFFF', fontSize: 18, lineHeight: 28, fontWeight: '700', fontFamily: montserrat },
  card: { marginLeft: 28, marginTop: 30, width: 317, backgroundColor: '#020024', borderRadius: 30, paddingTop: 24, paddingHorizontal: 24, paddingBottom: 24, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20 },
  field: { minHeight: 54, borderRadius: 12, borderWidth: 1, borderColor: '#2A2770', backgroundColor: 'rgba(20, 16, 180, 0.2)', flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  lastField: { marginBottom: 5 },
  input: { padding: 0, color: '#FFFFFF', fontSize: 14, fontWeight: '500', includeFontPadding: false, textAlignVertical: 'center' },
  fullInput: { flex: 1, marginLeft: 20, marginRight: 40, height: 50, lineHeight: 50 },
  currency: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', marginRight: 15, includeFontPadding: false },
  iconBox: { position: 'absolute', right: 14, top: 13, width: 24, height: 24 },
  chevron: { position: 'absolute', left: 7, top: 8, width: 8, height: 8, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#FFFFFF' },
  chevronDown: { top: 6 },
  typeList: { borderRadius: 12, backgroundColor: '#020024', borderWidth: 1, borderColor: '#2A2770', marginVertical: 5, paddingVertical: 4 },
  typeItem: { paddingVertical: 10, paddingHorizontal: 20 },
  typeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  confirmWrap: { alignSelf: 'center', marginTop: 26, width: 249, height: 54, marginBottom: 40 },
  confirmButton: { width: 249, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', includeFontPadding: false },
  pressed: { opacity: 0.7 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(4, 2, 104, 0.8)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '80%', backgroundColor: '#1410B4', borderRadius: 25, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#FFFFFF' },
  modalTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  modalMessage: { color: '#A0A0A0', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  modalButtonContainer: { width: 140, height: 46, borderRadius: 23, overflow: 'hidden' },
  buttonGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' }
});