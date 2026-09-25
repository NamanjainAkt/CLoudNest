// app/index.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useVaultStore } from '../store/useVaultStore';
import { useTheme } from '../theme/ThemeContext';

export default function Index() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isInitialized, session } = useVaultStore();

  useEffect(() => {
    if (isInitialized) {
      if (session && session.isConnected) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/onboarding');
      }
    }
  }, [isInitialized, session, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
