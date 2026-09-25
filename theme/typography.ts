// theme/typography.ts
// Direct extraction from stitch_cloudnest_ui_design_system/cloudnest_system/DESIGN.md

import { TextStyle } from 'react-native';

export interface TypographyScale {
  display: TextStyle;
  headlineLg: TextStyle;
  headlineLgMobile: TextStyle;
  headlineMd: TextStyle;
  headlineSm: TextStyle;
  bodyLg: TextStyle;
  bodyMd: TextStyle;
  bodySm: TextStyle;
  labelMd: TextStyle;
  labelSm: TextStyle;
  monoSm: TextStyle;
}

export const Typography: TypographyScale = {
  display: {
    fontFamily: 'System',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  headlineLg: {
    fontFamily: 'System',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '600',
    letterSpacing: -0.6,
  },
  headlineLgMobile: {
    fontFamily: 'System',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  headlineMd: {
    fontFamily: 'System',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  headlineSm: {
    fontFamily: 'System',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  bodyLg: {
    fontFamily: 'System',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.15,
  },
  bodyMd: {
    fontFamily: 'System',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  bodySm: {
    fontFamily: 'System',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0,
  },
  labelMd: {
    fontFamily: 'System',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  labelSm: {
    fontFamily: 'System',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  monoSm: {
    fontFamily: 'Courier', // Fallback to monospace or JetBrains Mono when loaded
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
};
