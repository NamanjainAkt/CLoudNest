// app/(auth)/onboarding.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Ellipse, Circle, Path, Rect } from 'react-native-svg';
import { WifiOff, CheckCircle2, Shield, Lock, Infinity, Cloud } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { BrandMark } from '../../components/common/BrandMark';
import { PillButton } from '../../components/common/PillButton';

const { width } = Dimensions.get('window');

interface SlideData {
  id: string;
  title: string;
  subtitle: string;
  badge1: string;
  badge2: string;
}

const SLIDES: SlideData[] = [
  {
    id: '1',
    title: 'Unlimited Personal Cloud',
    subtitle: 'Save photos, videos, and documents safely with no subscription fees or file limits.',
    badge1: 'FREE STORAGE',
    badge2: 'UNLIMITED',
  },
  {
    id: '2',
    title: 'Works Offline & Anywhere',
    subtitle: 'Browse, preview, and organize your files even when you have no internet connection.',
    badge1: 'OFFLINE ACCESS',
    badge2: 'ALWAYS READY',
  },
  {
    id: '3',
    title: 'Safe & Encrypted by Default',
    subtitle: 'Your files are encrypted on your phone before uploading, so only you have the keys to view them.',
    badge1: 'ENCRYPTED',
    badge2: 'PRIVATE & SAFE',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { colors, typography, radii } = useTheme();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex((prev) => prev + 1);
    } else {
      router.push('/(auth)/sign-in');
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/sign-in');
  };

  const renderVisual = (index: number) => {
    if (index === 0) {
      return (
        <View style={styles.visualContainer}>
          <Svg width={200} height={200} viewBox="0 0 200 200">
            <Ellipse cx="100" cy="100" rx="85" ry="38" stroke={colors.primary} strokeWidth="1.2" strokeDasharray="4 6" opacity={0.3} />
            <Ellipse cx="100" cy="100" rx="68" ry="68" stroke={colors.primary} strokeWidth="1" opacity={0.4} />
            <Ellipse cx="100" cy="100" rx="48" ry="22" stroke={colors.primary} strokeWidth="1.5" opacity={0.7} transform="rotate(-30 100 100)" />
            <Ellipse cx="100" cy="100" rx="48" ry="22" stroke={colors.primary} strokeWidth="1.5" opacity={0.7} transform="rotate(30 100 100)" />
            <Circle cx="100" cy="100" r="16" fill={colors.surfaceContainerHighest} />
            <Circle cx="100" cy="100" r="12" fill={colors.primary} />
            <Circle cx="100" cy="100" r="5" fill={colors.onPrimary} />
          </Svg>
          <View style={[styles.floatBadge1, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Infinity size={13} color={colors.primary} />
            <Text style={[typography.monoSm, { color: colors.onSurface, marginLeft: 4 }]}>FREE STORAGE</Text>
          </View>
          <View style={[styles.floatBadge2, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Cloud size={13} color={colors.secondary} />
            <Text style={[typography.monoSm, { color: colors.onSurface, marginLeft: 4 }]}>UNLIMITED</Text>
          </View>
        </View>
      );
    }

    if (index === 1) {
      return (
        <View style={styles.visualContainer}>
          <View style={[styles.cacheCard, { backgroundColor: colors.surfaceContainerLow }]}>
            <View style={styles.cacheCardHeader}>
              <View style={styles.cacheDotRow}>
                <View style={[styles.cacheDot, { backgroundColor: colors.secondaryContainer }]} />
                <Text style={[typography.monoSm, { color: colors.onSurfaceVariant }]}>OFFLINE READY</Text>
              </View>
              <WifiOff size={16} color={colors.primary} />
            </View>

            <View style={styles.cacheBars}>
              <View style={[styles.bar, { width: '75%', backgroundColor: colors.surfaceContainerHighest }]} />
              <View style={[styles.bar, { width: '100%', backgroundColor: colors.surfaceBright }]} />
              <View style={[styles.bar, { width: '50%', backgroundColor: colors.surfaceContainerHighest }]} />
            </View>

            <View style={styles.cacheCardFooter}>
              <Text style={[typography.monoSm, { color: colors.primary }]}>ALWAYS AVAILABLE</Text>
              <CheckCircle2 size={16} color={colors.primary} />
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.visualContainer}>
        <View style={[styles.shieldHalo, { backgroundColor: colors.surfaceContainer }]}>
          <Svg width={110} height={110} viewBox="0 0 120 120">
            <Path
              d="M60 15L95 30V65C95 87 80 102 60 108C40 102 25 87 25 65V30L60 15Z"
              stroke={colors.primary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.8}
            />
            <Path
              d="M48 58C48 51.3726 53.3726 46 60 46C66.6274 46 72 51.3726 72 58V64H48V58Z"
              stroke={colors.primary}
              strokeWidth="2"
            />
            <Rect x="42" y="64" width="36" height="24" rx="4" fill={colors.primary} />
            <Circle cx="60" cy="76" r="3" fill={colors.surface} />
          </Svg>
        </View>

        <View style={[styles.floatBadge1, { backgroundColor: colors.surfaceContainerHigh }]}>
          <Lock size={13} color={colors.primary} />
          <Text style={[typography.monoSm, { color: colors.onSurface, marginLeft: 4 }]}>ENCRYPTED</Text>
        </View>
        <View style={[styles.floatBadge2, { backgroundColor: colors.surfaceContainerHigh }]}>
          <Shield size={13} color={colors.secondary} />
          <Text style={[typography.monoSm, { color: colors.onSurface, marginLeft: 4 }]}>PRIVATE & SAFE</Text>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.surface,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}
    >
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.brandGroup}>
          <BrandMark size={32} />
          <Text style={[typography.headlineSm, { color: colors.onSurface, marginLeft: 8 }]}>
            CloudNest
          </Text>
          <View style={[styles.versionPill, { backgroundColor: colors.surfaceContainerHigh }]}>
            <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
            <Text style={[typography.monoSm, { color: colors.primary, fontSize: 10 }]}>v1.0.0</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipButton}>
          <Text style={[typography.labelSm, { color: colors.onSurfaceVariant }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Carousel FlatList */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const newIdx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIdx);
        }}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={[styles.slideContainer, { width }]}>
            {renderVisual(index)}

            <View style={styles.textContainer}>
              <Text
                style={[
                  typography.headlineLgMobile,
                  { color: colors.onSurface, textAlign: 'center', fontWeight: '600' },
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  typography.bodyMd,
                  { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 10, lineHeight: 20 },
                ]}
              >
                {item.subtitle}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Footer with Page Indicators and CTA */}
      <View style={styles.footerContainer}>
        {/* Indicators */}
        <View style={styles.indicatorRow}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor: idx === currentIndex ? colors.primary : colors.surfaceContainerHighest,
                  width: idx === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* CTA Button */}
        <PillButton
          label={currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          size="lg"
          style={{ width: '100%', marginTop: 20 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    minHeight: 44,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    marginLeft: 8,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  slideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  visualContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 20,
  },
  floatBadge1: {
    position: 'absolute',
    top: 10,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  floatBadge2: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  cacheCard: {
    width: 170,
    height: 160,
    borderRadius: 18,
    padding: 14,
    justifyContent: 'space-between',
  },
  cacheCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cacheDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cacheDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  cacheBars: {
    gap: 8,
    marginVertical: 10,
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
  cacheCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shieldHalo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    maxWidth: 320,
    alignItems: 'center',
    marginTop: 20,
  },
  footerContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
