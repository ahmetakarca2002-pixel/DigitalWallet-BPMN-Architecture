import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, PanResponder, Pressable, RefreshControl, Animated as RNAnimated, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Transaction, useStore } from '../store/useStore';

const AVATAR_URI = 'https://api.builder.io/api/v1/image/assets/TEMP/b49321a121bf7984c417a820185536d9dc486d6a?width=100';
const screenHeight = Dimensions.get('window').height;
const MENU_COLLAPSED_Y = screenHeight - 110;
const MENU_EXPANDED_Y = screenHeight * 0.15;

// 3D CÜZDAN SABİTLERİ
const DESIGN_WIDTH = 599;
const DESIGN_HEIGHT = 470;
const POCKET_URI = 'https://api.builder.io/api/v1/image/assets/TEMP/9e339a930e9b6167d40987ada4702aee81b0ed3b?width=1199';
const NOISE_URI = 'https://api.builder.io/api/v1/image/assets/TEMP/d5a8f6612c4264d90b64e49052012741a871d223?width=1148';

const CARD_TEMPLATES = [
  { bg: '#E20303', border: '#E20303', amount: '#FFFFFF', top: -20, rotate: '0deg', left: 13, height: 312 },
  { bg: '#18024C', border: '#18024C', amount: '#FFFFFF', top: 52, rotate: '-3deg', left: 5, height: 312 },
  { bg: '#01B84E', border: '#02AC4A', amount: '#D7F8E5', top: 129, rotate: '0deg', left: 13, height: 297 }, 
];

