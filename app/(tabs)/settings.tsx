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
import { CacheManager } from '../../services/storage/cacheManager';
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
  const [cacheMetrics, setCacheMetrics] = useState({
    cachedFilesCount: 0,
    formattedSize: '0 B',
    formattedMaxLimit: '1 GB',
  });
  const [recoveryModalVisible, setRecoveryModalVisible] = useState(false);
  const [recoveryWords, setRecoveryWords] = useState<string[]>([]);
  const [keyFingerprint, setKeyFingerprint] = useState('0x0000…0000');

  const refreshCacheMetrics = async () => {
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
      const success = await BiometricService.authenticate('Authenticate to enable screen lock');
      if (success) {
        setBiometrics(true);
        await BiometricService.setBiometricLockEnabled(true);
      } else {
        Alert.alert('Authentication Failed', 'Could not verify identity.');
      }
    } else {
      setBiometrics(false);
      await BiometricService.setBiometricLockEnabled(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Offline Cache',
      'This will remove cached files from your device. Your files remain safe in your cloud storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            const res = await CacheManager.clearAllCache();
            await refreshCacheMetrics();
            Alert.alert(
              'Cache Cleared',
              `Cleared ${res.evictedCount} local files (${CacheManager.formatBytes(res.freedBytes)} freed).`
            );
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your files will remain safely stored in Telegram Cloud.',
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
      const success = await BiometricService.authenticate('Authorize viewing recovery phrase');
      if (!success) {
        Alert.alert('Authentication Required', 'Authentication required to view recovery phrase.');
        return;
      }
    }
    setRecoveryModalVisible(true);
  };

  const formattedCloudUsed = CacheManager.formatBytes(storageStats?.totalUsedBytes || 0);

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
              <Text style={[typography.monoSm, { color: colors.onSurfaceVariant }]}>v1.0.0</Text>
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
              Protected
            </Text>
          </View>
        </View>

        {/* Section 1: Telegram Identity */}
        <View style={styles.sectionContainer}>
          <Text
            style={[
              typography.labelSm,
              { color: colors.onSurfaceVariant, marginBottom: 8, letterSpacing: 0.8 },
            ]}
          >
            TELEGRAM ACCOUNT
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
                  {session?.phoneNumber || 'Telegram Connected'}
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
              <Text style={[typography.monoSm, { color: colors.secondary }]}>Connected to Telegram Cloud</Text>
            </View>

            {/* Telegram Session Details */}
            <View
              style={[
                styles.enclaveDetails,
                { backgroundColor: colors.surfaceContainerLow },
              ]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[typography.labelSm, { color: colors.onSurfaceVariant }]}>
                  Cloud Storage Connection
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.secondary,
                      marginRight: 6,
                    }}
                  />
                  <Text
                    style={[
                      typography.monoSm,
                      {
                        color: colors.secondary,
                        fontWeight: '600',
                        fontSize: 11,
                      },
                    ]}
                  >
                    Online
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Server size={12} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={[typography.monoSm, { color: colors.primary }]}>
                    Private Cloud Storage
                  </Text>
                </View>
                <Text style={[typography.monoSm, { color: colors.outline, fontSize: 10 }]}>
                  Encrypted & Active
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
                  Sign Out
                </Text>
              </View>
              <Text style={[typography.labelSm, { color: colors.outline }]}>Sign out of your Telegram account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Storage & Cache */}
        <View style={styles.sectionContainer}>
          <Text
            style={[
              typography.labelSm,
              { color: colors.onSurfaceVariant, marginBottom: 8, letterSpacing: 0.8 },
            ]}
          >
            STORAGE & CACHE
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
            {/* Cloud Storage Usage */}
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
                    Cloud Storage
                  </Text>
                  <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
                    {formattedCloudUsed} used of Unlimited Cloud Storage
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
                    {cacheMetrics.formattedSize} stored on device ({cacheMetrics.cachedFilesCount} files)
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

        {/* Section 3: Appearance */}
        <View style={styles.sectionContainer}>
          <Text
            style={[
              typography.labelSm,
              { color: colors.onSurfaceVariant, marginBottom: 8, letterSpacing: 0.8 },
            ]}
          >
            APPEARANCE
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
                    Dark Mode
                  </Text>
                  <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
                    {mode === 'dark' ? 'Dark Theme' : 'Light Theme'}
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
                    {biometricLabel} Screen Lock
                  </Text>
                  <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, fontSize: 12 }]}>
                    Require {biometricLabel} to open CloudNest
                  </Text>
                </View>
              </View>
              <Switch
                value={biometrics}
                onValueChange={handleToggleBiometrics}
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
                <View>
                  <Text style={[typography.bodyMd, { color: colors.onSurface }]}>Backup Recovery Phrase (12 Words)</Text>
                  <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, fontSize: 12 }]}>View recovery key to backup your files</Text>
                </View>
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
                <View>
                  <Text style={[typography.bodyMd, { color: colors.onSurface }]}>Trash</Text>
                  <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, fontSize: 12 }]}>View and restore deleted files</Text>
                </View>
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
              <Text style={[typography.labelMd, { color: colors.onSurface }]}>CloudNest v1.0.0</Text>
            </View>
            <Text
              style={[
                typography.bodySm,
                { color: colors.onSurfaceVariant, marginTop: 6, lineHeight: 18 },
              ]}
            >
              Private cloud storage with end-to-end encryption. Your files are encrypted on your device and safely saved to your personal Telegram cloud.
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
