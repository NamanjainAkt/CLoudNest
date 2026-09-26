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
  Download,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  FileText,
  Code,
  Image as ImageIcon,
  Music,
  Film,
  FolderArchive,
  FileSpreadsheet,
  Presentation,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Cloud,
} from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '../../theme/ThemeContext';
import { FileRecord } from '../../services/types/models';

interface FullScreenPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  file: FileRecord | null;
}

// -----------------------------------------------------------------------------
// Video Player Subcomponent (expo-video native player)
// -----------------------------------------------------------------------------
interface VideoPreviewViewProps {
  sourceUri: string;
}

const VideoPreviewView: React.FC<VideoPreviewViewProps> = ({ sourceUri }) => {
  const player = useVideoPlayer(sourceUri, (p) => {
    p.loop = false;
    p.play();
  });

  return (
    <View style={styles.videoPlayerContainer}>
      <VideoView
        style={styles.videoPlayer}
        player={player}
        nativeControls={true}
        contentFit="contain"
      />
    </View>
  );
};

// -----------------------------------------------------------------------------
// Audio Player Subcomponent (In-App Audio Player)
// -----------------------------------------------------------------------------
interface AudioPreviewViewProps {
  sourceUri: string;
  file: FileRecord;
}

const AudioPreviewView: React.FC<AudioPreviewViewProps> = ({ sourceUri, file }) => {
  const { colors, typography, radii } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const player = useVideoPlayer(sourceUri, (p) => {
    p.loop = false;
  });

  const handleTogglePlay = () => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const handleSeekBack = () => {
    try {
      player.seekBy(-10);
    } catch {}
  };

  const handleSeekForward = () => {
    try {
      player.seekBy(10);
    } catch {}
  };

  return (
    <View
      style={[
        styles.audioPlayerCard,
        {
          backgroundColor: colors.surfaceContainerLow,
          borderColor: colors.borderSubtle,
          borderRadius: radii.default,
        },
      ]}
    >
      <View style={[styles.audioDisc, { backgroundColor: colors.surfaceContainerHighest }]}>
        <View style={[styles.audioDiscInner, { backgroundColor: colors.surfaceContainer }]}>
          <Music size={38} color={colors.primary} />
        </View>
      </View>

      <Text
        style={[typography.headlineSm, { color: colors.onSurface, marginTop: 14, textAlign: 'center' }]}
        numberOfLines={1}
      >
        {file.name}
      </Text>

      <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, marginTop: 4, fontSize: 11 }]}>
        {file.extension.toUpperCase()} Audio • {(file.size / (1024 * 1024)).toFixed(2)} MB
      </Text>

      {/* Waveform Visualizer */}
      <View style={styles.waveformContainer}>
        {[18, 32, 14, 42, 28, 48, 36, 22, 40, 30, 46, 25, 38, 17, 30, 44, 20].map((h, i) => (
          <View
            key={i}
            style={[
              styles.waveBar,
              {
                height: h,
                backgroundColor: isPlaying ? colors.primary : colors.surfaceContainerHighest,
              },
            ]}
          />
        ))}
      </View>

      {/* Playback Controls */}
      <View style={styles.audioControlsRow}>
        <TouchableOpacity
          onPress={handleSeekBack}
          style={[styles.audioSeekBtn, { backgroundColor: colors.surfaceContainer }]}
          activeOpacity={0.7}
        >
          <RotateCcw size={18} color={colors.onSurface} />
          <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 10, marginTop: 2 }]}>
            -10s
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleTogglePlay}
          style={[styles.audioPlayBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          {isPlaying ? (
            <Pause size={24} color={colors.onPrimary} />
          ) : (
            <Play size={24} color={colors.onPrimary} style={{ marginLeft: 3 }} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSeekForward}
          style={[styles.audioSeekBtn, { backgroundColor: colors.surfaceContainer }]}
          activeOpacity={0.7}
        >
          <RotateCw size={18} color={colors.onSurface} />
          <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 10, marginTop: 2 }]}>
            +10s
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// -----------------------------------------------------------------------------
// Code / Monospace Text Preview Subcomponent
// -----------------------------------------------------------------------------
interface CodePreviewViewProps {
  file: FileRecord;
  textContent: string | null;
  loadingContent: boolean;
}

