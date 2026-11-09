import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const PINK_GRADIENT = ['#ED21D9', '#970DD9'] as const;
const BG_GRADIENT = ['#040268', '#1410B4', '#040268'] as const;

// Ekranlar arası geçişte Tutar, Not ve Hesapların kaybolmasını engelleyen geçici hafıza
let formCache = {
  fromAccount: null as any,
  toAccount: null as any,
  amount: '',
  note: '',
  date: new Date(),
  dateSelected: false
};
function BackArrow() {
  return (
    <View style={styles.backBox}>
      <View style={styles.backLine} />
      <View style={styles.backHead} />
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

export default function BetweenMyAccountLastScreen() {
  const [amount, setAmount] = useState('5,644.00');
  const [date, setDate] = useState('01.10.2026');
  const [note, setNote] = useState('Ekim ayı kira ödemesi');

  const goBack = () => {
      // İşlemden vazgeçilirse hafızayı temizle
      formCache = { fromAccount: null, toAccount: null, amount: '', note: '', date: new Date(), dateSelected: false };
      
      // Doğrudan SendSelectionScreen sayfasına geri dön
      router.replace('/SendSelectionScreen'); 
    };

  return (
    <LinearGradient colors={BG_GRADIENT} style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}>
        <ScrollView
          style={styles.root}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.frame}>
            <Pressable
              onPress={goBack}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Geri"
              style={styles.backButton}>
              <BackArrow />
            </Pressable>

            <Text style={styles.title}>Hesaplarım Arası Para Gönder</Text>

            <LinearGradient
              colors={PINK_GRADIENT}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.card}>
              <AccountBox
                name="Vadesiz TL"
                number="12345678"
                balance="₺5,644.00"
                onPress={() => router.push('/SenderAccountSelectionScreen')}
              />
              <AccountBox
                name="Vadesiz TL"
                number="12345678"
                balance="₺5,644.00"
                onPress={() => router.push('/ReceiverAccountSelectionScreen')}
              />

              <View style={styles.field}>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="Tutar"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                />
                <Text style={[styles.lato, styles.currency]}>Türk Lirası</Text>
              </View>

              <View style={[styles.field, styles.dateField]}>
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  value={date}
                  onChangeText={setDate}
                  keyboardType="numbers-and-punctuation"
                  placeholder="GG.AA.YYYY"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                />
                <CalendarIcon />
              </View>

              <View style={[styles.field, styles.noteField]}>
                <TextInput
                  style={[styles.input, styles.noteInput]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Açıklama"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                />
              </View>
            </LinearGradient>

            <Pressable
              accessibilityRole="button"
              onPress={() => console.log(`Transfer: ${amount} TL, ${date}, ${note}`)}
              style={({ pressed }) => [styles.confirmWrap, pressed && styles.pressed]}>
              <LinearGradient
                colors={PINK_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.confirmButton}>
                <Text style={styles.confirmText}>Onayla ve Gönder</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  frame: {
    width: 375,
    height: 812,
    paddingTop: 85,
  },
  backButton: {
    marginLeft: 17,
    width: 40,
    height: 40,
  },
  backBox: { width: 40, height: 40 },
  backLine: {
    position: 'absolute',
    left: 11,
    top: 19,
    width: 18,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  backHead: {
    position: 'absolute',
    left: 11,
    top: 14,
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  title: {
    marginLeft: 27,
    marginTop: 9,
    height: 22,
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Montserrat', default: undefined }),
  },
  card: {
    marginLeft: 28,
    marginTop: 25,
    width: 317,
    height: 449,
    borderRadius: 25,
    paddingTop: 26,
    paddingLeft: 25,
  },
  accountBox: {
    width: 268,
    height: 77,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    flexDirection: 'row',
    marginBottom: 20,
  },
  accountLeft: {
    width: 150,
    paddingLeft: 20,
    paddingTop: 16,
  },
  accountNumber: { marginTop: 10 },
  accountRight: {
    paddingTop: 16,
  },
  lato: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '500',
    includeFontPadding: false,
  },
  balanceLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '600',
    includeFontPadding: false,
    fontFamily: Platform.select({ ios: 'Montserrat', default: undefined }),
  },
  balanceValue: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '700',
    includeFontPadding: false,
    fontFamily: Platform.select({ ios: 'Montserrat', default: undefined }),
  },
  field: {
    width: 268,
    height: 54,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateField: { marginBottom: 21 },
  noteField: { marginBottom: 0 },
  input: {
    height: 50,
    padding: 0,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    includeFontPadding: false,
  },
  amountInput: { width: 150, marginLeft: 20 },
  currency: { marginLeft: 0 },
  dateInput: { width: 150, marginLeft: 20 },
  noteInput: { flex: 1, marginLeft: 20, marginRight: 20 },
  calIcon: {
    position: 'absolute',
    left: 215,
    top: 15,
    width: 18,
    height: 20,
  },
  calBody: {
    position: 'absolute',
    left: 0,
    top: 2,
    width: 18,
    height: 18,
    borderWidth: 1.6,
    borderColor: '#FFFFFF',
    borderRadius: 3,
  },
  calHeaderLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 4.4,
    height: 1.6,
    backgroundColor: '#FFFFFF',
  },
  calPin: {
    position: 'absolute',
    top: 0,
    width: 1.6,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  confirmWrap: {
    marginLeft: 63,
    marginTop: 47,
    width: 249,
    height: 54,
  },
  confirmButton: {
    width: 249,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    includeFontPadding: false,
  },
  pressed: { opacity: 0.7 },
});
