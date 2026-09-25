// components/common/CustomConfirmDialog.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Trash2, AlertTriangle, Info, HelpCircle } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface CustomConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  icon?: 'trash' | 'warning' | 'info' | 'help';
  onConfirm: () => void;
  onCancel: () => void;
  confirmLoading?: boolean;
}

export const CustomConfirmDialog: React.FC<CustomConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  icon = 'trash',
  onConfirm,
  onCancel,
  confirmLoading = false,
}) => {
  const { colors, typography, radii } = useTheme();

  const renderIcon = () => {
    if (isDestructive || icon === 'trash') {
      return (
        <View style={[styles.iconCircle, { backgroundColor: colors.errorContainer + '30' }]}>
          <Trash2 size={24} color={colors.error} />
        </View>
      );
    }
    if (icon === 'warning') {
      return (
        <View style={[styles.iconCircle, { backgroundColor: colors.tertiaryContainer + '30' }]}>
          <AlertTriangle size={24} color={colors.tertiary} />
        </View>
      );
    }
    if (icon === 'info') {
      return (
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryContainer + '30' }]}>
          <Info size={24} color={colors.primary} />
        </View>
      );
    }
    return (
      <View style={[styles.iconCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
        <HelpCircle size={24} color={colors.onSurfaceVariant} />
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlayMask }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.dialogCard,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  borderColor: colors.borderSubtle,
                  borderRadius: radii.xl || 20,
                },
              ]}
            >
              {/* Centered Icon */}
              <View style={styles.iconContainer}>{renderIcon()}</View>

              {/* Title */}
              <Text
                style={[
                  typography.headlineSm,
                  { color: colors.onSurface, textAlign: 'center', fontWeight: '700', fontSize: 18 },
                ]}
              >
                {title}
              </Text>

              {/* Message */}
              <Text
                style={[
                  typography.bodyMd,
                  {
                    color: colors.onSurfaceVariant,
                    textAlign: 'center',
                    marginTop: 8,
                    marginBottom: 22,
                    lineHeight: 20,
                  },
                ]}
              >
                {message}
              </Text>

              {/* Action Buttons Row */}
              <View style={styles.buttonRow}>
                {cancelLabel ? (
                  <TouchableOpacity
                    onPress={onCancel}
                    disabled={confirmLoading}
                    style={[
                      styles.actionBtn,
                      { backgroundColor: colors.surfaceContainerHigh, borderRadius: radii.full },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text style={[typography.labelMd, { color: colors.onSurface, fontWeight: '600' }]}>
                      {cancelLabel}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  onPress={onConfirm}
                  disabled={confirmLoading}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: isDestructive ? colors.error : colors.primary,
                      borderRadius: radii.full,
                      marginLeft: cancelLabel ? 10 : 0,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  {confirmLoading ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                  ) : (
                    <Text
                      style={[
                        typography.labelMd,
                        { color: colors.onPrimary, fontWeight: '700' },
                      ]}
                    >
                      {confirmLabel}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    padding: 22,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  iconContainer: {
    marginBottom: 14,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
