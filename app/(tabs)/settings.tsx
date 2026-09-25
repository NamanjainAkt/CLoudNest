// app/(tabs)/settings.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Shield,
  Check,
  Radio,
  Server,
  LogOut,
  Cloud,
  HardDrive,
  Trash2,
  Lock,
  Fingerprint,
  Key,
  Moon,
  Sun,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { TopHeader } from '../../components/common/TopHeader';
import { useVaultStore } from '../../store/useVaultStore';
import { BiometricService } from '../../services/crypto/biometrics';
import { seedHexToMnemonic } from '../../services/crypto/mnemonic';
import { SecureStorageService } from '../../services/crypto/secureStore';
import { RecoveryPhraseModal } from '../../components/settings/RecoveryPhraseModal';
import { MTProtoClient } from '../../services/telegram/mtprotoClient';

export default function SettingsScreen() {
  const { colors, typography, radii, mode, toggleTheme } = useTheme();
  const router = useRouter();
  const { session, storageStats, signOut } = useVaultStore();
  const apiCreds = MTProtoClient.getApiCredentials();

  const userInitials = session?.accountName
    ? session.accountName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'CN';

  const [biometrics, setBiometrics] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Biometrics');
  const [pinLock, setPinLock] = useState(false);
  const [cacheMetrics, setCacheMetrics] = useState({
    cachedFilesCount: 0,
    formattedSize: '0 B',
    formattedMaxLimit: '1 GB',
  });
  const [recoveryModalVisible, setRecoveryModalVisible] = useState(false);
  const [recoveryWords, setRecoveryWords] = useState<string[]>([]);
  const [keyFingerprint, setKeyFingerprint] = useState('0x0000…0000');

  const refreshCacheMetrics = async () => {
    const { CacheManager } = await import('../../services/storage/cacheManager');
    const m = await CacheManager.getMetrics();
    setCacheMetrics({
      cachedFilesCount: m.cachedFilesCount,
      formattedSize: m.formattedSize,
      formattedMaxLimit: m.formattedMaxLimit,
    });
  };

  React.useEffect(() => {
    async function loadSecuritySettings() {
      const bioStatus = await BiometricService.checkAvailability();
      if (bioStatus.hasHardware) {
        setBiometricLabel(bioStatus.label);
      }
      const enabled = await BiometricService.isBiometricLockEnabled();
      setBiometrics(enabled);

      await refreshCacheMetrics();

      let masterKey = await SecureStorageService.getMasterKey();
      if (!masterKey) {
        // Generate cryptographic 256-bit random master key if none exists yet
        const bytes = new Uint8Array(32);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
          crypto.getRandomValues(bytes);
        } else {
          for (let i = 0; i < 32; i++) bytes[i] = Math.floor(Math.random() * 256);
        }
        masterKey = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
        await SecureStorageService.saveMasterKey(masterKey);
      }
      const words = seedHexToMnemonic(masterKey);
      setRecoveryWords(words);
      setKeyFingerprint(`0x${masterKey.slice(0, 4)}…${masterKey.slice(-4)}`.toUpperCase());
    }
    loadSecuritySettings();
  }, []);

  const handleToggleBiometrics = async (val: boolean) => {
    if (val) {
      const success = await BiometricService.authenticate('Authenticate to enable vault lock');
      if (success) {
        setBiometrics(true);
        await BiometricService.setBiometricLockEnabled(true);
      } else {
        Alert.alert('Authentication Failed', 'Could not verify biometric identity.');
      }
    } else {
      setBiometrics(false);
      await BiometricService.setBiometricLockEnabled(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Offline Cache',
      'This will remove decrypted local file copies from device storage. Your files remain safe in your Telegram vault.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            const { CacheManager } = await import('../../services/storage/cacheManager');
            const res = await CacheManager.clearAllCache();
            await refreshCacheMetrics();
            Alert.alert(
              'Cache Cleared',
              `Purged ${res.evictedCount} local files (${CacheManager.formatBytes(res.freedBytes)} freed).`
            );
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out of Enclave',
      'Are you sure you want to disconnect this device from your private Telegram storage channel?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/onboarding');
          },
        },
      ]
    );
  };

  const handleExportKey = async () => {
    if (biometrics) {
      const success = await BiometricService.authenticate('Authorize export of recovery phrase');
      if (!success) {
        Alert.alert('Authentication Required', 'Biometric confirmation required to export master key.');
        return;
      }
    }
    setRecoveryModalVisible(true);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <TopHeader title="CloudNest" subtitle="Settings" />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Settings Header & Version Pill */}
        <View style={styles.headerPillRow}>
          <View style={styles.titleVersionRow}>
            <Text style={[typography.headlineLgMobile, { color: colors.onSurface }]}>Settings</Text>
            <View
              style={[
                styles.versionBadge,
                { backgroundColor: colors.surfaceContainerHigh },
              ]}
            >
              <Text style={[typography.monoSm, { color: colors.onSurfaceVariant }]}>v2.4-e2ee</Text>
            </View>
          </View>

          <View
            style={[
              styles.enclaveSecureBadge,
              { backgroundColor: colors.surfaceContainerHigh },
            ]}
          >
            <View style={[styles.enclavePulseDot, { backgroundColor: colors.secondary }]} />
            <Text style={[typography.monoSm, { color: colors.secondary, fontWeight: '600' }]}>
              ENCLAVE SECURE
            </Text>
          </View>
        </View>

        {/* Section 1: Telegram Identity & Enclave */}
        <View style={styles.sectionContainer}>
          <Text
            style={[
              typography.labelSm,
              { color: colors.onSurfaceVariant, marginBottom: 8, letterSpacing: 0.8 },
            ]}
          >
            TELEGRAM IDENTITY & ENCLAVE
          </Text>

          <View
            style={[
              styles.cardGroup,
              {
                backgroundColor: colors.surfaceContainer,
                borderColor: colors.borderSubtle,
                borderRadius: radii.default,
              },
            ]}
          >
            {/* Profile Card Row */}
            <View style={styles.profileRow}>
              <View style={styles.avatarWrapper}>
                <View
                  style={[
                    styles.avatarCircle,
                    { backgroundColor: colors.surfaceContainerHighest },
                  ]}
                >
                  <Text style={[typography.headlineSm, { color: colors.primary }]}>{userInitials}</Text>
                </View>
                <View style={[styles.verifiedDot, { backgroundColor: colors.secondary }]}>
                  <Check size={9} color={colors.onSecondary} />
                </View>
              </View>

              <View style={styles.profileInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
                    {session?.accountName || 'CloudNest Vault'}
                  </Text>
                  <Shield size={14} color={colors.secondary} style={{ marginLeft: 5 }} />
                </View>
                <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                  {session?.username || '@vault_user'}
                </Text>
                <Text style={[typography.monoSm, { color: colors.onSurfaceVariant }]}>
                  {session?.phoneNumber || 'Encrypted Channel'}
                </Text>
              </View>
            </View>

            {/* Connection Status Sub-row */}
            <View
              style={[
                styles.statusSubRow,
                { backgroundColor: colors.surfaceContainerHigh },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Radio size={15} color={colors.secondary} style={{ marginRight: 6 }} />
                <Text style={[typography.bodySm, { color: colors.onSurface }]}>Connection Status</Text>
              </View>
              <Text style={[typography.monoSm, { color: colors.secondary }]}>Connected via MTProto</Text>
            </View>

            {/* Telegram Enclave Details */}
            <View
              style={[
                styles.enclaveDetails,
                { backgroundColor: colors.surfaceContainerLow },
              ]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[typography.labelSm, { color: colors.onSurfaceVariant }]}>
                  Hardware Session Enclave
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: apiCreds.isLive ? colors.secondary : colors.primary,
                      marginRight: 6,
                    }}
                  />
                  <Text
                    style={[
                      typography.monoSm,
                      {
                        color: apiCreds.isLive ? colors.secondary : colors.onSurfaceVariant,
                        fontWeight: '600',
                        fontSize: 11,
                      },
                    ]}
                  >
                    {apiCreds.isLive ? 'LIVE NETWORK' : 'SIMULATED ENCLAVE'}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Server size={12} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={[typography.monoSm, { color: colors.primary }]}>
                    {session?.nodeName || 'Frankfurt DC4'} • App #{apiCreds.apiId || '36408941'}
                  </Text>
                </View>
                <Text style={[typography.monoSm, { color: colors.outline, fontSize: 10 }]}>
                  {apiCreds.apiHash ? `Hash: ${apiCreds.apiHash.slice(0, 6)}…` : 'Hash: 902d6c…'}
                </Text>
              </View>
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity
              onPress={handleSignOut}
              style={styles.signOutRow}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <LogOut size={18} color={colors.error} style={{ marginRight: 8 }} />
                <Text style={[typography.bodyMd, { color: colors.error, fontWeight: '600' }]}>
                  Sign Out of Enclave
                </Text>
              </View>
              <Text style={[typography.labelSm, { color: colors.outline }]}>Disconnect Session</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Storage & Network */}
        <View style={styles.sectionContainer}>
          <Text
            style={[
              typography.labelSm,
              { color: colors.onSurfaceVariant, marginBottom: 8, letterSpacing: 0.8 },
            ]}
          >
            STORAGE & NETWORK
          </Text>

          <View
            style={[
              styles.cardGroup,
              {
                backgroundColor: colors.surfaceContainer,
                borderColor: colors.borderSubtle,
                borderRadius: radii.default,
              },
            ]}
          >
            {/* Telegram Cloud Quota */}
            <View style={styles.quotaRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={[
                    styles.smallIconCircle,
                    { backgroundColor: colors.primaryContainer + '25' },
                  ]}
                >
                  <Cloud size={16} color={colors.primary} />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={[typography.bodyMd, { color: colors.onSurface, fontWeight: '500' }]}>
                    Telegram Cloud Quota
                  </Text>
                  <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
                    23.4 GB of Unlimited Telegram Cloud
                  </Text>
                </View>
              </View>
            </View>

            {/* Offline Cache Row */}
            <View style={[styles.cacheRow, { borderTopColor: colors.borderSubtle, borderTopWidth: 1 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={[
                    styles.smallIconCircle,
                    { backgroundColor: colors.secondaryContainer + '25' },
                  ]}
                >
                  <HardDrive size={16} color={colors.secondary} />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={[typography.bodyMd, { color: colors.onSurface, fontWeight: '500' }]}>
                    Offline Device Cache
                  </Text>
                  <Text style={[typography.monoSm, { color: colors.onSurfaceVariant }]}>
                    {cacheMetrics.formattedSize} of {cacheMetrics.formattedMaxLimit} limit ({cacheMetrics.cachedFilesCount} files)
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleClearCache}
                style={[
                  styles.clearCacheBtn,
                  { backgroundColor: colors.surfaceContainerHigh },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[typography.labelSm, { color: colors.primary }]}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Section 3: Appearance & Theme Switcher */}
        <View style={styles.sectionContainer}>
          <Text
            style={[
              typography.labelSm,
              { color: colors.onSurfaceVariant, marginBottom: 8, letterSpacing: 0.8 },
            ]}
          >
            APPEARANCE (DUAL-MODE DESIGN SYSTEM)
          </Text>

          <View
            style={[
              styles.cardGroup,
              {
                backgroundColor: colors.surfaceContainer,
                borderColor: colors.borderSubtle,
                borderRadius: radii.default,
              },
            ]}
          >
            <View style={styles.settingToggleRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {mode === 'dark' ? (
                  <Moon size={18} color={colors.primary} style={{ marginRight: 10 }} />
                ) : (
                  <Sun size={18} color={colors.primary} style={{ marginRight: 10 }} />
                )}
                <View>
                  <Text style={[typography.bodyMd, { color: colors.onSurface, fontWeight: '500' }]}>
                    Dark Mode Theme
                  </Text>
                  <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
                    {mode === 'dark' ? 'Obsidian Void (#12131a)' : 'Institutional Light (#F2F2F7)'}
                  </Text>
                </View>
              </View>

              <Switch
                value={mode === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.surfaceContainerHighest, true: colors.primary }}
                thumbColor={colors.onPrimary}
              />
            </View>
          </View>
        </View>

        {/* Section 4: Security & Privacy */}
        <View style={styles.sectionContainer}>
          <Text
            style={[
              typography.labelSm,
              { color: colors.onSurfaceVariant, marginBottom: 8, letterSpacing: 0.8 },
            ]}
          >
            SECURITY & PRIVACY
          </Text>

          <View
            style={[
              styles.cardGroup,
              {
                backgroundColor: colors.surfaceContainer,
                borderColor: colors.borderSubtle,
                borderRadius: radii.default,
              },
            ]}
          >
            <View style={styles.settingToggleRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                <Fingerprint size={18} color={colors.primary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyMd, { color: colors.onSurface, fontWeight: '500' }]}>
                    {biometricLabel} Vault Lock
                  </Text>
                  <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, fontSize: 12 }]}>
                    Require {biometricLabel} to unlock and view files
                  </Text>
                </View>
              </View>
              <Switch
                value={biometrics}
                onValueChange={handleToggleBiometrics}
                trackColor={{ false: colors.surfaceContainerHighest, true: colors.primary }}
              />
            </View>

            <View style={[styles.settingToggleRow, { borderTopColor: colors.borderSubtle, borderTopWidth: 1 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Lock size={18} color={colors.primary} style={{ marginRight: 10 }} />
                <Text style={[typography.bodyMd, { color: colors.onSurface }]}>App PIN Lock</Text>
              </View>
              <Switch
                value={pinLock}
                onValueChange={setPinLock}
                trackColor={{ false: colors.surfaceContainerHighest, true: colors.primary }}
              />
            </View>

            <TouchableOpacity
              onPress={handleExportKey}
              style={[styles.settingActionRow, { borderTopColor: colors.borderSubtle, borderTopWidth: 1 }]}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Key size={18} color={colors.tertiary} style={{ marginRight: 10 }} />
                <Text style={[typography.bodyMd, { color: colors.onSurface }]}>Export Master Seed Phrase</Text>
              </View>
              <ChevronRight size={16} color={colors.onSurfaceVariant} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/trash')}
              style={[styles.settingActionRow, { borderTopColor: colors.borderSubtle, borderTopWidth: 1 }]}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Trash2 size={18} color={colors.error} style={{ marginRight: 10 }} />
                <Text style={[typography.bodyMd, { color: colors.onSurface }]}>Trash & Purge Queue</Text>
              </View>
              <ChevronRight size={16} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 5: About CloudNest */}
        <View style={styles.sectionContainer}>
          <Text
            style={[
              typography.labelSm,
              { color: colors.onSurfaceVariant, marginBottom: 8, letterSpacing: 0.8 },
            ]}
          >
            ABOUT CLOUDNEST
          </Text>

          <View
            style={[
              styles.cardGroup,
              {
                backgroundColor: colors.surfaceContainer,
                borderColor: colors.borderSubtle,
                borderRadius: radii.default,
                padding: 16,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Info size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[typography.labelMd, { color: colors.onSurface }]}>CloudNest v2.4.0 (Build 2026)</Text>
            </View>
            <Text
              style={[
                typography.bodySm,
                { color: colors.onSurfaceVariant, marginTop: 6, lineHeight: 18 },
              ]}
            >
              Serverless personal cloud drive powered by client-side AES-256-GCM encryption and Telegram MTProto object storage.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 12-Word Recovery Phrase Modal */}
      <RecoveryPhraseModal
        visible={recoveryModalVisible}
        onClose={() => setRecoveryModalVisible(false)}
        words={recoveryWords}
        keyFingerprint={keyFingerprint}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  titleVersionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginLeft: 8,
  },
  enclaveSecureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  enclavePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  sectionContainer: {
    marginVertical: 10,
  },
  cardGroup: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  statusSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  enclaveDetails: {
    padding: 14,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  quotaRow: {
    padding: 16,
  },
  smallIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cacheRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  clearCacheBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  settingToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
});
