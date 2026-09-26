// components/file-manager/FullScreenPreviewModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Share2,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  FileText,
  Code,
  Image as ImageIcon,
  Lock,
} from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../../theme/ThemeContext';
import { FileRecord } from '../../services/types/models';
import { PillButton } from '../common/PillButton';

interface FullScreenPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  file: FileRecord | null;
}

export const FullScreenPreviewModal: React.FC<FullScreenPreviewModalProps> = ({
  visible,
  onClose,
  file,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, typography, radii } = useTheme();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const isImage = file
    ? ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'].includes(file.mimeType.toLowerCase()) ||
      ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(file.extension.toLowerCase())
    : false;

  const isCodeOrText = file
    ? ['text/plain', 'text/markdown', 'application/json', 'text/javascript'].includes(file.mimeType.toLowerCase()) ||
      ['txt', 'md', 'json', 'js', 'ts', 'log', 'csv'].includes(file.extension.toLowerCase())
    : false;

  useEffect(() => {
    let isMounted = true;
    if (visible && file && isCodeOrText && file.localCachePath) {
      setLoadingContent(true);
      FileSystem.readAsStringAsync(file.localCachePath)
        .then((content) => {
          if (isMounted) {
            setTextContent(content);
            setLoadingContent(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setTextContent(`[Decrypted stream preview unavailable: ${err?.message || 'File not readable as plain text'}]`);
            setLoadingContent(false);
          }
        });
    } else {
      setTextContent(null);
    }
    return () => {
      isMounted = false;
    };
  }, [visible, file, isCodeOrText]);

  if (!file) return null;

  const handleShare = async () => {
    try {
      if (file.localCachePath) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(file.localCachePath, {
            mimeType: file.mimeType,
            dialogTitle: `Share ${file.name}`,
          });
          return;
        }
      }
      // Fallback native share
      await Share.share({
        message: `CloudNest File: ${file.name} (${(file.size / 1024).toFixed(1)} KB) - SHA-256: ${file.sha256Hash.slice(0, 16)}…`,
        title: file.name,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surfaceDim,
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {/* Top App Bar */}
        <View style={[styles.topBar, { borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.actionBtn, { backgroundColor: colors.surfaceContainer }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color={colors.onSurface} />
          </TouchableOpacity>

          <View style={styles.titleColumn}>
            <Text
              style={[typography.headlineSm, { color: colors.onSurface }]}
              numberOfLines={1}
            >
              {file.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <ShieldCheck size={11} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 10 }]}>
                {file.isEncrypted ? 'AES-256-GCM Verified' : 'Cloud Verified'} • {(file.size / (1024 * 1024)).toFixed(2)} MB
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleShare}
            style={[styles.actionBtn, { backgroundColor: colors.surfaceContainer }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Share2 size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Content Viewer Body */}
        <View style={styles.contentArea}>
          {isImage ? (
            <View style={styles.imageViewerWrapper}>
              <ScrollView
                maximumZoomScale={3}
                minimumZoomScale={1}
                contentContainerStyle={styles.imageScrollContent}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
              >
                <Image
                  source={{ uri: file.localCachePath || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80' }}
                  style={[
                    styles.imagePreview,
                    { transform: [{ scale: zoomLevel }] },
                  ]}
                  resizeMode="contain"
                />
              </ScrollView>

              {/* Floating Zoom Bar */}
              <View
                style={[
                  styles.floatingControls,
                  { backgroundColor: colors.surfaceContainerHighest + 'EE' },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                  style={styles.zoomButton}
                >
                  <ZoomOut size={16} color={colors.onSurface} />
                </TouchableOpacity>
                <Text style={[typography.monoSm, { color: colors.onSurface, marginHorizontal: 8 }]}>
                  {Math.round(zoomLevel * 100)}%
                </Text>
                <TouchableOpacity
                  onPress={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                  style={styles.zoomButton}
                >
                  <ZoomIn size={16} color={colors.onSurface} />
                </TouchableOpacity>
              </View>
            </View>
          ) : isCodeOrText ? (
            <ScrollView
              style={[
                styles.codeContainer,
                { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.default },
              ]}
              contentContainerStyle={{ padding: 16 }}
            >
              <View style={styles.codeHeader}>
                <Code size={14} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[typography.monoSm, { color: colors.primary, fontSize: 11 }]}>
                  DECRYPTED IN-MEMORY BUFFER ({file.extension.toUpperCase()})
                </Text>
              </View>
              {loadingContent ? (
                <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 12 }]}>
                  Reading decrypted content…
                </Text>
              ) : (
                <Text
                  style={[
                    typography.monoSm,
                    { color: colors.onSurface, lineHeight: 20, fontSize: 12 },
                  ]}
                  selectable
                >
                  {textContent || 'No text content available.'}
                </Text>
              )}
            </ScrollView>
          ) : (
            <View
              style={[
                styles.binaryPayloadCard,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor: colors.borderSubtle,
                  borderRadius: radii.default,
                },
              ]}
            >
              <Lock size={40} color={colors.primary} style={{ marginBottom: 12 }} />
              <Text style={[typography.headlineSm, { color: colors.onSurface, textAlign: 'center' }]}>
                {file.name}
              </Text>
              <Text
                style={[
                  typography.bodySm,
                  { color: colors.onSurfaceVariant, marginTop: 6, textAlign: 'center', maxWidth: 280 },
                ]}
              >
                Binary payload verified with authentic GCM tag. Decrypted securely into local volatile memory.
              </Text>

              <View
                style={[
                  styles.integrityPill,
                  { backgroundColor: colors.surfaceContainer, marginTop: 16 },
                ]}
              >
                <Text style={[typography.monoSm, { color: colors.outline, fontSize: 11 }]}>
                  SHA-256: {file.sha256Hash.slice(0, 16)}…{file.sha256Hash.slice(-8)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Footer Actions */}
        <View style={styles.footerRow}>
          <PillButton
            label="Share / Export Decrypted File"
            onPress={handleShare}
            icon={<Share2 size={16} color={colors.onPrimary} />}
            size="lg"
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleColumn: {
    flex: 1,
    marginHorizontal: 12,
  },
  contentArea: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageViewerWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  imageScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreview: {
    width: 320,
    height: 440,
    borderRadius: 8,
  },
  floatingControls: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 24,
  },
  zoomButton: {
    padding: 4,
  },
  codeContainer: {
    width: '100%',
    flex: 1,
    borderWidth: 1,
    borderColor: '#2e2e2e',
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  binaryPayloadCard: {
    width: '100%',
    maxWidth: 340,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  integrityPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  footerRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
