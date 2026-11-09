import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '../store/useStore';

const DESIGN_WIDTH = 599;
const DESIGN_HEIGHT = 470;
const FONT = Platform.select({ ios: 'System', default: undefined });

// ORİJİNAL FİGMA GÖRSELLERİ (Deri dokusu ve kumlama efekti)
const POCKET_URI = 'https://api.builder.io/api/v1/image/assets/TEMP/9e339a930e9b6167d40987ada4702aee81b0ed3b?width=1199';
const NOISE_URI = 'https://api.builder.io/api/v1/image/assets/TEMP/d5a8f6612c4264d90b64e49052012741a871d223?width=1148';

// KART ŞABLONLARI
const CARD_TEMPLATES = [
  { bg: '#E20303', border: '#E20303', amount: '#FFFFFF', top: -20, rotate: '0deg', left: 13, height: 312 },
  { bg: '#18024C', border: '#18024C', amount: '#FFFFFF', top: 52, rotate: '-3deg', left: 5, height: 312 },
  { bg: '#01B84E', border: '#02AC4A', amount: '#D7F8E5', top: 129, rotate: '0deg', left: 13, height: 341 }, 
];

export default function WalletScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  
  const { balance, accounts } = useStore();
  const scale = Math.min((width - 32) / DESIGN_WIDTH, 1.2);

  // SADECE VADESİZ HESAPLARI FİLTRELE
  const vadesizAccounts = accounts ? accounts.filter(acc => acc.account_type === 'VADESIZ') : [];
  
  const displayAccounts = vadesizAccounts.length > 0 ? vadesizAccounts.slice(0, 3) : [
    { id: '1', account_type: 'VADESIZ', balance: 9000, currency: 'GBP' },
    { id: '2', account_type: 'VADESIZ', balance: 32000, currency: 'EUR' },
    { id: '3', account_type: 'VADESIZ', balance: 25000, currency: 'USD' }
  ];

  // Siyah cüzdanın üzerinde gösterilecek Ana Vadesiz Hesap Verileri
  const mainAccountBalance = displayAccounts[0].balance;
  const mainAccountCurrency = displayAccounts[0].currency === 'USD' ? '$' : displayAccounts[0].currency === 'EUR' ? '€' : displayAccounts[0].currency === 'GBP' ? '£' : '₺';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={20}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#1A1A1A" />
          <Text style={styles.backText}>Geri</Text>
        </Pressable>
      </View>

      <View style={{ width: DESIGN_WIDTH * scale, height: DESIGN_HEIGHT * scale, marginTop: 40 }}>
        <View style={[styles.canvas, { transform: [{ scale }], transformOrigin: 'top left' }]}>
          
          <View style={styles.back}>
            <Text style={styles.tagline}>EASE AROUND YOUR FINANCE</Text>
          </View>

          {/* DİNAMİK KARTLAR */}
          {displayAccounts.map((acc, index) => {
            const t = CARD_TEMPLATES[index % 3];
            const currencySymbol = acc.currency === 'USD' ? '$' : acc.currency === 'EUR' ? '€' : acc.currency === 'GBP' ? '£' : '₺';
            
            return (
              <View 
                key={acc.id} 
                style={[
                  styles.card, 
                  { 
                    backgroundColor: t.bg, borderColor: t.border, left: t.left, top: t.top, 
                    height: t.height, transform: [{ rotate: t.rotate }], 
                    zIndex: index + 1, elevation: index + 1 
                  }
                ]}>
                
                <Image source={{ uri: NOISE_URI }} style={StyleSheet.absoluteFill} resizeMode="cover" opacity={0.3} />
                <LinearGradient colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']} style={StyleSheet.absoluteFill} />
                
                <View style={styles.cardHeader}>
                  <Text style={styles.currency}>{acc.account_type}</Text>
                  <Text style={[styles.cardAmount, { color: t.amount }]}>
                    {currencySymbol}{Number(acc.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.chip} />
              </View>
            );
          })}

          {/* DERİ CÜZDAN GÖRSELİ */}
          <View style={[styles.pocketContainer, { zIndex: 10, elevation: 10 }]}>
            <Image source={{ uri: POCKET_URI }} style={styles.pocketImage} resizeMode="stretch" />
          </View>

          {/* CÜZDAN ÜZERİNDEKİ MERKEZİ YAZILAR */}
          <View style={[styles.pocketTextWrapper, { zIndex: 11, elevation: 11 }]}>
            
            <Text style={styles.pocketTotalLabel}>Toplam Bakiye</Text>
            <Text style={styles.pocketTotalBalance}>
              ₺{balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </Text>
            
            <View style={styles.pocketDivider} />

            <Text style={styles.pocketActiveLabel}>Ana Vadesiz Hesap</Text>
            <Text style={styles.pocketActiveBalance}>
              {mainAccountCurrency}{Number(mainAccountBalance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </Text>

          </View>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E0DDF7', alignItems: 'center' },
  header: { width: '100%', paddingHorizontal: 20, paddingTop: 10 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backText: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  canvas: { width: DESIGN_WIDTH, height: DESIGN_HEIGHT, position: 'absolute', left: 0, top: 0 },
  
  back: { position: 'absolute', left: 4, top: 31, width: 591, height: 434, borderRadius: 34, backgroundColor: '#161616', borderWidth: 5, borderColor: '#3B3B3B', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 35, shadowOffset: { width: 0, height: 14 }, elevation: 0 },
  tagline: { marginTop: 18, color: '#434343', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, fontFamily: FONT },
  
  card: { position: 'absolute', width: 574, borderRadius: 34, borderWidth: 2, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  cardHeader: { position: 'absolute', left: 43, top: 25, width: 490, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  currency: { color: '#FFFFFF', fontSize: 26, fontWeight: '700', fontFamily: FONT, textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 2, height: 1 }, textShadowRadius: 2 },
  cardAmount: { fontSize: 26, fontWeight: '700', fontFamily: FONT, textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  chip: { position: 'absolute', left: 42, top: 137, width: 59, height: 40, borderRadius: 6, backgroundColor: '#F6C859', borderWidth: 1, borderColor: '#7D662D', opacity: 0.9 },
  
  pocketContainer: { position: 'absolute', left: -45, top: -10, width: 690, height: 682 },
  pocketImage: { position: 'absolute', width: '100%', height: '100%' },
  
  // YENİ EKLENEN MERKEZİ YAZI STİLLERİ
  pocketTextWrapper: { position: 'absolute', left: 0, top: 188, width: 599, height: 282, alignItems: 'center', justifyContent: 'center' },
  pocketTotalLabel: { color: '#888888', fontSize: 14, fontWeight: '700', fontFamily: FONT, marginBottom: 4 },
  pocketTotalBalance: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', fontFamily: FONT, letterSpacing: 0.5 },
  pocketDivider: { width: 30, height: 2, backgroundColor: '#444444', marginVertical: 14, borderRadius: 1 },
  pocketActiveLabel: { color: '#777777', fontSize: 12, fontWeight: '700', fontFamily: FONT, marginBottom: 4 },
  pocketActiveBalance: { color: '#D0D0D0', fontSize: 22, fontWeight: '700', fontFamily: FONT },
});