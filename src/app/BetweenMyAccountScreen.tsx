import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const PINK_GRADIENT = ['#ED21D9', '#970DD9'] as const;
const BG_GRADIENT = ['#040268', '#1410B4', '#040268'] as const;
const PLACEHOLDER = 'rgba(255,255,255,0.7)';

let formCache = {
  fromAccount: null as any,
  toAccount: null as any,
  amount: '',
  note: '',
  date: new Date(),
  dateSelected: false
};

function ChevronIcon() {
  return (
    <View style={styles.iconBox}>
      <View style={styles.chevron} />
    </View>
  );
}

function CalendarIcon() {
  return (
    <View style={styles.calIcon}>
      <View style={styles.calBody}>
        <View style={styles.calHeaderLine} />
      </View>
      <View style={[styles.calPin, { left: 5 }]} />
      <View style={[styles.calPin, { left: 13 }]} />
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

type AccountBoxProps = {
  name: string;
  number: string;
  balance: string;
  onPress: () => void;
};

function AccountBox({ name, number, balance, onPress }: AccountBoxProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.accountBox, pressed && styles.pressed]}>
      <View style={styles.accountLeft}>
        <Text style={styles.lato}>{name}</Text>
        <Text style={[styles.lato, styles.accountNumber]}>{number}</Text>
      </View>
      <View style={styles.accountRight}>
        <Text style={styles.balanceLabel}>Bakiye</Text>
        <Text style={styles.balanceValue}>{balance}</Text>
      </View>
    </Pressable>
  );
}

