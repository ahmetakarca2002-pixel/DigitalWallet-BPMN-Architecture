import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';
import { useStore, Account } from '../store/useStore';

const PINK_GRADIENT = ['#ED21D9', '#970DD9'] as const;
const BG_GRADIENT = ['#040268', '#1410B4', '#040268'] as const;

function BackArrow() {
  return (
    <View style={styles.backBox}>
      <View style={styles.backLine} />
      <View style={styles.backHead} />
    </View>
  );
}

export default function ReceiverAccountSelectionScreen() {
  const { accounts, fetchWalletData } = useStore();

  useEffect(() => {
    fetchWalletData();
  }, []);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleSelectAccount = (account: Account) => {
    router.navigate({ 
      pathname: '/BetweenMyAccountScreen',
      params: { 
        toAccountName: account.account_type, 
        toAccountNumber: account.account_number, 
        toAccountBalance: `₺${account.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` 
      }
    });
  };

  return (
    <LinearGradient colors={BG_GRADIENT} style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.frame}>
          <Pressable onPress={goBack} hitSlop={8} style={styles.backButton}>
            <BackArrow />
          </Pressable>

          <Text style={styles.title}>Alıcı Hesap Seçimi</Text>

          <LinearGradient
            colors={PINK_GRADIENT}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.card}>
            
            {accounts && accounts.length > 0 ? (
              accounts.map((account) => (
                <Pressable
                  key={account.id}
                  onPress={() => handleSelectAccount(account)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
                  <View style={styles.left}>
                    <Text style={styles.accountName}>{account.account_type}</Text>
                    <Text style={styles.accountNumber}>{account.account_number}</Text>
                  </View>
                  <View style={styles.right}>
                    <Text style={styles.balanceLabel}>Bakiye</Text>
                    <Text style={styles.balanceValue}>
                      ₺{account.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text style={{ color: '#FFF', textAlign: 'center', marginVertical: 20 }}>Kayıtlı hesap bulunamadı.</Text>
            )}

          </LinearGradient>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const montserrat = Platform.select({ ios: 'Montserrat', default: undefined });
const lato = Platform.select({ ios: 'Lato', default: undefined });

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  frame: { width: 375, minHeight: 812, paddingTop: 76 },
  backButton: { marginLeft: 17, width: 40, height: 40 },
  backBox: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backLine: { position: 'absolute', left: 11, top: 19, width: 18, height: 2, backgroundColor: '#FFFFFF', borderRadius: 1 },
  backHead: { position: 'absolute', left: 11, top: 14, width: 10, height: 10, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#FFFFFF', transform: [{ rotate: '45deg' }] },
  title: { marginLeft: 27, marginTop: 9, color: '#FFFFFF', fontSize: 18, lineHeight: 22, fontWeight: '700', fontFamily: montserrat },
  card: { marginLeft: 28, marginTop: 42, width: 317, borderRadius: 25, paddingTop: 20, paddingLeft: 20, paddingRight: 20, paddingBottom: 20 },
  item: { height: 76, borderRadius: 25, borderWidth: 2, borderColor: '#FFFFFF', flexDirection: 'row', paddingTop: 16, paddingLeft: 20, marginVertical: 5 },
  pressed: { opacity: 0.6 },
  left: { width: 150, height: 44 },
  accountName: { height: 16, color: '#FFFFFF', fontFamily: lato, fontSize: 14, fontWeight: '500', lineHeight: 16 },
  accountNumber: { marginTop: 9, height: 16, color: '#FFFFFF', fontFamily: lato, fontSize: 14, fontWeight: '500', lineHeight: 16 },
  right: { flex: 1, height: 44, alignItems: 'flex-start' },
  balanceLabel: { color: '#FFFFFF', fontFamily: montserrat, fontSize: 14, fontWeight: '600', lineHeight: 17 },
  balanceValue: { marginTop: 10, color: '#FFFFFF', fontFamily: montserrat, fontSize: 14, fontWeight: '700', lineHeight: 17 },
});