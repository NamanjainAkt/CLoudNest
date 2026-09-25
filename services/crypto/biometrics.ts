// services/crypto/biometrics.ts
import * as LocalAuthentication from 'expo-local-authentication';
import { SecureStorageService } from './secureStore';

const BIOMETRICS_ENABLED_KEY = 'cloudnest_biometrics_enabled';

export interface BiometricStatus {
  hasHardware: boolean;
  isEnrolled: boolean;
  biometryType: 'FACIAL_RECOGNITION' | 'FINGERPRINT' | 'IRIS' | 'NONE';
  label: string;
}

export class BiometricService {
  /**
   * Check if device has biometric hardware and enrolled credentials
   */
  static async checkAvailability(): Promise<BiometricStatus> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometryType: BiometricStatus['biometryType'] = 'NONE';
      let label = 'Biometrics';

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometryType = 'FACIAL_RECOGNITION';
        label = 'Face ID';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometryType = 'FINGERPRINT';
        label = 'Touch ID / Fingerprint';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometryType = 'IRIS';
        label = 'Iris Scan';
      }

      return {
        hasHardware,
        isEnrolled,
        biometryType,
        label,
      };
    } catch (err) {
      console.warn('Biometric availability check failed:', err);
      return {
        hasHardware: false,
        isEnrolled: false,
        biometryType: 'NONE',
        label: 'Biometrics',
      };
    }
  }

  /**
   * Check if user enabled biometric vault lock in settings
   */
  static async isBiometricLockEnabled(): Promise<boolean> {
    try {
      const val = await SecureStorageService.getItem(BIOMETRICS_ENABLED_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Set biometric vault lock setting
   */
  static async setBiometricLockEnabled(enabled: boolean): Promise<void> {
    await SecureStorageService.saveItem(BIOMETRICS_ENABLED_KEY, enabled ? 'true' : 'false');
  }

  /**
   * Prompt user for biometric authentication
   */
  static async authenticate(promptReason: string = 'Unlock CloudNest Vault'): Promise<boolean> {
    try {
      const status = await this.checkAvailability();
      if (!status.hasHardware || !status.isEnrolled) {
        return true; // Bypass gracefully if device doesn't support biometrics
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptReason,
        fallbackLabel: 'Use Master Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (err) {
      console.error('Biometric authentication error:', err);
      return false;
    }
  }
}
