// services/file/categories.ts

export const MEDIA_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'heic', 'heif', 'bmp', 'ico', 'tiff',
  'mov', 'mp4', 'm4v', 'mkv', 'webm', 'avi', '3gp', 'flv', 'wmv', 'ts',
];

export const DOC_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt',
  'xls', 'xlsx', 'csv',
  'ppt', 'pptx', 'key',
  'md', 'json', 'log', 'xml', 'html', 'css', 'js', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'asc',
];

export const AUDIO_EXTENSIONS = [
  'mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg', 'opus', 'wma', 'aiff', 'alac', 'mid',
];

export const ARCHIVE_EXTENSIONS = [
  'zip', 'tar', 'gz', 'enc', '7z', 'rar', 'bz2', 'xz', 'iso', 'dmg',
];

export function normalizeExtension(ext?: string | null): string {
  if (!ext) return '';
  return ext.toLowerCase().trim().replace(/^\./, '');
}

export function getFileCategory(extension?: string | null): 'documents' | 'media' | 'audio' | 'archives' {
  const ext = normalizeExtension(extension);
  if (DOC_EXTENSIONS.includes(ext)) return 'documents';
  if (MEDIA_EXTENSIONS.includes(ext)) return 'media';
  if (AUDIO_EXTENSIONS.includes(ext)) return 'audio';
  return 'archives';
}
