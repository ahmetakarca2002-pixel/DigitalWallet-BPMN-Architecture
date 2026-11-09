import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Modal } from 'react-native';

const PINK_GRADIENT = ['#ED21D9', '#970DD9'] as const;
const BG_GRADIENT = ['#040268', '#1410B4', '#040268'] as const;
const PLACEHOLDER = 'rgba(255,255,255,0.7)';

const CURRENCIES = ['USD', 'EUR', 'GBP'];
const EXPENSE_TYPES = ['SHA (Paylaşımlı)', 'OUR (Gönderen)', 'BEN (Alıcı)'];
const PURPOSES = ['Bireysel', 'Ticari', 'Eğitim', 'Yatırım', 'Diğer'];

function ChevronIcon({ down, open }: { down?: boolean; open?: boolean }) {
  const rotate = down ? (open ? '-135deg' : '45deg') : '45deg';
  return (
    <View style={styles.iconBox}>
      <View style={[styles.chevron, down ? styles.chevronDown : null, { transform: [{ rotate }] }]} />
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

export default function SwiftTransferScreen() {
  const [receiver, setReceiver] = useState('');
  const [fullName, setFullName] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [dateSelected, setDateSelected] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [currency, setCurrency] = useState('USD');
  const [expenseType, setExpenseType] = useState('');
  const [purpose, setPurpose] = useState('');

  const [showCurrency, setShowCurrency] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [showPurpose, setShowPurpose] = useState(false);

  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', isSuccess: false });

  const isFormFilled = receiver.trim().length > 0 && fullName.trim().length > 0 && swiftCode.trim().length > 0 && amount.length > 0 && purpose.length > 0 && expenseType.length > 0 && dateSelected;

  const formattedDate = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const goBack = () => router.canGoBack() ? router.back() : router.replace('/');

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setDateSelected(true);
    }
  };

  const handleModalOk = () => {
    const wasSuccess = alertConfig.isSuccess;
    setAlertConfig({ ...alertConfig, visible: false });
    if (wasSuccess) router.replace('/dashboard');
  };

  const executeTransfer = async () => {
    if (!isFormFilled || isLoading) return;
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Hata', 'Geçerli bir tutar girin.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('http://192.168.1.106:3000/api/swift-transfer', {
        customerId: 'Ahmet_123',
        fromAccountNumber: '12345678',        
        receiverIban: receiver.trim(),
        receiverName: fullName.trim(),
        swiftCode: swiftCode.trim(),
        currency: currency,
        expenseType: expenseType.split(' ')[0], // Sadece SHA, OUR veya BEN kısmını alır
        purpose: purpose,
        amount: parsedAmount,
        paymentDescription: note,
        transactionDate: date.toISOString(),
      });

      if (response.status === 200) {
        setAlertConfig({
          visible: true,
          title: "SWIFT İşlemi Alındı",
          message: "Uluslararası transfer talimatınız başarıyla işleme koyulmuştur.",
          isSuccess: true
        });
      }
    } catch (error) {
      console.error('SWIFT hatası:', error);
      Alert.alert('Hata', 'SWIFT işlemi başlatılamadı. Bilgilerinizi kontrol edin.');
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

            <Text style={styles.title}>{'SWIFT\n(Uluslararası Döviz Transferi)'}</Text>

            {/* YENİ: Pembe Gradient iptal edildi. Kalın ve gölgeli lacivert premium katman geldi */}
            <View style={styles.card}>
              
              <View style={styles.field}>
                <TextInput style={[styles.input, styles.fullInput]} placeholder="Alıcı IBAN / Hesap No" placeholderTextColor={PLACEHOLDER} autoCapitalize="characters" value={receiver} onChangeText={setReceiver} />
              </View>

              <View style={styles.field}>
                <TextInput style={[styles.input, styles.fullInput]} placeholder="Alıcı Adı Soyadı" placeholderTextColor={PLACEHOLDER} autoCapitalize="words" value={fullName} onChangeText={setFullName} />
              </View>

              <View style={styles.field}>
                <TextInput style={[styles.input, styles.fullInput]} placeholder="SWIFT / BIC Kodu" placeholderTextColor={PLACEHOLDER} autoCapitalize="characters" value={swiftCode} onChangeText={setSwiftCode} />
              </View>

              {/* Tutar ve Döviz Cinsi Seçimi */}
              <View style={[styles.field, { paddingLeft: 0 }]}>
                <TextInput style={[styles.input, { flex: 1, paddingLeft: 20 }]} placeholder="Tutar" placeholderTextColor={PLACEHOLDER} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
                <View style={styles.verticalDivider} />
                <Pressable onPress={() => setShowCurrency(!showCurrency)} style={styles.currencySelector}>
                  <Text style={styles.currencyText}>{currency}</Text>
                  <View style={{ marginLeft: 6, marginTop: 4 }}>
                  </View>
                </Pressable>
              </View>

              {showCurrency && (
                <View style={styles.typeList}>
                  {CURRENCIES.map((c) => (
                    <Pressable key={c} onPress={() => { setCurrency(c); setShowCurrency(false); }} style={({ pressed }) => [styles.typeItem, pressed && styles.pressed]}>
                      <Text style={styles.typeText}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Masraf Tipi Seçimi */}
              <Pressable onPress={() => setShowExpense(!showExpense)} style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
                <Text style={[styles.input, styles.fullInput, { color: expenseType ? '#FFFFFF' : PLACEHOLDER }]}>{expenseType || 'Masraf Tipi'}</Text>
                <ChevronIcon down open={showExpense} />
              </Pressable>
              {showExpense && (
                <View style={styles.typeList}>
                  {EXPENSE_TYPES.map((e) => (
                    <Pressable key={e} onPress={() => { setExpenseType(e); setShowExpense(false); }} style={({ pressed }) => [styles.typeItem, pressed && styles.pressed]}>
                      <Text style={styles.typeText}>{e}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Transfer Amacı Seçimi */}
              <Pressable onPress={() => setShowPurpose(!showPurpose)} style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
                <Text style={[styles.input, styles.fullInput, { color: purpose ? '#FFFFFF' : PLACEHOLDER }]}>{purpose || 'Transfer Amacı'}</Text>
                <ChevronIcon down open={showPurpose} />
              </Pressable>
              {showPurpose && (
                <View style={styles.typeList}>
                  {PURPOSES.map((p) => (
                    <Pressable key={p} onPress={() => { setPurpose(p); setShowPurpose(false); }} style={({ pressed }) => [styles.typeItem, pressed && styles.pressed]}>
                      <Text style={styles.typeText}>{p}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Pressable onPress={() => setShowDatePicker(true)} style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
                <Text style={[styles.input, styles.fullInput, { color: dateSelected ? '#FFFFFF' : PLACEHOLDER }]}>{dateSelected ? formattedDate : 'Transfer Tarihi'}</Text>
                <CalendarIcon />
              </Pressable>

              {showDatePicker && (
                <View style={Platform.OS === 'ios' ? styles.iosDatePickerContainer : null}>
                  <DateTimePicker value={date} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleDateChange} minimumDate={new Date()} />
                  {Platform.OS === 'ios' && (
                    <Pressable onPress={() => { setDateSelected(true); setShowDatePicker(false); }} style={styles.iosDoneButton}>
                      <Text style={styles.iosDoneText}>Tamam</Text>
                    </Pressable>
                  )}
                </View>
              )}

              <View style={[styles.field, styles.lastField]}>
                <TextInput style={[styles.input, styles.fullInput]} placeholder="Açıklama (İngilizce Önerilir)" placeholderTextColor={PLACEHOLDER} value={note} onChangeText={setNote} />
              </View>

            </View>

            <Pressable accessibilityRole="button" disabled={!isFormFilled || isLoading} onPress={executeTransfer} style={({ pressed }) => [styles.confirmWrap, (pressed || !isFormFilled) && styles.pressed]}>
              <LinearGradient colors={PINK_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.confirmButton}>
                {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.confirmText}>{isFormFilled ? 'Onayla ve Gönder' : 'Devam'}</Text>}
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
            <Pressable onPress={handleModalOk} style={({ pressed }) => [styles.modalButtonContainer, pressed && styles.pressed]}>
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
  
  // YENİ: Dashboard alt menüsündeki kalın, koyu lacivert ve gölgeli zemin
  card: { 
    marginLeft: 28, 
    marginTop: 30, 
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
  
  // YENİ: Menü butonlarındaki ince lacivert kenarlıklı ve hafif şeffaf tasarım
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
  fullInput: { flex: 1, marginLeft: 20, marginRight: 40 },
  iconBox: { position: 'absolute', right: 14, top: 13, width: 24, height: 24 },
  chevron: { position: 'absolute', left: 7, top: 8, width: 8, height: 8, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#FFFFFF' },
  chevronDown: { top: 6 },
  calIcon: { position: 'absolute', right: 15, top: 14, width: 18, height: 20 },
  calBody: { position: 'absolute', left: 0, top: 2, width: 18, height: 18, borderWidth: 1.6, borderColor: '#FFFFFF', borderRadius: 3 },
  calHeaderLine: { position: 'absolute', left: 0, right: 0, top: 4.4, height: 1.6, backgroundColor: '#FFFFFF' },
  calPin: { position: 'absolute', top: 0, width: 1.6, height: 4, backgroundColor: '#FFFFFF', borderRadius: 1 },
  
  // YENİ: Açılır liste (Dropdown) için menüye uyumlu koyu tasarım
  typeList: { 
    borderRadius: 12, 
    backgroundColor: '#020024', 
    borderWidth: 1, 
    borderColor: '#2A2770', 
    marginVertical: 5, 
    paddingVertical: 4 
  },
  typeItem: { paddingVertical: 10, paddingHorizontal: 20 },
  typeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  
  confirmWrap: { alignSelf: 'center', marginTop: 26, width: 249, height: 54, marginBottom: 40 },
  confirmButton: { width: 249, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', includeFontPadding: false },
  pressed: { opacity: 0.7 },
  iosDatePickerContainer: { backgroundColor: 'white', borderRadius: 10, marginTop: 5, marginBottom: 15, overflow: 'hidden', width: 268 },
  iosDoneButton: { backgroundColor: '#ED21D9', padding: 10, alignItems: 'center' },
  iosDoneText: { color: 'white', fontWeight: 'bold' },
  
  currencySelector: { height: 50, flexDirection: 'row', alignItems: 'center', paddingLeft: 15, paddingRight: 35 },
  currencyText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', minWidth: 35 },
  verticalDivider: { width: 2, height: 30, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(4, 2, 104, 0.8)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '80%', backgroundColor: '#1410B4', borderRadius: 25, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#FFFFFF' },
  modalTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  modalMessage: { color: '#A0A0A0', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  modalButtonContainer: { width: 140, height: 46, borderRadius: 23, overflow: 'hidden' },
  buttonGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});