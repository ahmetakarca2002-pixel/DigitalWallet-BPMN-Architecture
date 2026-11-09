import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const PINK_GRADIENT = ['#ED21D9', '#970DD9'] as const;
const BG_GRADIENT = ['#040268', '#1410B4', '#040268'] as const;
const PLACEHOLDER = 'rgba(255,255,255,0.7)';

const TABS = [
  { key: 'iban', label: "IBAN'a", fieldLabel: 'IBAN', keyboard: 'default' },
  { key: 'account', label: 'Hesap Numarasına', fieldLabel: 'Hesap Numarası', keyboard: 'number-pad' },
  { key: 'alias', label: 'Kolay Adres', fieldLabel: 'Telefon Numarası', keyboard: 'phone-pad' },
] as const;

const PAYMENT_TYPES = ['Havale', 'EFT', 'Fatura', 'Kira', 'Diğer'];

const COUNTRY_CODES = [
  { code: '+90', label: '🇹🇷 +90' },
  { code: '+1', label: '🇦🇬 +1' },
  { code: '+1', label: '🇦🇮 +1' },
  { code: '+1', label: '🇦🇸 +1' },
  { code: '+1', label: '🇧🇧 +1' },
  { code: '+1', label: '🇧🇲 +1' },
  { code: '+1', label: '🇧🇸 +1' },
  { code: '+1', label: '🇨🇦 +1' },
  { code: '+1', label: '🇩🇲 +1' },
  { code: '+1', label: '🇩🇴 +1' },
  { code: '+1', label: '🇬🇩 +1' },
  { code: '+1', label: '🇬🇺 +1' },
  { code: '+1', label: '🇯🇲 +1' },
  { code: '+1', label: '🇰🇳 +1' },
  { code: '+1', label: '🇰🇾 +1' },
  { code: '+1', label: '🇱🇨 +1' },
  { code: '+1', label: '🇲🇵 +1' },
  { code: '+1', label: '🇲🇸 +1' },
  { code: '+1', label: '🇵🇷 +1' },
  { code: '+1', label: '🇸🇽 +1' },
  { code: '+1', label: '🇹🇨 +1' },
  { code: '+1', label: '🇹🇹 +1' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+1', label: '🇻🇨 +1' },
  { code: '+1', label: '🇻🇬 +1' },
  { code: '+7', label: '🇰🇿 +7' },
  { code: '+7', label: '🇷🇺 +7' },
  { code: '+20', label: '🇪🇬 +20' },
  { code: '+27', label: '🇿🇦 +27' },
  { code: '+30', label: '🇬🇷 +30' },
  { code: '+31', label: '🇳🇱 +31' },
  { code: '+32', label: '🇧🇪 +32' },
  { code: '+33', label: '🇫🇷 +33' },
  { code: '+34', label: '🇪🇸 +34' },
  { code: '+36', label: '🇭🇺 +36' },
  { code: '+39', label: '🇮🇹 +39' },
  { code: '+39', label: '🇻🇦 +39' },
  { code: '+40', label: '🇷🇴 +40' },
  { code: '+41', label: '🇨🇭 +41' },
  { code: '+43', label: '🇦🇹 +43' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+44', label: '🇬🇬 +44' },
  { code: '+44', label: '🇮🇲 +44' },
  { code: '+44', label: '🇯🇪 +44' },
  { code: '+45', label: '🇩🇰 +45' },
  { code: '+46', label: '🇸🇪 +46' },
  { code: '+47', label: '🇳🇴 +47' },
  { code: '+47', label: '🇸🇯 +47' },
  { code: '+48', label: '🇵🇱 +48' },
  { code: '+49', label: '🇩🇪 +49' },
  { code: '+51', label: '🇵🇪 +51' },
  { code: '+52', label: '🇲🇽 +52' },
  { code: '+53', label: '🇨🇺 +53' },
  { code: '+54', label: '🇦🇷 +54' },
  { code: '+55', label: '🇧🇷 +55' },
  { code: '+56', label: '🇨🇱 +56' },
  { code: '+57', label: '🇨🇴 +57' },
  { code: '+58', label: '🇻🇪 +58' },
  { code: '+60', label: '🇲🇾 +60' },
  { code: '+61', label: '🇦🇺 +61' },
  { code: '+62', label: '🇮🇩 +62' },
  { code: '+63', label: '🇵🇭 +63' },
  { code: '+64', label: '🇳🇿 +64' },
  { code: '+65', label: '🇸🇬 +65' },
  { code: '+66', label: '🇹🇭 +66' },
  { code: '+81', label: '🇯🇵 +81' },
  { code: '+82', label: '🇰🇷 +82' },
  { code: '+84', label: '🇻🇳 +84' },
  { code: '+86', label: '🇨🇳 +86' },
  { code: '+90', label: '🇹🇷 +90' },
  { code: '+91', label: '🇮🇳 +91' },
  { code: '+92', label: '🇵🇰 +92' },
  { code: '+93', label: '🇦🇫 +93' },
  { code: '+94', label: '🇱🇰 +94' },
  { code: '+95', label: '🇲🇲 +95' },
  { code: '+98', label: '🇮🇷 +98' },
  { code: '+211', label: '🇸🇸 +211' },
  { code: '+212', label: '🇪🇭 +212' },
  { code: '+212', label: '🇲🇦 +212' },
  { code: '+213', label: '🇩🇿 +213' },
  { code: '+216', label: '🇹🇳 +216' },
  { code: '+218', label: '🇱🇾 +218' },
  { code: '+220', label: '🇬🇲 +220' },
  { code: '+221', label: '🇸🇳 +221' },
  { code: '+222', label: '🇲🇷 +222' },
  { code: '+223', label: '🇲🇱 +223' },
  { code: '+224', label: '🇬🇳 +224' },
  { code: '+225', label: '🇨🇮 +225' },
  { code: '+226', label: '🇧🇫 +226' },
  { code: '+227', label: '🇳🇪 +227' },
  { code: '+228', label: '🇹🇬 +228' },
  { code: '+229', label: '🇧🇯 +229' },
  { code: '+230', label: '🇲🇺 +230' },
  { code: '+231', label: '🇱🇷 +231' },
  { code: '+232', label: '🇸🇱 +232' },
  { code: '+233', label: '🇬🇭 +233' },
  { code: '+234', label: '🇳🇬 +234' },
  { code: '+235', label: '🇹🇩 +235' },
  { code: '+236', label: '🇨🇫 +236' },
  { code: '+237', label: '🇨🇲 +237' },
  { code: '+238', label: '🇨🇻 +238' },
  { code: '+239', label: '🇸🇹 +239' },
  { code: '+240', label: '🇬🇶 +240' },
  { code: '+241', label: '🇬🇦 +241' },
  { code: '+242', label: '🇨🇬 +242' },
  { code: '+243', label: '🇨🇩 +243' },
  { code: '+244', label: '🇦🇴 +244' },
  { code: '+245', label: '🇬🇼 +245' },
  { code: '+246', label: '🇮🇴 +246' },
  { code: '+248', label: '🇸🇨 +248' },
  { code: '+249', label: '🇸🇩 +249' },
  { code: '+250', label: '🇷🇼 +250' },
  { code: '+251', label: '🇪🇹 +251' },
  { code: '+252', label: '🇸🇴 +252' },
  { code: '+253', label: '🇩🇯 +253' },
  { code: '+254', label: '🇰🇪 +254' },
  { code: '+255', label: '🇹🇿 +255' },
  { code: '+256', label: '🇺🇬 +256' },
  { code: '+257', label: '🇧🇮 +257' },
  { code: '+258', label: '🇲🇿 +258' },
  { code: '+260', label: '🇿🇲 +260' },
  { code: '+261', label: '🇲🇬 +261' },
  { code: '+262', label: '🇷🇪 +262' },
  { code: '+262', label: '🇾🇹 +262' },
  { code: '+263', label: '🇿🇼 +263' },
  { code: '+264', label: '🇳🇦 +264' },
  { code: '+265', label: '🇲🇼 +265' },
  { code: '+266', label: '🇱🇸 +266' },
  { code: '+267', label: '🇧🇼 +267' },
  { code: '+268', label: '🇸🇿 +268' },
  { code: '+269', label: '🇰🇲 +269' },
  { code: '+290', label: '🇸🇭 +290' },
  { code: '+291', label: '🇪🇷 +291' },
  { code: '+297', label: '🇦🇼 +297' },
  { code: '+298', label: '🇫🇴 +298' },
  { code: '+299', label: '🇬🇱 +299' },
  { code: '+350', label: '🇬🇮 +350' },
  { code: '+351', label: '🇵🇹 +351' },
  { code: '+352', label: '🇱🇺 +352' },
  { code: '+353', label: '🇮🇪 +353' },
  { code: '+354', label: '🇮🇸 +354' },
  { code: '+355', label: '🇦🇱 +355' },
  { code: '+356', label: '🇲🇹 +356' },
  { code: '+357', label: '🇨🇾 +357' },
  { code: '+358', label: '🇫🇮 +358' },
  { code: '+359', label: '🇧🇬 +359' },
  { code: '+370', label: '🇱🇹 +370' },
  { code: '+371', label: '🇱🇻 +371' },
  { code: '+372', label: '🇪🇪 +372' },
  { code: '+373', label: '🇲🇩 +373' },
  { code: '+374', label: '🇦🇲 +374' },
  { code: '+375', label: '🇧🇾 +375' },
  { code: '+376', label: '🇦🇩 +376' },
  { code: '+377', label: '🇲🇨 +377' },
  { code: '+378', label: '🇸🇲 +378' },
  { code: '+380', label: '🇺🇦 +380' },
  { code: '+381', label: '🇷🇸 +381' },
  { code: '+382', label: '🇲🇪 +382' },
  { code: '+383', label: '🇽🇰 +383' },
  { code: '+385', label: '🇭🇷 +385' },
  { code: '+386', label: '🇸🇮 +386' },
  { code: '+387', label: '🇧🇦 +387' },
  { code: '+389', label: '🇲🇰 +389' },
  { code: '+420', label: '🇨🇿 +420' },
  { code: '+421', label: '🇸🇰 +421' },
  { code: '+423', label: '🇱🇮 +423' },
  { code: '+500', label: '🇫🇰 +500' },
  { code: '+501', label: '🇧🇿 +501' },
  { code: '+502', label: '🇬🇹 +502' },
  { code: '+503', label: '🇸🇻 +503' },
  { code: '+504', label: '🇭🇳 +504' },
  { code: '+505', label: '🇳🇮 +505' },
  { code: '+506', label: '🇨🇷 +506' },
  { code: '+507', label: '🇵🇦 +507' },
  { code: '+508', label: '🇵🇲 +508' },
  { code: '+509', label: '🇭🇹 +509' },
  { code: '+590', label: '🇧🇱 +590' },
  { code: '+590', label: '🇬🇵 +590' },
  { code: '+590', label: '🇲🇫 +590' },
  { code: '+591', label: '🇧🇴 +591' },
  { code: '+592', label: '🇬🇾 +592' },
  { code: '+593', label: '🇪🇨 +593' },
  { code: '+594', label: '🇬🇫 +594' },
  { code: '+595', label: '🇵🇾 +595' },
  { code: '+596', label: '🇲🇶 +596' },
  { code: '+597', label: '🇸🇷 +597' },
  { code: '+598', label: '🇺🇾 +598' },
  { code: '+599', label: '🇧🇶 +599' },
  { code: '+599', label: '🇨🇼 +599' },
  { code: '+672', label: '🇳🇫 +672' },
  { code: '+673', label: '🇧🇳 +673' },
  { code: '+674', label: '🇳🇷 +674' },
  { code: '+675', label: '🇵🇬 +675' },
  { code: '+676', label: '🇹🇴 +676' },
  { code: '+677', label: '🇸🇧 +677' },
  { code: '+678', label: '🇻🇺 +678' },
  { code: '+679', label: '🇫🇯 +679' },
  { code: '+680', label: '🇵🇼 +680' },
  { code: '+681', label: '🇼🇫 +681' },
  { code: '+682', label: '🇨🇰 +682' },
  { code: '+683', label: '🇳🇺 +683' },
  { code: '+685', label: '🇼🇸 +685' },
  { code: '+686', label: '🇰🇮 +686' },
  { code: '+687', label: '🇳🇨 +687' },
  { code: '+688', label: '🇹🇻 +688' },
  { code: '+689', label: '🇵🇫 +689' },
  { code: '+690', label: '🇹🇰 +690' },
  { code: '+691', label: '🇫🇲 +691' },
  { code: '+692', label: '🇲🇭 +692' },
  { code: '+850', label: '🇰🇵 +850' },
  { code: '+852', label: '🇭🇰 +852' },
  { code: '+853', label: '🇲🇴 +853' },
  { code: '+855', label: '🇰🇭 +855' },
  { code: '+856', label: '🇱🇦 +856' },
  { code: '+880', label: '🇧🇩 +880' },
  { code: '+886', label: '🇹🇼 +886' },
  { code: '+960', label: '🇲🇻 +960' },
  { code: '+961', label: '🇱🇧 +961' },
  { code: '+962', label: '🇯🇴 +962' },
  { code: '+963', label: '🇸🇾 +963' },
  { code: '+964', label: '🇮🇶 +964' },
  { code: '+965', label: '🇰🇼 +965' },
  { code: '+966', label: '🇸🇦 +966' },
  { code: '+967', label: '🇾🇪 +967' },
  { code: '+968', label: '🇴🇲 +968' },
  { code: '+970', label: '🇵🇸 +970' },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+972', label: '🇮🇱 +972' },
  { code: '+973', label: '🇧🇭 +973' },
  { code: '+974', label: '🇶🇦 +974' },
  { code: '+975', label: '🇧🇹 +975' },
  { code: '+976', label: '🇲🇳 +976' },
  { code: '+977', label: '🇳🇵 +977' },
  { code: '+992', label: '🇹🇯 +992' },
  { code: '+993', label: '🇹🇲 +993' },
  { code: '+994', label: '🇦🇿 +994' },
  { code: '+995', label: '🇬🇪 +995' },
  { code: '+996', label: '🇰🇬 +996' },
  { code: '+998', label: '🇺🇿 +998' },
];

let formCache = {
  receiver: '',
  fullName: '',
  paymentType: '',
  amount: '',
  note: '',
  date: new Date(),
  dateSelected: false
};

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

export default function AnotherAccountHavaleEFT() {
  const [tabIndex, setTabIndex] = useState(1);
  const [receiver, setReceiver] = useState(formCache.receiver);
  const [fullName, setFullName] = useState(formCache.fullName);
  const [paymentType, setPaymentType] = useState(formCache.paymentType);
  const [showTypes, setShowTypes] = useState(false);
  const [amount, setAmount] = useState(formCache.amount);
  const [note, setNote] = useState(formCache.note);
  const [date, setDate] = useState(formCache.date);
  const [dateSelected, setDateSelected] = useState(formCache.dateSelected);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [countryCode, setCountryCode] = useState('+90');
  const [showCountryCodes, setShowCountryCodes] = useState(false);

  const [alertConfig, setAlertConfig] = useState({ 
    visible: false, 
    title: '', 
    message: '', 
    isSuccess: false 
  });

  useEffect(() => { formCache.receiver = receiver; }, [receiver]);
  useEffect(() => { formCache.fullName = fullName; }, [fullName]);
  useEffect(() => { formCache.paymentType = paymentType; }, [paymentType]);
  useEffect(() => { formCache.amount = amount; }, [amount]);
  useEffect(() => { formCache.note = note; }, [note]);
  useEffect(() => { formCache.date = date; }, [date]);
  useEffect(() => { formCache.dateSelected = dateSelected; }, [dateSelected]);

  const tab = TABS[tabIndex];
  
  const isFormFilled = (() => {
    if (!amount || !dateSelected) return false;
    if (tabIndex === 0) {
      return receiver.trim().length > 0 && fullName.trim().length > 0;
    }
    if (tabIndex === 1 || tabIndex === 2) { 
      return receiver.trim().length > 0 && fullName.trim().length > 0 && paymentType.length > 0;
    }
    return false;
  })();

  const formattedDate = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const goBack = () => {
    formCache = { receiver: '', fullName: '', paymentType: '', amount: '', note: '', date: new Date(), dateSelected: false };
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

  const handleModalOk = () => {
    const wasSuccess = alertConfig.isSuccess;
    setAlertConfig({ ...alertConfig, visible: false });
    if (wasSuccess) {
      router.replace('/dashboard');
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

    let finalReceiver = receiver;
    if (tabIndex === 2) {
      finalReceiver = `${countryCode}${receiver.replace(/\s/g, '')}`;
    } else if (tabIndex === 0) {
      finalReceiver = receiver.replace(/\s/g, '');
    } else {
      finalReceiver = receiver.trim();
    }

    try {
      const response = await axios.post('http://192.168.1.106:3000/api/external-transfer', {
        customerId: 'Ahmet_123',
        fromAccountNumber: '12345678',        
        receiverType: tab.key,
        receiver: finalReceiver,
        receiverName: fullName.trim(),
        paymentType,
        amount: parsedAmount,
        paymentDescription: note,
        transactionDate: date.toISOString(),
      });

      if (response.status === 200) {
        formCache = { receiver: '', fullName: '', paymentType: '', amount: '', note: '', date: new Date(), dateSelected: false };
        const isHighAmount = parsedAmount > 10000;
        setAlertConfig({
          visible: true,
          title: isHighAmount ? "İşlem Beklemede" : "İşlem Başarılı",
          message: isHighAmount 
            ? "10.000 TL üzeri transferler güvenlik gereği operasyon onayına düşmektedir." 
            : "Para transferiniz gerçekleştirildi.",
          isSuccess: true
        });
      } else {
        setAlertConfig({
          visible: true,
          title: "İşlem Başarılı",
          message: "Para transferiniz gerçekleştirildi.",
          isSuccess: true
        });
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
              {[tabIndex - 1, tabIndex, tabIndex + 1].map((i, pos) => {
                const t = TABS[i];
                if (!t) return <View key={`empty-${pos}`} style={styles.tabSide} />;
                const active = i === tabIndex;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => {
                      if (!active) {
                        setTabIndex(i);
                        setShowTypes(false);
                      }
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

            {/* Pembe kutu kaldırıldı, yerine kalın ve gölgeli lacivert premium katman geldi */}
            <View style={styles.card}>
              
              {tabIndex === 2 ? (
                <View style={[styles.field, { paddingLeft: 0 }]}>
                  <Pressable 
                    onPress={() => setShowCountryCodes(true)}
                    style={styles.countryCodeSelector}
                  >
                    <Text style={styles.countryCodeText}>
                      {COUNTRY_CODES.find(c => c.code === countryCode)?.label || countryCode}
                    </Text>
                  </Pressable>
                  <View style={styles.verticalDivider} />
                  <TextInput
                    style={[styles.input, { flex: 1, paddingLeft: 15 }]}
                    placeholder={tab.fieldLabel}
                    placeholderTextColor={PLACEHOLDER}
                    keyboardType={tab.keyboard as any}
                    value={receiver}
                    onChangeText={setReceiver}
                  />
                </View>
              ) : (
                <View style={styles.field}>
                  <TextInput
                    style={[styles.input, styles.fullInput]}
                    placeholder={tab.fieldLabel}
                    placeholderTextColor={PLACEHOLDER}
                    keyboardType={tab.keyboard as any}
                    autoCapitalize={tab.key === 'iban' ? 'characters' : 'none'}
                    value={receiver}
                    onChangeText={setReceiver}
                  />
                </View>
              )}

              <View style={styles.field}>
                <TextInput
                  style={[styles.input, styles.fullInput]}
                  placeholder="Adı Soyadı"
                  placeholderTextColor={PLACEHOLDER}
                  autoCapitalize="words"
                  value={fullName}
                  onChangeText={setFullName}
                />
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
            </View>

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

      <Modal transparent={true} visible={alertConfig.visible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{alertConfig.title}</Text>
            <Text style={styles.modalMessage}>{alertConfig.message}</Text>
            <Pressable 
              onPress={handleModalOk}
              style={({ pressed }) => [styles.modalButtonContainer, pressed && styles.pressed]}>
              <LinearGradient colors={PINK_GRADIENT} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.buttonText}>Tamam</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal transparent={true} visible={showCountryCodes} animationType="fade">
        <Pressable style={styles.countryModalOverlay} onPress={() => setShowCountryCodes(false)}>
          <View style={styles.countryModalCard}>
            <Text style={styles.countryModalTitle}>Ülke Kodu Seçin</Text>
            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={true}>
              {COUNTRY_CODES.map((country, idx) => (
                <Pressable
                  key={country.code + idx}
                  onPress={() => {
                    setCountryCode(country.code);
                    setShowCountryCodes(false);
                  }}
                  style={({ pressed }) => [styles.countryModalItem, pressed && styles.pressed]}>
                  <Text style={styles.countryModalItemText}>{country.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
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
  title: { marginLeft: 27, marginTop: 9, color: '#FFFFFF', fontSize: 18, lineHeight: 22, fontWeight: '700', fontFamily: montserrat },
  tabs: { marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  tabSide: { width: 90, alignItems: 'center' },
  tabCenter: { flex: 1, alignItems: 'center' },
  tabText: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '500' },
  tabActiveText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', fontFamily: montserrat },
  tabChevronWrap: { alignItems: 'center', height: 14, marginTop: 2 },
  tabChevron: { width: 7, height: 7, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#FFFFFF', transform: [{ rotate: '45deg' }] },
  
  // YENİ: Dashboard alt menüsündeki kalın, koyu lacivert ve gölgeli zemin
  card: { 
    marginLeft: 28, 
    marginTop: 15, 
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
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(4, 2, 104, 0.8)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '80%', backgroundColor: '#1410B4', borderRadius: 25, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#FFFFFF' },
  modalTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  modalMessage: { color: '#A0A0A0', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  modalButtonContainer: { width: 140, height: 46, borderRadius: 23, overflow: 'hidden' },
  buttonGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },

  countryCodeSelector: { height: 50, flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 10 },
  countryCodeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', minWidth: 65 },
  verticalDivider: { width: 2, height: 30, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 0 },
  
  countryModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
  
  // Modal kutusu da ana temaya uysun diye ince kenarlıklı lacivert yapıldı
  countryModalCard: { width: '30%', maxHeight: 400, backgroundColor: '#020024', borderRadius: 25, paddingVertical: 20, paddingHorizontal: 10, borderWidth: 1, borderColor: '#2A2770' },
  countryModalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 15, textAlign: 'center' },
  countryModalItem: { paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#2A2770' },
  countryModalItemText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500', textAlign: 'center' }
});