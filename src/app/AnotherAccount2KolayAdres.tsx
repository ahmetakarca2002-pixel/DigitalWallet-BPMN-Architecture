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

const TABS = [
  { key: 'iban', label: "IBAN'a", route: '/AnotherAccount2IBAN' },
  { key: 'alias', label: 'Kolay Adres', route: null },
  { key: 'account', label: 'Hesap Numarasına', route: '/AnotherAccountHavaleEFT' },
] as const;

const ACTIVE_TAB = 1;

const SENDER_ADDRESSES = ['Cep Telefonu', 'E-posta', 'TC Kimlik No'];
const ADDRESS_TYPES = ['Telefon Numarası', 'E-posta', 'TC Kimlik No'];
const TRANSFER_TYPES = ['Havale', 'EFT', 'Fatura', 'Kira', 'Diğer'];

type DropdownKey = 'sender' | 'addressType' | 'transferType';

function ChevronIcon({ open }: { open?: boolean }) {
  return (
    <View style={styles.iconBox}>
      <View style={[styles.chevron, open && styles.chevronOpen]} />
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

type SelectFieldProps = {
  placeholder: string;
  value: string;
  options: string[];
  open: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
};

function SelectField({ placeholder, value, options, open, onToggle, onSelect }: SelectFieldProps) {
  return (
    <>
      <Pressable onPress={onToggle} style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
        <Text style={[styles.input, styles.fullInput, { color: value ? '#FFFFFF' : PLACEHOLDER }]}>
          {value || placeholder}
        </Text>
        <ChevronIcon open={open} />
      </Pressable>
      {open && (
        <View style={styles.typeList}>
          {options.map((option) => (
            <Pressable
              key={option}
              onPress={() => onSelect(option)}
              style={({ pressed }) => [styles.typeItem, pressed && styles.pressed]}>
              <Text style={styles.typeText}>{option}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}

export default function AnotherAccount2KolayAdres() {
  const [senderAddress, setSenderAddress] = useState('');
  const [addressType, setAddressType] = useState('');
  const [transferType, setTransferType] = useState('');
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [dateSelected, setDateSelected] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isFormFilled =
    senderAddress.length > 0 && addressType.length > 0 && transferType.length > 0 && amount.length > 0 && dateSelected;

  const formattedDate = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const toggleDropdown = (key: DropdownKey) => setOpenDropdown((current) => (current === key ? null : key));

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
        receiverType: 'alias',
        senderAddress,
        addressType,
        paymentType: transferType,
        amount: parsedAmount,
        paymentDescription: note,
        transactionDate: date.toISOString(),
      });

      if (response.status === 200) {
        Alert.alert('İşlem Başarılı', 'Para transferiniz gerçekleştirildi.');
        router.replace('/dashboard');
      }
    } catch (error) {
      console.error('Kolay Adres hatası:', error);
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
              {TABS.map((t, i) => {
                const active = i === ACTIVE_TAB;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => {
                      if (!active && t.route) router.replace(t.route);
                    }}
                    style={active ? styles.tabCenter : styles.tabSide}>
                    <Text style={active ? styles.tabActiveText : styles.tabText} numberOfLines={1}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.tabChevronWrap}>
              <View style={styles.tabChevron} />
            </View>

            <LinearGradient colors={PINK_GRADIENT} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.card}>
              <SelectField
                placeholder="Gönderen Adres"
                value={senderAddress}
                options={SENDER_ADDRESSES}
                open={openDropdown === 'sender'}
                onToggle={() => toggleDropdown('sender')}
                onSelect={(v) => {
                  setSenderAddress(v);
                  setOpenDropdown(null);
                }}
              />

              <SelectField
                placeholder="Adres Türü"
                value={addressType}
                options={ADDRESS_TYPES}
                open={openDropdown === 'addressType'}
                onToggle={() => toggleDropdown('addressType')}
                onSelect={(v) => {
                  setAddressType(v);
                  setOpenDropdown(null);
                }}
              />

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
                  style={[styles.input, styles.noteInput]}
                  placeholder="Açıklama"
                  placeholderTextColor={PLACEHOLDER}
                  value={note}
                  onChangeText={setNote}
                />
              </View>

              <SelectField
                placeholder="Transfer Türü"
                value={transferType}
                options={TRANSFER_TYPES}
                open={openDropdown === 'transferType'}
                onToggle={() => toggleDropdown('transferType')}
                onSelect={(v) => {
                  setTransferType(v);
                  setOpenDropdown(null);
                }}
              />
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
  input: { height: 50, padding: 0, color: '#FFFFFF', fontSize: 14, fontWeight: '500', includeFontPadding: false, textAlignVertical: 'center', lineHeight: 50 },
  fullInput: { flex: 1, marginLeft: 20, marginRight: 40 },
  amountInput: { flex: 1, marginLeft: 20 },
  dateInput: { flex: 1, marginLeft: 20 },
  noteInput: { flex: 1, marginLeft: 15, marginRight: 15 },
  currency: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', marginRight: 20, includeFontPadding: false },
  iconBox: { position: 'absolute', right: 14, top: 13, width: 24, height: 24 },
  chevron: { position: 'absolute', left: 6, top: 8, width: 8, height: 8, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#FFFFFF', transform: [{ rotate: '45deg' }] },
  chevronOpen: { transform: [{ rotate: '135deg' }] },
  calIcon: { position: 'absolute', right: 15, top: 14, width: 18, height: 20 },
  calBody: { position: 'absolute', left: 0, top: 2, width: 18, height: 18, borderWidth: 1.6, borderColor: '#FFFFFF', borderRadius: 3 },
  calHeaderLine: { position: 'absolute', left: 0, right: 0, top: 4.4, height: 1.6, backgroundColor: '#FFFFFF' },
  calPin: { position: 'absolute', top: 0, width: 1.6, height: 4, backgroundColor: '#FFFFFF', borderRadius: 1 },
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
