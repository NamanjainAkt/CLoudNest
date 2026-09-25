// theme/colors.ts
// Direct extraction and binding from stitch_cloudnest_ui_design_system/cloudnest_system/DESIGN.md

export interface ColorScheme {
  // Canvas & Surfaces
  surface: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;

  // Typography & Content
  onSurface: string;
  onSurfaceVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;

  // Structural & Hairline Borders
  outline: string;
  outlineVariant: string;
  borderSubtle: string;
  borderStrong: string;

  // Primary (Electric Blue / Cloud Accent)
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  primaryFixed: string;
  primaryFixedDim: string;
  onPrimaryFixed: string;
  onPrimaryFixedVariant: string;
  inversePrimary: string;

  // Secondary
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  secondaryFixed: string;
  secondaryFixedDim: string;
  onSecondaryFixed: string;
  onSecondaryFixedVariant: string;

  // Tertiary (Warm Amber / Cryptographic Key Indicator)
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  tertiaryFixed: string;
  tertiaryFixedDim: string;
  onTertiaryFixed: string;
  onTertiaryFixedVariant: string;

  // Error & Destruction
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;

  // Ambient Glow & Shadows
  glowPrimary: string;
  glowSecondary: string;
  shadowCard: string;
  overlayMask: string;
}

export const darkColors: ColorScheme = {
  surface: '#12131a',
  surfaceDim: '#12131a',
  surfaceBright: '#383941',
  surfaceContainerLowest: '#0d0e15',
  surfaceContainerLow: '#1a1b22',
  surfaceContainer: '#1e1f26',
  surfaceContainerHigh: '#292931',
  surfaceContainerHighest: '#33343c',

  onSurface: '#e3e1ec',
  onSurfaceVariant: '#c2c6d6',
  inverseSurface: '#e3e1ec',
  inverseOnSurface: '#2f3038',

  outline: '#8c909f',
  outlineVariant: '#424754',
  borderSubtle: '#222222',
  borderStrong: '#2e2e2e',

  primary: '#adc6ff',
  onPrimary: '#002e6a',
  primaryContainer: '#4d8eff',
  onPrimaryContainer: '#00285d',
  primaryFixed: '#d8e2ff',
  primaryFixedDim: '#adc6ff',
  onPrimaryFixed: '#001a42',
  onPrimaryFixedVariant: '#004395',
  inversePrimary: '#005ac2',

  secondary: '#adc6ff',
  onSecondary: '#002e69',
  secondaryContainer: '#4b8eff',
  onSecondaryContainer: '#00285c',
  secondaryFixed: '#d8e2ff',
  secondaryFixedDim: '#adc6ff',
  onSecondaryFixed: '#001a41',
  onSecondaryFixedVariant: '#004493',

  tertiary: '#ffb786',
  onTertiary: '#502400',
  tertiaryContainer: '#df7412',
  onTertiaryContainer: '#461f00',
  tertiaryFixed: '#ffdcc6',
  tertiaryFixedDim: '#ffb786',
  onTertiaryFixed: '#311400',
  onTertiaryFixedVariant: '#723600',

  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',

  glowPrimary: 'rgba(77, 142, 255, 0.45)',
  glowSecondary: 'rgba(173, 198, 255, 0.8)',
  shadowCard: 'rgba(0, 0, 0, 0.4)',
  overlayMask: 'rgba(13, 14, 21, 0.82)',
};

export const lightColors: ColorScheme = {
  surface: '#F2F2F7',
  surfaceDim: '#E5E5EA',
  surfaceBright: '#FFFFFF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F8F9FA',
  surfaceContainer: '#FFFFFF',
  surfaceContainerHigh: '#EFEFF4',
  surfaceContainerHighest: '#E5E5EA',

  onSurface: '#000000',
  onSurfaceVariant: '#6C6C70',
  inverseSurface: '#1C1C1E',
  inverseOnSurface: '#F2F2F7',

  outline: '#8E8E93',
  outlineVariant: '#C7C7CC',
  borderSubtle: '#E5E5EA',
  borderStrong: '#D1D1D6',

  primary: '#007AFF',
  onPrimary: '#FFFFFF',
  primaryContainer: '#D0E2FF',
  onPrimaryContainer: '#002D6B',
  primaryFixed: '#E0EAFF',
  primaryFixedDim: '#B9D1FF',
  onPrimaryFixed: '#00183B',
  onPrimaryFixedVariant: '#003E99',
  inversePrimary: '#005ac2',

  secondary: '#34C759',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#D1F2D9',
  onSecondaryContainer: '#083B14',
  secondaryFixed: '#E1F8E7',
  secondaryFixedDim: '#B7ECC3',
  onSecondaryFixed: '#04210A',
  onSecondaryFixedVariant: '#0E5C20',

  tertiary: '#FF9500',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFE7CC',
  onTertiaryContainer: '#542D00',
  tertiaryFixed: '#FFF0E0',
  tertiaryFixedDim: '#FFD4A8',
  onTertiaryFixed: '#331B00',
  onTertiaryFixedVariant: '#7A4100',

  error: '#FF3B30',
  onError: '#FFFFFF',
  errorContainer: '#FFD5D2',
  onErrorContainer: '#690005',

  glowPrimary: 'rgba(0, 122, 255, 0.25)',
  glowSecondary: 'rgba(52, 199, 89, 0.3)',
  shadowCard: 'rgba(0, 0, 0, 0.06)',
  overlayMask: 'rgba(0, 0, 0, 0.45)',
};
