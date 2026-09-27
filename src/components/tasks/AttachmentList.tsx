import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, radii, typography, minTouchTarget } from '@/core/theme';
import { TaskAttachment } from '@/types';
import { Badge } from '../ui/Badge';

export interface AttachmentListProps {
  taskId: string;
  anexos?: TaskAttachment[];
  onCapturePhoto?: (taskId: string) => Promise<unknown>;
  onPickPhoto?: (taskId: string) => Promise<unknown>;
  onDeleteAttachment?: (taskId: string, attachmentId: string) => Promise<unknown>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({
  taskId,
  anexos = [],
  onCapturePhoto,
  onPickPhoto,
  onDeleteAttachment,
  style,
  testID = 'attachment-list',
}: AttachmentListProps) {
  const [selectedAttachment, setSelectedAttachment] = useState<TaskAttachment | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalCount = anexos.length;

  const handleCapture = async () => {
    if (!onCapturePhoto) return;
    setError(null);
    setIsCapturing(true);
    try {
      await onCapturePhoto(taskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao capturar foto');
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePick = async () => {
    if (!onPickPhoto) return;
    setError(null);
    setIsPicking(true);
    try {
      await onPickPhoto(taskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao selecionar foto');
    } finally {
      setIsPicking(false);
    }
  };

  const handleDelete = (attachmentId: string, nome: string) => {
    if (!onDeleteAttachment) return;

    const executeDelete = async () => {
      setError(null);
      setDeletingId(attachmentId);
      try {
        await onDeleteAttachment(taskId, attachmentId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao excluir anexo');
      } finally {
        setDeletingId(null);
      }
    };

    if (Platform.OS === 'web') {
      executeDelete();
    } else {
      Alert.alert(
        'Excluir Anexo',
        `Tem certeza que deseja remover o anexo "${nome}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir', style: 'destructive', onPress: executeDelete },
        ]
      );
    }
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Fotos & Evidências de Campo</Text>
        {totalCount > 0 && (
          <View style={styles.counterBadge} testID="attachment-counter">
            <Text style={styles.counterText}>{totalCount}</Text>
          </View>
        )}
      </View>

      {error && (
        <View style={styles.errorBanner} testID="attachment-error-banner">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Action Buttons Row (Camera / Gallery) */}
      {(onCapturePhoto || onPickPhoto) && (
        <View style={styles.actionsRow}>
          {onCapturePhoto && (
            <TouchableOpacity
              style={[styles.mediaButton, isCapturing && styles.mediaButtonDisabled]}
              onPress={handleCapture}
              disabled={isCapturing || isPicking}
              activeOpacity={0.7}
              testID="attachment-camera-button"
              accessibilityRole="button"
              accessibilityLabel="Tirar foto com a câmera"
            >
              {isCapturing ? (
                <ActivityIndicator size="small" color={colors.brand[600]} />
              ) : (
                <>
                  <Text style={styles.mediaButtonIcon}>📷</Text>
                  <Text style={styles.mediaButtonText}>Tirar Foto</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {onPickPhoto && (
            <TouchableOpacity
              style={[styles.mediaButton, isPicking && styles.mediaButtonDisabled]}
              onPress={handlePick}
              disabled={isCapturing || isPicking}
              activeOpacity={0.7}
              testID="attachment-gallery-button"
              accessibilityRole="button"
              accessibilityLabel="Escolher foto da galeria"
            >
              {isPicking ? (
                <ActivityIndicator size="small" color={colors.brand[600]} />
              ) : (
                <>
                  <Text style={styles.mediaButtonIcon}>🖼️</Text>
                  <Text style={styles.mediaButtonText}>Galeria</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Attachments List */}
      {anexos.length > 0 ? (
        <View style={styles.listContainer}>
          {anexos.map((item) => {
            const isDeleting = deletingId === item.id;
            const sizeStr = formatFileSize(item.tamanho);
            return (
              <View
                key={item.id}
                style={styles.itemCard}
                testID={`attachment-item-${item.id}`}
              >
                <TouchableOpacity
                  style={styles.itemContent}
                  onPress={() => setSelectedAttachment(item)}
                  activeOpacity={0.7}
                  testID={`attachment-open-${item.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Visualizar foto ${item.nome}`}
                >
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                    testID={`attachment-thumbnail-${item.id}`}
                  />

                  <View style={styles.itemInfo}>
                    <Text
                      style={styles.itemName}
                      numberOfLines={1}
                      testID={`attachment-name-${item.id}`}
                    >
                      {item.nome}
                    </Text>
                    <View style={styles.itemMetaRow}>
                      {sizeStr ? <Text style={styles.itemSize}>{sizeStr}</Text> : null}
                      <Badge
                        syncStatus={item.syncStatus || 'PENDING'}
                        size="sm"
                        testID={`attachment-sync-badge-${item.id}`}
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                {onDeleteAttachment && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.id, item.nome)}
                    disabled={isDeleting}
                    testID={`attachment-delete-${item.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir foto ${item.nome}`}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color={colors.neutral.textMuted} />
                    ) : (
                      <Text style={styles.deleteButtonText}>✕</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.emptyText} testID="attachment-empty-text">
          Nenhuma foto de evidência anexada
        </Text>
      )}

      {/* Fullscreen Image Preview Modal */}
      {selectedAttachment && (
        <Modal
          visible={!!selectedAttachment}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedAttachment(null)}
          testID="attachment-preview-modal"
        >
          <View style={styles.previewBackdrop}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle} numberOfLines={1}>
                {selectedAttachment.nome}
              </Text>
              <TouchableOpacity
                style={styles.previewCloseButton}
                onPress={() => setSelectedAttachment(null)}
                testID="attachment-preview-close"
                accessibilityRole="button"
                accessibilityLabel="Fechar visualização"
              >
                <Text style={styles.previewCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.previewImageContainer}>
              <Image
                source={{ uri: selectedAttachment.uri }}
                style={styles.previewImage}
                resizeMode="contain"
                testID="attachment-preview-image"
              />
            </View>

            <View style={styles.previewFooter}>
              <View style={styles.previewMeta}>
                {selectedAttachment.tamanho ? (
                  <Text style={styles.previewMetaText}>
                    Tamanho: {formatFileSize(selectedAttachment.tamanho)}
                  </Text>
                ) : null}
                <Badge
                  syncStatus={selectedAttachment.syncStatus || 'PENDING'}
                  size="sm"
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  counterBadge: {
    backgroundColor: colors.brand[50],
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.brand[200],
  },
  counterText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand[700],
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.xs,
    marginBottom: spacing.xs,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: typography.fontSizes.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.neutral.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.brand[200],
    borderRadius: radii.md,
    gap: 6,
  },
  mediaButtonDisabled: {
    opacity: 0.6,
  },
  mediaButtonIcon: {
    fontSize: typography.fontSizes.base,
  },
  mediaButtonText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand[700],
  },
  listContainer: {
    gap: 6,
    marginTop: spacing.xs,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.surfaceSubtle,
    borderRadius: radii.md,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.neutral.borderSubtle,
    minHeight: 56,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.neutral.border,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  itemName: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral.textPrimary,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  itemSize: {
    fontSize: 11,
    color: colors.neutral.textMuted,
  },
  deleteButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textMuted,
    fontWeight: typography.fontWeights.bold,
  },
  emptyText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral.textMuted,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'space-between',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  previewTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    marginRight: spacing.md,
  },
  previewCloseButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  previewCloseText: {
    color: '#ffffff',
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
  },
  previewImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewFooter: {
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
    paddingTop: spacing.sm,
  },
  previewMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewMetaText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: typography.fontSizes.xs,
  },
});
