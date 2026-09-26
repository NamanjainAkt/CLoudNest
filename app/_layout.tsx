import '../services/telegram/polyfill';
import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { useVaultStore } from '../store/useVaultStore';
import { BiometricService } from '../services/crypto/biometrics';
import { BiometricLockOverlay } from '../components/auth/BiometricLockOverlay';
import { BackgroundSync } from '../services/sync/backgroundSync';

function AppContent() {
  const { isDark } = useTheme();
  const initialize = useVaultStore((s) => s.initialize);
  const session = useVaultStore((s) => s.session);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      await initialize();
      BackgroundSync.startQueueWatcher(3000);
      const enabled = await BiometricService.isBiometricLockEnabled();
      const currentSession = useVaultStore.getState().session;
      if (enabled && currentSession) {
        setIsLocked(true);
      }
    };
    initApp();

    return () => {
      BackgroundSync.stopQueueWatcher();
    };
  }, [initialize]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      BackgroundSync.handleAppStateChange(nextAppState);
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        const enabled = await BiometricService.isBiometricLockEnabled();
        const currentSession = useVaultStore.getState().session;
        if (enabled && currentSession) {
          setIsLocked(true);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="folder/[folderId]" options={{ headerShown: false }} />
        <Stack.Screen name="file/[fileId]" options={{ headerShown: false }} />
        <Stack.Screen name="trash" options={{ headerShown: false }} />
      </Stack>

      <BiometricLockOverlay
        visible={isLocked}
        onUnlock={() => setIsLocked(false)}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
