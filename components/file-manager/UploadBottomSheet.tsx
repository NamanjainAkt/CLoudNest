// components/file-manager/UploadBottomSheet.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileUp, Camera, Image, FolderPlus, ShieldCheck, X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface UploadBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onPickDocument: () => void;
  onPickImage: () => void;
  onTakePhoto: () => void;
  onCreateFolder: () => void;
}

export const UploadBottomSheet: React.FC<UploadBottomSheetProps> = ({
  visible,
  onClose,
  onPickDocument,
  onPickImage,
  onTakePhoto,
  onCreateFolder,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, typography, radii } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlayMask }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheetContainer,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  paddingBottom: Math.max(insets.bottom, 20),
                },
              ]}
            >
              {/* Grabber Handle */}
              <View
                style={[
                  styles.grabber,
                  { backgroundColor: colors.surfaceContainerHighest },
                ]}
              />

              {/* Sheet Header */}
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
                    Add to CloudNest Vault
                  </Text>
                  <Text
                    style={[
                      typography.monoSm,
                      { color: colors.onSurfaceVariant, marginTop: 2 },
                    ]}
                  >
                    Zero-Knowledge Ingest
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  style={[
                    styles.closeBtn,
                    { backgroundColor: colors.surfaceContainer },
                  ]}
                  activeOpacity={0.7}
                >
                  <X size={18} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              {/* 4-Option Grid */}
              <View style={styles.optionsGrid}>
                {/* Option 1: File / Document */}
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onPickDocument();
                  }}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: colors.surfaceContainer,
                      borderColor: colors.borderSubtle,
                      borderRadius: radii.default,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.optionIconBox,
                      { backgroundColor: colors.primaryContainer + '25' },
                    ]}
                  >
                    <FileUp size={24} color={colors.primary} />
                  </View>
                  <Text
                    style={[
                      typography.labelMd,
                      { color: colors.onSurface, marginTop: 10, textAlign: 'center' },
                    ]}
                  >
                    Upload File
                  </Text>
                  <Text
                    style={[
                      typography.bodySm,
                      { color: colors.onSurfaceVariant, fontSize: 11, textAlign: 'center' },
                    ]}
                  >
                    PDF, DOC, ZIP
                  </Text>
                </TouchableOpacity>

                {/* Option 2: Photos */}
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onPickImage();
                  }}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: colors.surfaceContainer,
                      borderColor: colors.borderSubtle,
                      borderRadius: radii.default,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.optionIconBox,
                      { backgroundColor: colors.secondaryContainer + '25' },
                    ]}
                  >
                    <Image size={24} color={colors.secondary} />
                  </View>
                  <Text
                    style={[
                      typography.labelMd,
                      { color: colors.onSurface, marginTop: 10, textAlign: 'center' },
                    ]}
                  >
                    Photo Library
                  </Text>
                  <Text
                    style={[
                      typography.bodySm,
                      { color: colors.onSurfaceVariant, fontSize: 11, textAlign: 'center' },
                    ]}
                  >
                    Images & Videos
                  </Text>
                </TouchableOpacity>

                {/* Option 3: Camera */}
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onTakePhoto();
                  }}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: colors.surfaceContainer,
                      borderColor: colors.borderSubtle,
                      borderRadius: radii.default,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.optionIconBox,
                      { backgroundColor: colors.tertiaryContainer + '30' },
                    ]}
                  >
                    <Camera size={24} color={colors.tertiary} />
                  </View>
                  <Text
                    style={[
                      typography.labelMd,
                      { color: colors.onSurface, marginTop: 10, textAlign: 'center' },
                    ]}
                  >
                    Camera
                  </Text>
                  <Text
                    style={[
                      typography.bodySm,
                      { color: colors.onSurfaceVariant, fontSize: 11, textAlign: 'center' },
                    ]}
                  >
                    Snap & Encrypt
                  </Text>
                </TouchableOpacity>

                {/* Option 4: New Folder */}
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onCreateFolder();
                  }}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: colors.surfaceContainer,
                      borderColor: colors.borderSubtle,
                      borderRadius: radii.default,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.optionIconBox,
                      { backgroundColor: colors.primaryContainer + '25' },
                    ]}
                  >
                    <FolderPlus size={24} color={colors.primary} />
                  </View>
                  <Text
                    style={[
                      typography.labelMd,
                      { color: colors.onSurface, marginTop: 10, textAlign: 'center' },
                    ]}
                  >
                    New Folder
                  </Text>
                  <Text
                    style={[
                      typography.bodySm,
                      { color: colors.onSurfaceVariant, fontSize: 11, textAlign: 'center' },
                    ]}
                  >
                    Virtual Directory
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Zero Knowledge Security Strip */}
              <View
                style={[
                  styles.securityBanner,
                  { backgroundColor: colors.surfaceContainerLowest },
                ]}
              >
                <ShieldCheck size={16} color={colors.primary} style={{ marginRight: 8 }} />
                <Text
                  style={[
                    typography.bodySm,
                    { color: colors.onSurfaceVariant, flex: 1, fontSize: 11 },
                  ]}
                >
                  Zero-Knowledge Active — All files encrypted with AES-256 before transmission.
                </Text>
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
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionCard: {
    width: '48%',
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  optionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
  },
});
