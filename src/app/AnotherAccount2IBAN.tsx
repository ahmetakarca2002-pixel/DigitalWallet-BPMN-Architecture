import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const PINK_GRADIENT = ['#ED21D9', '#970DD9'] as const;
const BG_GRADIENT = ['#040268', '#1410B4', '#040268'] as const;
const PLACEHOLDER = 'rgba(255,255,255,0.7)';

const PAYMENT_TYPES = ['Havale', 'EFT', 'Fatura', 'Kira', 'Diğer'];

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

function CameraIcon() {
  return (
    <View style={styles.camIcon}>
      <View style={styles.camTop} />
      <View style={styles.camBody}>
        <View style={styles.camLens} />
      </View>
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

export default function AnotherAccount2IBAN() {
  const [iban, setIban] = useState('');
  const [fullName, setFullName] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [showTypes, setShowTypes] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [dateSelected, setDateSelected] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isFormFilled =
    iban.trim().length > 0 && fullName.trim().length > 0 && paymentType.length > 0 && amount.length > 0 && dateSelected;

  const formattedDate = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setDateSelected(true);
    }
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
      const response = await axios.post('http://192.168.1.106:3000/api/external-transfer', {
        customerId: 'Ahmet_123',
        receiverType: 'iban',
        receiver: iban.replace(/\s/g, ''),
        receiverName: fullName.trim(),
        paymentType,
        amount: parsedAmount,
        paymentDescription: note,
        transactionDate: date.toISOString(),
      });

      if (response.status === 200) {
        Alert.alert('İşlem Başarılı', 'Para transferiniz gerçekleştirildi.');
        router.replace('/dashboard');
      }
    } catch (error) {
      console.error('Havale/EFT hatası:', error);
      Alert.alert('Hata', 'Transfer gerçekleştirilemedi. Bilgilerinizi kontrol edin.');
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

            <Text style={styles.title}>{'Başka Hesaba Para Gönder\n(Havale/EFT)'}</Text>

            <View style={styles.tabs}>
              <Pressable onPress={() => router.replace('/AnotherAccount2KolayAdres')} style={styles.tabSide}>
                <Text style={styles.tabText} numberOfLines={1}>Kolay Adres</Text>
              </Pressable>
              <View style={styles.tabCenter}>
                <Text style={styles.tabActiveText} numberOfLines={1}>IBAN’a</Text>
              </View>
              <Pressable onPress={() => router.replace('/AnotherAccountHavaleEFT')} style={styles.tabSide}>
                <Text style={styles.tabText} numberOfLines={1}>Hesap Numarasına</Text>
              </Pressable>
            </View>
            <View style={styles.tabChevronWrap}>
              <View style={styles.tabChevron} />
            </View>

            <LinearGradient colors={PINK_GRADIENT} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.card}>
              <View style={styles.field}>
                <TextInput
                  style={[styles.input, styles.fullInput]}
                  placeholder="IBAN Numarası"
                  placeholderTextColor={PLACEHOLDER}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  value={iban}
                  onChangeText={setIban}
                />
                <CameraIcon />
              </View>

              <View style={styles.field}>
                <TextInput
                  style={[styles.input, styles.fullInput]}
                  placeholder="Adı Soyadı"
                  placeholderTextColor={PLACEHOLDER}
                  autoCapitalize="words"
                  value={fullName}
                  onChangeText={setFullName}
                />
                <ChevronIcon />
              </View>

              <Pressable
                onPress={() => setShowTypes((v) => !v)}
                style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
                <Text style={[styles.input, styles.fullInput, { color: paymentType ? '#FFFFFF' : PLACEHOLDER }]}>
                  {paymentType || 'Ödeme Türü'}
                </Text>
                <ChevronIcon down open={showTypes} />
              </Pressable>

              {showTypes && (
                <View style={styles.typeList}>
                  {PAYMENT_TYPES.map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => {
                        setPaymentType(type);
                        setShowTypes(false);
                      }}
                      style={({ pressed }) => [styles.typeItem, pressed && styles.pressed]}>
                      <Text style={styles.typeText}>{type}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
                <Text style={[styles.input, styles.dateInput, { color: dateSelected ? '#FFFFFF' : PLACEHOLDER }]}>
                  {dateSelected ? formattedDate : 'Tarih'}
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
                    <Pressable
                      onPress={() => {
                        setDateSelected(true);
                        setShowDatePicker(false);
                      }}
                      style={styles.iosDoneButton}>
                      <Text style={styles.iosDoneText}>Tamam</Text>
                    </Pressable>
                  )}
                </View>
              )}

              <View style={styles.field}>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  placeholder="Tutar"
                  placeholderTextColor={PLACEHOLDER}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
                <Text style={styles.currency}>Türk Lirası</Text>
              </View>

              <View style={[styles.field, styles.lastField]}>
                <TextInput
                  style={[styles.input, styles.fullInput]}
                  placeholder="Açıklama"
                  placeholderTextColor={PLACEHOLDER}
                  value={note}
                  onChangeText={setNote}
                />
              </View>
            </LinearGradient>

            <Pressable
              accessibilityRole="button"
              disabled={!isFormFilled || isLoading}
              onPress={executeTransfer}
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
  tabs: { marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  tabSide: { width: 90, alignItems: 'center' },
  tabCenter: { flex: 1, alignItems: 'center' },
  tabText: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '500' },
  tabActiveText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', fontFamily: montserrat },
  tabChevronWrap: { alignItems: 'center', height: 14, marginTop: 2 },
  tabChevron: { width: 7, height: 7, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#FFFFFF', transform: [{ rotate: '45deg' }] },
  card: { marginLeft: 28, marginTop: 8, width: 317, borderRadius: 25, paddingTop: 12, paddingLeft: 25, paddingBottom: 12 },
  field: { width: 268, height: 54, borderRadius: 25, borderWidth: 2, borderColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  lastField: { marginBottom: 5 },
  input: { height: 50, padding: 0, color: '#FFFFFF', fontSize: 14, fontWeight: '500', includeFontPadding: false, textAlignVertical: 'center', lineHeight: 50 },
  fullInput: { flex: 1, marginLeft: 20, marginRight: 40 },
  amountInput: { flex: 1, marginLeft: 15 },
  dateInput: { flex: 1, marginLeft: 15 },
  currency: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', marginRight: 15, includeFontPadding: false },
  iconBox: { position: 'absolute', right: 14, top: 13, width: 24, height: 24 },
  chevron: { position: 'absolute', left: 7, top: 8, width: 8, height: 8, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#FFFFFF' },
  chevronDown: { top: 6 },
  calIcon: { position: 'absolute', right: 15, top: 14, width: 18, height: 20 },
  calBody: { position: 'absolute', left: 0, top: 2, width: 18, height: 18, borderWidth: 1.6, borderColor: '#FFFFFF', borderRadius: 3 },
  calHeaderLine: { position: 'absolute', left: 0, right: 0, top: 4.4, height: 1.6, backgroundColor: '#FFFFFF' },
  calPin: { position: 'absolute', top: 0, width: 1.6, height: 4, backgroundColor: '#FFFFFF', borderRadius: 1 },
  camIcon: { position: 'absolute', right: 14, top: 14, width: 22, height: 20 },
  camTop: { position: 'absolute', left: 7, top: 0, width: 8, height: 4, borderTopLeftRadius: 2, borderTopRightRadius: 2, borderWidth: 1.6, borderBottomWidth: 0, borderColor: '#FFFFFF' },
  camBody: { position: 'absolute', left: 0, top: 3, width: 22, height: 16, borderWidth: 1.6, borderColor: '#FFFFFF', borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  camLens: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.6, borderColor: '#FFFFFF' },
  typeList: { width: 268, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 5, paddingVertical: 4 },
  typeItem: { paddingVertical: 10, paddingHorizontal: 20 },
  typeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  confirmWrap: { alignSelf: 'center', marginTop: 26, width: 249, height: 54, marginBottom: 40 },
  confirmButton: { width: 249, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', includeFontPadding: false },
  pressed: { opacity: 0.7 },
  iosDatePickerContainer: { backgroundColor: 'white', borderRadius: 10, marginTop: 5, marginBottom: 15, overflow: 'hidden', width: 268 },
  iosDoneButton: { backgroundColor: '#ED21D9', padding: 10, alignItems: 'center' },
  iosDoneText: { color: 'white', fontWeight: 'bold' },
});