const formatAmount = (item: Transaction) => {
  if (item.isReward) return `+${(item.loyaltyPoints || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0 })} Puan`;
  return `${item.amount > 0 ? '+' : ''}${item.amount < 0 ? '-' : ''}₺${Math.abs(item.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
};

function ActionButton({ glyph, label, onPress }: { glyph: string; label: string; onPress?: () => void }) {
  return (
    <View style={styles.actionWrap}>
      <Pressable onPress={onPress} style={styles.actionButton} accessibilityRole="button">
        <Text style={styles.actionGlyph}>{glyph}</Text>
      </Pressable>
      <Text style={styles.actionLabel}>{label}</Text>
    </View>
  );
}

function MenuGridItem({ icon, label,onPress }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.menuGridItem} accessibilityRole="button">
      <MaterialCommunityIcons name={icon} size={22} color="#FFFFFF" style={styles.menuGridIcon} />
      <Text style={styles.menuGridLabel}>{label}</Text>
    </Pressable>
  );
}

const NeonDgpays = ({ refreshing }: { refreshing: boolean }) => {
  const letters = ['D', 'G', 'P', 'A', 'Y', 'S'];
  const animValues = useRef(letters.map(() => new RNAnimated.Value(1))).current;

  useEffect(() => {
    if (refreshing) {
      const animations = animValues.map((val) =>
        RNAnimated.sequence([
          RNAnimated.timing(val, { toValue: 1.5, duration: 150, useNativeDriver: true }),
          RNAnimated.timing(val, { toValue: 1, duration: 150, useNativeDriver: true }),
        ])
      );
      RNAnimated.loop(RNAnimated.stagger(100, animations)).start();
    } else {
      animValues.forEach(val => { val.stopAnimation(); val.setValue(1); });
    }
  }, [refreshing]);

  if (!refreshing) return null;
  return (
    <View style={styles.neonContainer}>
      {letters.map((letter, i) => (
        <RNAnimated.Text key={i} style={[styles.neonText, { transform: [{ scale: animValues[i] }] }]}>{letter}</RNAnimated.Text>
      ))}
    </View>
  );
};

export default function DashboardScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const { balance, accounts, loyaltyPoints, transactions, fetchWalletData, initSocket } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const isMenuExpandedRef = useRef(false);
  const bottomMenuAnim = useRef(new RNAnimated.Value(MENU_COLLAPSED_Y)).current; 
  const peekTextOpacity = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => { fetchWalletData(); initSocket(); }, []);

  const openBottomMenu = () => {
    isMenuExpandedRef.current = true;
    setIsMenuExpanded(true);
    RNAnimated.spring(bottomMenuAnim, { toValue: MENU_EXPANDED_Y, useNativeDriver: true, tension: 50, friction: 8 }).start();
  };

  const closeBottomMenu = () => {
    isMenuExpandedRef.current = false;
    setIsMenuExpanded(false);
    RNAnimated.spring(bottomMenuAnim, { toValue: MENU_COLLAPSED_Y, useNativeDriver: true, tension: 50, friction: 8 }).start();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isMenuExpandedRef.current) {
        RNAnimated.sequence([
          RNAnimated.parallel([
            RNAnimated.timing(bottomMenuAnim, { toValue: MENU_COLLAPSED_Y - 35, duration: 300, useNativeDriver: true }),
            RNAnimated.timing(peekTextOpacity, { toValue: 1, duration: 300, useNativeDriver: true })
          ]),
          RNAnimated.delay(1000),
          RNAnimated.parallel([
            RNAnimated.timing(bottomMenuAnim, { toValue: MENU_COLLAPSED_Y, duration: 300, useNativeDriver: true }),
            RNAnimated.timing(peekTextOpacity, { toValue: 0, duration: 300, useNativeDriver: true })
          ])
        ]).start();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const menuPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (evt, gestureState) => {
        const currentY = isMenuExpandedRef.current ? MENU_EXPANDED_Y : MENU_COLLAPSED_Y;
        const newY = currentY + gestureState.dy;
        if (newY >= MENU_EXPANDED_Y) bottomMenuAnim.setValue(newY); 
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (isMenuExpandedRef.current) {
          if (gestureState.dy > 120 || gestureState.vy > 1.5) closeBottomMenu();
          else openBottomMenu(); 
        } else {
          if (gestureState.dy < -120 || gestureState.vy < -1.5) openBottomMenu();
          else closeBottomMenu(); 
        }
      },
    })
  ).current;

  // ---------------------------------------------------------------------------------
  // BAŞTAN DÜŞÜNÜLMÜŞ, "UZAYAN" KUSURSUZ 2 AŞAMALI İŞLEM GEÇMİŞİ
  // ---------------------------------------------------------------------------------
  const SHEET_HEIGHT = screenHeight * 0.88; // Sabit çok uzun boy
  const FULL_Y = 0; // 2. Aşama (Tam Açık - Top Edge)
  const HALF_Y = screenHeight * 0.45; // 1. Aşama (Yarı Açık)
  const CLOSED_Y = screenHeight; // Kapalı (Aşağı İtilmiş)

  const sheetAnim = useRef(new RNAnimated.Value(HALF_Y)).current;
  const sheetStage = useRef<'closed' | 'half' | 'full'>('half');
  const panStartY = useRef(HALF_Y);

  const animateSheet = (stage: 'closed' | 'half' | 'full') => {
    sheetStage.current = stage;
    let toValue = HALF_Y;
    if (stage === 'closed') toValue = CLOSED_Y;
    else if (stage === 'full') toValue = FULL_Y;

    RNAnimated.spring(sheetAnim, {
      toValue,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const openSheet = () => animateSheet('half');
  const closeSheet = () => animateSheet('closed');

  const historyPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderGrant: () => {
        let start = HALF_Y;
        if (sheetStage.current === 'closed') start = CLOSED_Y;
        if (sheetStage.current === 'full') start = FULL_Y;
        panStartY.current = start;
        sheetAnim.stopAnimation();
      },
      onPanResponderMove: (evt, gestureState) => {
        let newY = panStartY.current + gestureState.dy;
        if (newY < FULL_Y) newY = FULL_Y - Math.sqrt(FULL_Y - newY); // Tepede elastik direnç
        sheetAnim.setValue(newY);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dy, vy } = gestureState;
        const current = sheetStage.current;
        let next = current;

        // Hıza (flick) göre direkt tepkiler
        if (vy < -1.5) next = 'full';
        else if (vy > 1.5) next = 'closed';
        else {
          // Mesafeye göre yumuşak geçişler
          if (current === 'half') {
            if (dy < -60) next = 'full'; // Yukarı
            else if (dy > 60) next = 'closed'; // Aşağı
          } else if (current === 'full') {
            if (dy > 80) next = 'half'; // Aşağı
          } else if (current === 'closed') {
            if (dy < -60) next = 'half'; // Yukarı
          }
        }

        // İstisnai durum: En tepeden çok sert aşağı kaydırma
        if (current === 'full' && vy > 2.0) next = 'closed';

        animateSheet(next);
      },
    })
  ).current;
  // ---------------------------------------------------------------------------------


  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWalletData(), new Promise(resolve => setTimeout(resolve, 800))]);
    setRefreshing(false);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={[styles.transactionRow, { opacity: item.status === 'pending' ? 0.6 : 1 }]}>
      <View style={[styles.transactionIcon, { backgroundColor: item.color }]}>
        <Text style={styles.transactionGlyph}>{item.glyph}</Text>
      </View>
      <View style={styles.transactionInfo}>
        <Text style={[styles.transactionTitle, item.isReward && { color: '#ED21D9' }]}>
          {item.title} {item.status === 'pending' && '(Onay Bekliyor)'}
        </Text>
        <Text style={styles.transactionSubtitle}>
          {item.subtitle} 
          {!item.isReward && item.feeAmount && item.feeAmount > 0 ? ` | Komisyon: ₺${item.feeAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : ''}
          {!item.isReward && item.feeAmount === 0 && ' | Komisyon: Ücretsiz'}
        </Text>
      </View>
      <Text style={[styles.transactionAmount, { color: item.status === 'rejected' ? '#D32F2F' : (item.isReward ? '#ED21D9' : '#FFFFFF') }]}>
        {item.status === 'rejected' ? 'İptal' : formatAmount(item)}
      </Text>
    </View>
  );

  const iconsOpacity = bottomMenuAnim.interpolate({ inputRange: [MENU_EXPANDED_Y, MENU_COLLAPSED_Y], outputRange: [0, 1], extrapolate: 'clamp' });
  const gridOpacity = bottomMenuAnim.interpolate({ inputRange: [MENU_EXPANDED_Y, MENU_COLLAPSED_Y], outputRange: [1, 0], extrapolate: 'clamp' });

  const scale = Math.min((windowWidth - 52) / DESIGN_WIDTH, 1.2);
  const vadesizAccounts = accounts ? accounts.filter(acc => acc.account_type === 'VADESIZ') : [];
  const displayAccounts = vadesizAccounts.length > 0 ? vadesizAccounts.slice(0, 3) : [
    { id: '1', account_type: 'VADESIZ', balance: 9000, currency: 'GBP' },
    { id: '2', account_type: 'VADESIZ', balance: 32000, currency: 'EUR' },
    { id: '3', account_type: 'VADESIZ', balance: 25000, currency: 'USD' }
  ];
  const mainAccountBalance = displayAccounts[0].balance;
  const mainAccountCurrency = displayAccounts[0].currency === 'USD' ? '$' : displayAccounts[0].currency === 'EUR' ? '€' : displayAccounts[0].currency === 'GBP' ? '£' : '₺';

  return (
    <LinearGradient colors={['#0A0580', '#1410B4', '#0A0580']} style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" colors={['#ED21D9']} />} contentContainerStyle={[styles.top, { paddingBottom: 150 }]} showsVerticalScrollIndicator={false}>
          <NeonDgpays refreshing={refreshing} />
          <View style={styles.header}>
            <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')} hitSlop={12}>
              <Text style={styles.backArrow}>←</Text>
            </Pressable>
            <Image source={{ uri: AVATAR_URI }} style={styles.avatar} />
          </View>
          <Text style={styles.title}>Kartlarım</Text>

          {/* 3D CÜZDAN TASARIMI */}
          <Animated.View sharedTransitionTag="pink-card" style={{ width: DESIGN_WIDTH * scale, height: DESIGN_HEIGHT * scale, marginTop: 24, alignSelf: 'center' }}>
            <View style={[styles.walletCanvas, { transform: [{ scale }], transformOrigin: 'top left' }]}>
              
              <View style={styles.walletBack}>
                <Text style={styles.walletTagline}>EASE AROUND YOUR FINANCE</Text>
              </View>

              {displayAccounts.map((acc, index) => {
                const t = CARD_TEMPLATES[index % 3];
                const currencySymbol = acc.currency === 'USD' ? '$' : acc.currency === 'EUR' ? '€' : acc.currency === 'GBP' ? '£' : '₺';
                
                return (
                  <View 
                    key={acc.id} 
                    style={[
                      styles.walletCard, 
                      { backgroundColor: t.bg, borderColor: t.border, left: t.left, top: t.top, height: t.height, transform: [{ rotate: t.rotate }], zIndex: index + 1, elevation: index + 1 }
                    ]}>
                    <Image source={{ uri: NOISE_URI }} style={[StyleSheet.absoluteFill, { opacity: 0.3 }]} resizeMode="cover" />
                    <LinearGradient colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']} style={StyleSheet.absoluteFill} />
                    <View style={styles.walletCardHeader}>
                      <Text style={styles.walletCurrency}>{acc.account_type}</Text>
                      <Text style={[styles.walletCardAmount, { color: t.amount }]}>
                        {currencySymbol}{Number(acc.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </Text>
                    </View>
                    <View style={styles.walletChip} />
                  </View>
                );
              })}

              <View style={[styles.pocketContainer, { zIndex: 10, elevation: 10 }]}>
                <Image source={{ uri: POCKET_URI }} style={styles.pocketImage} resizeMode="stretch" />
              </View>

              <View style={[styles.pocketTextWrapper, { zIndex: 11, elevation: 11 }]}>
                <Text style={styles.pocketTotalLabel}>Toplam Bakiye</Text>
                <Text style={styles.pocketTotalBalance}>₺{balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</Text>
                <View style={styles.pocketDivider} />
                <Text style={styles.pocketActiveLabel}>Ana Vadesiz Hesap</Text>
                <Text style={styles.pocketActiveBalance}>{mainAccountCurrency}{Number(mainAccountBalance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</Text>
              </View>

            </View>
          </Animated.View>

          <View style={styles.balanceRow}>
            <Animated.View sharedTransitionTag="hero-balance" style={{ flexDirection: 'row', gap: 24 }}>
              <View>
                <Text style={styles.balanceLabel}>Bakiye</Text>
                <Text style={styles.balanceValue}>₺{balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</Text>
              </View>
              <View>
                <Text style={styles.balanceLabel}>Puanlar</Text>
                <Text style={[styles.balanceValue, { color: '#ED21D9' }]}>{loyaltyPoints.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}</Text>
              </View>
            </Animated.View>
            <View style={styles.actions}>
              <ActionButton glyph="↺" label="Geçmiş" onPress={openSheet} /> 
              <ActionButton glyph="⇄" label="Gönder" onPress={() => router.push('/SendSelectionScreen')} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* DÜZELTME: position: absolute ve bottom: 0 yapılarak sheet'in "kutu gibi çıkması" engellendi, içerik dipten UZUYOR! */}
      <RNAnimated.View style={[styles.sheet, { position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_HEIGHT, marginTop: 0, zIndex: 50, transform: [{ translateY: sheetAnim }] }]}>
        <View style={styles.sheetHeader} {...historyPanResponder.panHandlers}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Bugün</Text>
        </View>
        <FlatList data={transactions} keyExtractor={(item) => item.id} renderItem={renderTransaction} showsVerticalScrollIndicator={false} contentContainerStyle={styles.list} ListHeaderComponent={<NeonDgpays refreshing={refreshing} />} />
      </RNAnimated.View>

      <RNAnimated.View style={[styles.bottomMenuWrapper, { transform: [{ translateY: bottomMenuAnim }] }]}>
        
        <View {...menuPanResponder.panHandlers} style={styles.bottomMenuHeaderArea}>
          <RNAnimated.Text style={[styles.peekText, { opacity: peekTextOpacity }]}>Yukarı kaydır</RNAnimated.Text>
          <View style={styles.handle} />
        </View>

        <RNAnimated.View {...menuPanResponder.panHandlers} style={[styles.collapsedIconsRow, { opacity: iconsOpacity }]} pointerEvents={isMenuExpanded ? "none" : "auto"}>
          <Pressable style={styles.menuIconBtn} onPress={() => {}}>
            <MaterialCommunityIcons name="home-outline" size={26} color="#FFFFFF" style={styles.menuIconTxt} />
            <Text style={styles.menuIconLabel}>Ana Sayfa</Text>
          </Pressable>
          <Pressable style={styles.qrBtn} onPress={() => {}}>
            <LinearGradient colors={['#ED21D9', '#970DD9']} style={styles.qrCircle}>
              <MaterialCommunityIcons name="qrcode-scan" size={28} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
          <Pressable style={styles.menuIconBtn} onPress={openBottomMenu}>
            <MaterialCommunityIcons name="menu" size={26} color="#FFFFFF" style={styles.menuIconTxt} />
            <Text style={styles.menuIconLabel}>Menü</Text>
          </Pressable>
        </RNAnimated.View>

        <RNAnimated.View style={[styles.expandedMenuContainer, { opacity: gridOpacity }]} pointerEvents={isMenuExpanded ? "auto" : "none"}>
          <ScrollView contentContainerStyle={styles.expandedMenuContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.menuSectionTitle}>Ödemeler</Text>
            <View style={styles.menuGrid}>
              <MenuGridItem icon="receipt" label="Fatura Ödeme" />
              <MenuGridItem icon="bank-outline" label="Kurum Ödemeleri" />
              <MenuGridItem icon="card-bulleted-outline" label="İstanbulkart / Ulaşım Kartları" />
              <MenuGridItem icon="clock-outline" label="Otomatik Ödeme Talimatı" />
            </View>

            <Text style={styles.menuSectionTitle}>Hesaplar ve Kartlar</Text>
            <View style={styles.menuGrid}>
              <MenuGridItem icon="wallet-outline" label="Hesaplarım" onPress={() => router.push('/OpenNewAccountScreen')}/>
              <MenuGridItem icon="credit-card-outline" label="Kredi Kartlarım" onPress={() => router.push('/WalletScreen')}/>
              <MenuGridItem icon="credit-card-multiple-outline" label="Banka Kartlarım" />
              <MenuGridItem icon="credit-card-wireless-outline" label="Sanal Kartlarım" />
            </View>

            <Text style={styles.menuSectionTitle}>Yatırımlar</Text>
            <View style={styles.menuGrid}>
              <MenuGridItem icon="bag-personal-outline" label="Döviz ve Altın" />
              <MenuGridItem icon="chart-line" label="Hisse Senedi ve Fonlar" />
              <MenuGridItem icon="bitcoin" label="Kripto" />
              <MenuGridItem icon="dots-horizontal-circle-outline" label="Diğer" />
            </View>
          </ScrollView>
        </RNAnimated.View>
      </RNAnimated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { paddingHorizontal: 26 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  backArrow: { color: '#FFFFFF', fontSize: 30, fontWeight: '600' },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginTop: 12 },
  
  card: { marginTop: 24, borderRadius: 25, height: 205, paddingHorizontal: 28, paddingVertical: 22, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardBank: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  cardNfc: { color: 'rgba(255,255,255,0.6)', fontSize: 18, fontWeight: '700' },
  cardNumber: { color: '#FFFFFF', fontSize: 20, fontWeight: '600', letterSpacing: 0.5 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mastercard: { flexDirection: 'row', width: 33, height: 22 },
  circle: { width: 22, height: 22, borderRadius: 11 },
  circleRight: { backgroundColor: 'rgba(247,158,27,0.9)', marginLeft: -11 },
  
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 0 },
  balanceLabel: { color: '#A0A0A0', fontSize: 14, fontWeight: '600' }, 
  balanceValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 6 },
  actions: { flexDirection: 'row', gap: 6 },
  actionWrap: { alignItems: 'center', width: 50 },
  actionButton: { width: 42, height: 42, borderRadius: 10, borderWidth: 1, borderColor: '#524FD2', backgroundColor: '#0A0580', alignItems: 'center', justifyContent: 'center' },
  actionGlyph: { color: '#FFFFFF', fontSize: 20 },
  actionLabel: { color: '#FFFFFF', fontSize: 10, fontWeight: '500', marginTop: 6 },
  
  sheet: { flex: 1, marginTop: 20, backgroundColor: '#05004F', borderTopLeftRadius: 30, borderTopRightRadius: 30, zIndex: 1 },
  sheetHeader: { paddingTop: 18, paddingBottom: 10, paddingHorizontal: 26, backgroundColor: 'transparent' },
  handle: { alignSelf: 'center', width: 60, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF', opacity: 0.5 },
  sheetTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginTop: 15 },
  list: { paddingHorizontal: 26, paddingTop: 10, paddingBottom: 130 }, 
  transactionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  transactionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  transactionGlyph: { color: '#FFFFFF', fontSize: 16 },
  transactionInfo: { flex: 1, marginLeft: 14 },
  transactionTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  transactionSubtitle: { color: '#FFFFFF', fontSize: 12, marginTop: 2 },
  transactionAmount: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  neonContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 5 },
  neonText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginHorizontal: 3, textShadowColor: '#ED21D9', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12, letterSpacing: 2 },
  bottomMenuWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, height: screenHeight, backgroundColor: '#020024', borderTopLeftRadius: 30, borderTopRightRadius: 30, zIndex: 10, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.4, shadowRadius: 15 },
  bottomMenuHeaderArea: { paddingTop: 15, paddingBottom: 35, alignItems: 'center', backgroundColor: 'transparent', zIndex: 20 },
  peekText: { position: 'absolute', top: -8, color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }, 
  collapsedIconsRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', position: 'absolute', top: 40, width: '100%', height: 60, zIndex: 15 },
  menuIconBtn: { alignItems: 'center', justifyContent: 'center', width: 70 },
  menuIconTxt: { marginBottom: 6 },
  menuIconLabel: { fontSize: 12, color: '#FFFFFF', fontWeight: '500' },
  qrBtn: { marginTop: -35 },
  qrCircle: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: '#020024' },
  expandedMenuContainer: { flex: 1, marginTop: -40 }, 
  expandedMenuContent: { paddingHorizontal: 20, paddingBottom: 150 },
  menuSectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 10, marginBottom: 12 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuGridItem: { width: '48%', height: 65, borderWidth: 1, borderColor: '#2A2770', borderRadius: 12, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: 'transparent' },
  menuGridIcon: { marginRight: 12 },
  menuGridLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '500', flex: 1, flexWrap: 'wrap', lineHeight: 18 },

  // --- 3D CÜZDAN STİLLERİ ---
  walletCanvas: { width: DESIGN_WIDTH, height: DESIGN_HEIGHT, position: 'absolute', left: 0, top: 0 },
  walletBack: { position: 'absolute', left: 4, top: 5, width: 591, height: 445, borderRadius: 34, backgroundColor: '#161616', borderWidth: 5, borderColor: '#3B3B3B', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 35, shadowOffset: { width: 0, height: 14 }, elevation: 0 },
  walletTagline: { marginTop: 18, color: '#434343', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  walletCard: { position: 'absolute', width: 574,borderRadius: 34, borderWidth: 2, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  walletCardHeader: { position: 'absolute', left: 43, top: 10, width: 490, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletCurrency: { color: '#FFFFFF', fontSize: 26, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 2, height: 1 }, textShadowRadius: 2 },
  walletCardAmount: { fontSize: 26, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  walletChip: { position: 'absolute', left: 42, top: 137, width: 59, height: 40, borderRadius: 6, backgroundColor: '#F6C859', borderWidth: 1, borderColor: '#7D662D', opacity: 0.9 },
  pocketContainer: { position: 'absolute', left: -42, top: -18, width: 685, height: 665 },
  pocketImage: { position: 'absolute', width: '100%', height: '100%' },
  pocketTextWrapper: { position: 'absolute', left: 0, top: 188, width: 599, height: 282, alignItems: 'center', justifyContent: 'center' },
  pocketTotalLabel: { color: '#888888', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  pocketTotalBalance: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', letterSpacing: 0.5 },
  pocketDivider: { width: 30, height: 2, backgroundColor: '#444444', marginVertical: 14, borderRadius: 1 },
  pocketActiveLabel: { color: '#777777', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  pocketActiveBalance: { color: '#D0D0D0', fontSize: 22, fontWeight: '700' },
});