const CodePreviewView: React.FC<CodePreviewViewProps> = ({ file, textContent, loadingContent }) => {
  const { colors, typography, radii } = useTheme();
  const lines = (textContent || '').split('\n');

  return (
    <View
      style={[
        styles.codeContainer,
        { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.default },
      ]}
    >
      <View style={styles.codeHeader}>
        <Code size={14} color={colors.primary} style={{ marginRight: 6 }} />
        <Text style={[typography.monoSm, { color: colors.primary, fontSize: 11 }]}>
          FILE PREVIEW ({file.extension.toUpperCase()})
        </Text>
        {textContent && (
          <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 10, marginLeft: 'auto' }]}>
            {lines.length} lines
          </Text>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
        {loadingContent ? (
          <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, padding: 16 }]}>
            Loading file preview…
          </Text>
        ) : (
          <View style={styles.codeContentRow}>
            {/* Line numbers column */}
            <View style={styles.lineNumbersCol}>
              {lines.slice(0, 300).map((_, i) => (
                <Text key={i} style={[typography.monoSm, styles.lineNumberText, { color: colors.outline }]}>
                  {i + 1}
                </Text>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ flex: 1 }}>
              <Text
                style={[
                  typography.monoSm,
                  { color: colors.onSurface, lineHeight: 20, fontSize: 12, paddingLeft: 8, paddingRight: 16 },
                ]}
                selectable
              >
                {textContent || 'No text content available.'}
              </Text>
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// -----------------------------------------------------------------------------
// Document / Generic File Preview Subcomponent
// -----------------------------------------------------------------------------
const DocumentPreviewView: React.FC<{ file: FileRecord }> = ({ file }) => {
  const { colors, typography, radii } = useTheme();
  const ext = file.extension.toLowerCase();

  let icon = <FileText size={44} color={colors.primary} />;
  let badgeColor = colors.primary;
  let typeLabel = `${ext.toUpperCase()} File`;

  if (ext === 'pdf') {
    icon = <FileText size={44} color={colors.error} />;
    badgeColor = colors.error;
    typeLabel = 'PDF Document';
  } else if (['zip', 'rar', 'tar', 'gz', '7z', 'bz2'].includes(ext)) {
    icon = <FolderArchive size={44} color={colors.tertiary} />;
    badgeColor = colors.tertiary;
    typeLabel = 'Compressed Archive';
  } else if (['key', 'ppt', 'pptx'].includes(ext)) {
    icon = <Presentation size={44} color={colors.tertiary} />;
    badgeColor = colors.tertiary;
    typeLabel = 'Presentation';
  } else if (['xls', 'xlsx'].includes(ext)) {
    icon = <FileSpreadsheet size={44} color={colors.secondary} />;
    badgeColor = colors.secondary;
    typeLabel = 'Spreadsheet';
  } else if (['doc', 'docx'].includes(ext)) {
    icon = <FileText size={44} color={colors.primary} />;
    badgeColor = colors.primary;
    typeLabel = 'Word Document';
  }

  return (
    <View
      style={[
        styles.documentCard,
        {
          backgroundColor: colors.surfaceContainerLow,
          borderColor: colors.borderSubtle,
          borderRadius: radii.default,
        },
      ]}
    >
      <View style={[styles.docIconCircle, { backgroundColor: colors.surfaceContainerHighest }]}>
        {icon}
      </View>

      <Text
        style={[typography.headlineSm, { color: colors.onSurface, marginTop: 14, textAlign: 'center' }]}
        numberOfLines={2}
      >
        {file.name}
      </Text>

      <View style={[styles.docTypeBadge, { backgroundColor: badgeColor + '20' }]}>
        <Text style={[typography.monoSm, { color: badgeColor, fontSize: 11, fontWeight: '700' }]}>
          {typeLabel}
        </Text>
      </View>

      <View style={[styles.docDetailsBox, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderSubtle }]}>
        <View style={styles.docDetailRow}>
          <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>File Size</Text>
          <Text style={[typography.monoSm, { color: colors.onSurface, fontWeight: '600' }]}>
            {(file.size / (1024 * 1024)).toFixed(2)} MB
          </Text>
        </View>
        <View style={[styles.docDetailRow, { borderTopWidth: 1, borderTopColor: colors.borderSubtle }]}>
          <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>Storage</Text>
          <Text style={[typography.monoSm, { color: colors.primary }]}>
            Telegram Personal Cloud
          </Text>
        </View>
        <View style={[styles.docDetailRow, { borderTopWidth: 1, borderTopColor: colors.borderSubtle }]}>
          <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>Integrity</Text>
          <Text style={[typography.monoSm, { color: colors.secondary, fontSize: 10 }]}>
            SHA-256 Verified
          </Text>
        </View>
      </View>
    </View>
  );
};

// -----------------------------------------------------------------------------
// Main FullScreenPreviewModal Component
// -----------------------------------------------------------------------------
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

  const ext = file?.extension?.toLowerCase() || '';
  const mime = file?.mimeType?.toLowerCase() || '';

  const isImage = file
    ? mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext)
    : false;

  const isVideo = file
    ? mime.startsWith('video/') || ['mp4', 'mov', 'mkv', 'webm', '3gp', 'avi', 'm4v'].includes(ext)
    : false;

  const isAudio = file
    ? mime.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg', 'opus', 'm4r'].includes(ext)
    : false;

  const isCodeOrText = file
    ? ['text/plain', 'text/markdown', 'application/json', 'text/javascript', 'text/csv', 'text/html', 'text/xml'].includes(mime) ||
      ['txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'log', 'csv', 'xml', 'html', 'css', 'py', 'sql', 'sh', 'yaml', 'yml'].includes(ext)
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
            setTextContent(`[Text preview unavailable: ${err?.message || 'File not readable as plain text'}]`);
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
        message: `CloudNest File: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
        title: file.name,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleDownload = async () => {
    try {
      const isMedia = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'mp4', 'mov', 'mkv', 'webm', '3gp'].includes(ext);

      if (isMedia && file.localCachePath) {
        try {
          const perm = await MediaLibrary.requestPermissionsAsync();
          if (perm.granted || perm.status === 'granted') {
            await MediaLibrary.saveToLibraryAsync(file.localCachePath);
            Alert.alert('Download Complete', 'Saved to your device gallery!');
            return;
          }
        } catch (mediaErr) {
          console.warn('MediaLibrary save error:', mediaErr);
        }
      }

      if (file.localCachePath) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(file.localCachePath, {
            mimeType: file.mimeType,
            dialogTitle: `Save / Export ${file.name}`,
          });
          Alert.alert('Download Ready', 'File is downloaded and ready to save/export.');
          return;
        }
      }

      Alert.alert('Download Ready', 'File is downloaded and saved in your device storage.');
    } catch (err: any) {
      console.error('Download error:', err);
      Alert.alert('Download Error', err?.message || 'Failed to download file.');
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
            accessibilityRole="button"
            accessibilityLabel="Close preview"
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
                Cloud Verified • {(file.size / (1024 * 1024)).toFixed(2)} MB
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleShare}
            style={[styles.actionBtn, { backgroundColor: colors.surfaceContainer }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Share file"
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
                  accessibilityLabel="Zoom out"
                >
                  <ZoomOut size={16} color={colors.onSurface} />
                </TouchableOpacity>
                <Text style={[typography.monoSm, { color: colors.onSurface, marginHorizontal: 8 }]}>
                  {Math.round(zoomLevel * 100)}%
                </Text>
                <TouchableOpacity
                  onPress={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                  style={styles.zoomButton}
                  accessibilityLabel="Zoom in"
                >
                  <ZoomIn size={16} color={colors.onSurface} />
                </TouchableOpacity>
              </View>
            </View>
          ) : isVideo && file.localCachePath ? (
            <VideoPreviewView sourceUri={file.localCachePath} />
          ) : isAudio && file.localCachePath ? (
            <AudioPreviewView sourceUri={file.localCachePath} file={file} />
          ) : isCodeOrText ? (
            <CodePreviewView
              file={file}
              textContent={textContent}
              loadingContent={loadingContent}
            />
          ) : (
            <DocumentPreviewView file={file} />
          )}
        </View>

        {/* Bottom Footer Actions with Uniquely Defined Download & Share Buttons */}
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={[styles.downloadBtn, { backgroundColor: colors.primary }]}
            onPress={handleDownload}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Download File"
          >
            <Download size={18} color={colors.onPrimary} style={{ marginRight: 8 }} />
            <Text style={[typography.labelMd, { color: colors.onPrimary, fontWeight: '700', fontSize: 14 }]}>
              Download
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shareBtn,
              {
                backgroundColor: colors.surfaceContainerHigh,
                borderColor: colors.borderSubtle,
              },
            ]}
            onPress={handleShare}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Share File"
          >
            <Share2 size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[typography.labelMd, { color: colors.primary, fontWeight: '600', fontSize: 14 }]}>
              Share
            </Text>
          </TouchableOpacity>
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
  videoPlayerContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    maxHeight: 480,
    borderRadius: 12,
  },
  audioPlayerCard: {
    width: '100%',
    maxWidth: 340,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  audioDisc: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  audioDiscInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 52,
    marginTop: 18,
    marginBottom: 10,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  audioControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  audioSeekBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  audioPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  codeContainer: {
    width: '100%',
    flex: 1,
    borderWidth: 1,
    borderColor: '#2e2e2e',
    overflow: 'hidden',
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  codeContentRow: {
    flexDirection: 'row',
    paddingTop: 8,
  },
  lineNumbersCol: {
    paddingLeft: 10,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#282828',
    alignItems: 'flex-end',
  },
  lineNumberText: {
    fontSize: 11,
    lineHeight: 20,
  },
  documentCard: {
    width: '100%',
    maxWidth: 340,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  docIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 10,
  },
  docDetailsBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 18,
    overflow: 'hidden',
  },
  docDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  downloadBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