export default function BetweenMyAccountScreen() {
  const { 
    fromAccountName, fromAccountNumber, fromAccountBalance,
    toAccountName, toAccountNumber, toAccountBalance 
  } = useLocalSearchParams();

  const [fromAccount, setFromAccount] = useState(formCache.fromAccount);
  const [toAccount, setToAccount] = useState(formCache.toAccount);
  const [amount, setAmount] = useState(formCache.amount);
  const [note, setNote] = useState(formCache.note);
  const [date, setDate] = useState(formCache.date);
  const [dateSelected, setDateSelected] = useState(formCache.dateSelected);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (fromAccountName && fromAccountNumber && fromAccountBalance) {
      const acc = { name: fromAccountName as string, number: fromAccountNumber as string, balance: fromAccountBalance as string };
      setFromAccount(acc);
      formCache.fromAccount = acc;
    }
  }, [fromAccountName, fromAccountNumber, fromAccountBalance]);

  useEffect(() => {
    if (toAccountName && toAccountNumber && toAccountBalance) {
      const acc = { name: toAccountName as string, number: toAccountNumber as string, balance: toAccountBalance as string };
      setToAccount(acc);
      formCache.toAccount = acc;
    }
  }, [toAccountName, toAccountNumber, toAccountBalance]);

  useEffect(() => { formCache.amount = amount; }, [amount]);
  useEffect(() => { formCache.note = note; }, [note]);
  useEffect(() => { formCache.date = date; }, [date]);
  useEffect(() => { formCache.dateSelected = dateSelected; }, [dateSelected]);

  const goBack = () => {
    formCache = { fromAccount: null, toAccount: null, amount: '', note: '', date: new Date(), dateSelected: false };
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setDateSelected(true);
    }
  };

  const formattedDate = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const isFormFilled = amount.length > 0 && fromAccount !== null && toAccount !== null;

  const executeInternalTransfer = async () => {
    if (!isFormFilled || isLoading) return;
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    setIsLoading(true);

    try {
      const response = await axios.post('http://192.168.1.106:3000/api/internal-transfer', {
        customerId: "Ahmet_123",
        fromAccountNumber: fromAccount.number, 
        toAccountNumber: toAccount.number, 
        amount: parsedAmount,
        paymentDescription: note,
        transactionDate: date.toISOString() 
      });

      if (response.status === 200) {
        formCache = { fromAccount: null, toAccount: null, amount: '', note: '', date: new Date(), dateSelected: false };
        Alert.alert('İşlem Başarılı', 'Para transferiniz anında gerçekleşti.');
        router.replace('/dashboard');
      }
    } catch (error) {
      console.error("İç transfer hatası:", error);
      Alert.alert('Hata', 'Transfer gerçekleştirilemedi. Bakiyenizi kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={BG_GRADIENT} style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
        <ScrollView
          style={styles.root}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.frame}>
            <Pressable onPress={goBack} hitSlop={8} style={styles.backButton}>
              <BackArrow />
            </Pressable>

            <Text style={styles.title}>Hesaplarım Arası Para Gönder</Text>

            {/* Pembe Gradient iptal edildi. Menüdeki gibi lacivert, gölgeli kutu geldi. */}
            <View style={styles.card}>
              
              {fromAccount ? (
                <AccountBox
                  name={fromAccount.name}
                  number={fromAccount.number}
                  balance={fromAccount.balance}
                  onPress={() => router.push('/SenderAccountSelectionScreen')}
                />
              ) : (
                <View style={{ marginBottom: 5 }}>
                  <Pressable onPress={() => router.push('/SenderAccountSelectionScreen')} style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
                    <Text style={[styles.input, { paddingLeft: 20 }]}>Vadesiz Hesap (₺)</Text>
                    <ChevronIcon />
                  </Pressable>
                </View>
              )}

              {toAccount ? (
                <AccountBox
                  name={toAccount.name}
                  number={toAccount.number}
                  balance={toAccount.balance}
                  onPress={() => router.push('/ReceiverAccountSelectionScreen')}
                />
              ) : (
                <View style={{ marginBottom: 5 }}>
                  <Pressable onPress={() => router.push('/ReceiverAccountSelectionScreen')} style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
                    <Text style={[styles.input, { paddingLeft: 20 }]}>Alıcı Hesap Seç</Text>
                    <ChevronIcon />
                  </Pressable>
                </View>
              )}

              <View style={styles.field}>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  placeholder="Tutar Girin"
                  placeholderTextColor={PLACEHOLDER}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
                <Text style={styles.currency}>Türk Lirası</Text>
              </View>

              <Pressable 
                onPress={() => setShowDatePicker(true)} 
                style={({ pressed }) => [styles.field, pressed && styles.pressed]}
              >
                <Text style={[styles.input, styles.dateInput, { color: dateSelected ? '#FFFFFF' : PLACEHOLDER }]}>
                  {dateSelected ? formattedDate : 'GG.AA.YYYY'}
                </Text>
                <CalendarIcon />
              </Pressable>

              {showDatePicker && (
                <View style={Platform.OS === 'ios' ? styles.iosDatePickerContainer : null}>
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                  {Platform.OS === 'ios' && (
                    <Pressable onPress={() => setShowDatePicker(false)} style={styles.iosDoneButton}>
                      <Text style={styles.iosDoneText}>Tamam</Text>
                    </Pressable>
                  )}
                </View>
              )}

              <View style={[styles.field, styles.lastField]}>
                <TextInput
                  style={[styles.input, styles.fullInput]}
                  placeholder="Açıklama"
                  placeholderTextColor={PLACEHOLDER}
                  value={note}
                  onChangeText={setNote}
                />
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={!isFormFilled || isLoading}
              onPress={executeInternalTransfer}
              style={({ pressed }) => [styles.confirmWrap, (pressed || !isFormFilled) && styles.pressed]}>
              <LinearGradient colors={PINK_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.confirmButton}>
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmText}>{isFormFilled ? 'Onayla ve Gönder' : 'Devam'}</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  
  // YENİ: Dashboard alt menüsündeki kalın, koyu lacivert ve gölgeli zemin
  card: { 
    marginLeft: 28, 
    marginTop: 42, 
    width: 317, 
    backgroundColor: '#020024',
    borderRadius: 30, 
    paddingTop: 24, 
    paddingHorizontal: 24, 
    paddingBottom: 24,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  
  // YENİ: İnce kenarlıklı, şeffaf ve köşeleri daha az yuvarlak (menü gibi) hesap kutucuğu
  accountBox: { 
    height: 77, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#2A2770', 
    backgroundColor: 'rgba(20, 16, 180, 0.2)',
    flexDirection: 'row', 
    marginVertical: 5 
  },
  accountLeft: { flex: 1, paddingLeft: 20, paddingTop: 16 },
  accountNumber: { marginTop: 10 },
  accountRight: { paddingTop: 16, paddingRight: 20, alignItems: 'flex-end' },
  lato: { color: '#FFFFFF', fontSize: 14, lineHeight: 17, fontWeight: '500', includeFontPadding: false },
  balanceLabel: { color: '#FFFFFF', fontSize: 14, lineHeight: 17, fontWeight: '600', includeFontPadding: false, fontFamily: montserrat },
  balanceValue: { marginTop: 10, color: '#FFFFFF', fontSize: 14, lineHeight: 17, fontWeight: '700', includeFontPadding: false, fontFamily: montserrat },
  
  // YENİ: Menü butonlarındaki ince şeffaf tasarımı kopyalayan input alanları
  field: { 
    height: 54, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#2A2770', 
    backgroundColor: 'rgba(20, 16, 180, 0.2)',
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 5 
  },
  
  lastField: { marginBottom: 5 },
  input: { height: 50, padding: 0, color: '#FFFFFF', fontSize: 14, fontWeight: '500', includeFontPadding: false, textAlignVertical: 'center', lineHeight: 50 },
  fullInput: { flex: 1, marginLeft: 20, marginRight: 20 },
  amountInput: { flex: 1, marginLeft: 20 },
  currency: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', marginRight: 15, includeFontPadding: false },
  dateInput: { flex: 1, marginLeft: 20 },
  
  calIcon: { position: 'absolute', right: 15, top: 14, width: 18, height: 20 },
  calBody: { position: 'absolute', left: 0, top: 2, width: 18, height: 18, borderWidth: 1.6, borderColor: '#FFFFFF', borderRadius: 3 },
  calHeaderLine: { position: 'absolute', left: 0, right: 0, top: 4.4, height: 1.6, backgroundColor: '#FFFFFF' },
  calPin: { position: 'absolute', top: 0, width: 1.6, height: 4, backgroundColor: '#FFFFFF', borderRadius: 1 },
  iconBox: { position: 'absolute', right: 14, top: 13, width: 24, height: 24 },
  chevron: { position: 'absolute', left: 7, top: 8, width: 8, height: 8, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#FFFFFF', transform: [{ rotate: '45deg' }] },
  
  confirmWrap: { alignSelf: 'center', marginTop: 26, width: 249, height: 54, marginBottom: 40 },
  confirmButton: { width: 249, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', includeFontPadding: false },
  pressed: { opacity: 0.7 },
  iosDatePickerContainer: { backgroundColor: 'white', borderRadius: 10, marginTop: 5, marginBottom: 15, overflow: 'hidden' },
  iosDoneButton: { backgroundColor: '#ED21D9', padding: 10, alignItems: 'center' },
  iosDoneText: { color: 'white', fontWeight: 'bold' }
});