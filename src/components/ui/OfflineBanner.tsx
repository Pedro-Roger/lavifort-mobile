import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography, minTouchTarget } from '@/core/theme';
import { useSyncStore } from '@/stores/sync.store';

export interface OfflineBannerProps {
  isConnected?: boolean;
  isSyncing?: boolean;
  pendingCount?: number;
  errorCount?: number;
  onSyncPress?: () => void;
  onPressBanner?: () => void;
  hideWhenSynced?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function OfflineBanner({
  isConnected: propConnected,
  isSyncing: propSyncing,
  pendingCount: propPending,
  errorCount: propError,
  onSyncPress,
  onPressBanner,
  hideWhenSynced = false,
  style,
  testID = 'offline-banner',
}: OfflineBannerProps) {
  const store = useSyncStore();

  const isConnected = propConnected !== undefined ? propConnected : store.isConnected;
  const isSyncing = propSyncing !== undefined ? propSyncing : store.isSyncing;
  const pendingCount = propPending !== undefined ? propPending : store.pendingCount;
  const errorCount = propError !== undefined ? propError : store.errorCount;

  const handleSyncPress = () => {
    if (onSyncPress) {
      onSyncPress();
    } else {
      store.syncNow();
    }
  };

  // State 1: Syncing actively
  if (isSyncing) {
    return (
      <View
        testID={testID}
        style={[styles.banner, styles.bannerSyncing, style]}
        accessibilityRole="alert"
      >
        <ActivityIndicator
          size="small"
          color="#0369a1"
          style={styles.spinner}
          testID="offline-banner-spinner"
        />
        <Text style={styles.textSyncing}>Sincronizando alterações com o servidor...</Text>
      </View>
    );
  }

  // State 2: Has Sync Errors
  if (errorCount > 0) {
    return (
      <TouchableOpacity
        testID={testID}
        activeOpacity={0.8}
        onPress={handleSyncPress}
        style={[styles.banner, styles.bannerError, style]}
        accessibilityRole="button"
        accessibilityLabel="Erros de sincronização. Toque para tentar novamente."
      >
        <View style={styles.errorDot} />
        <Text style={styles.textError}>
          {errorCount} {errorCount === 1 ? 'erro' : 'erros'} na sincronização
        </Text>
        <Text style={styles.actionTextError}>Tentar novamente</Text>
      </TouchableOpacity>
    );
  }

  // State 3: Disconnected / Offline
  if (!isConnected) {
    const content = (
      <>
        <View style={styles.offlineDot} />
        <Text style={styles.textOffline}>
          Modo Offline —{' '}
          {pendingCount > 0
            ? `${pendingCount} ${pendingCount === 1 ? 'alteração pendente' : 'alterações pendentes'}`
            : 'Tudo salvo localmente'}
        </Text>
      </>
    );

    if (onPressBanner) {
      return (
        <TouchableOpacity
          testID={testID}
          style={[styles.banner, styles.bannerOffline, style]}
          onPress={onPressBanner}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          {content}
        </TouchableOpacity>
      );
    }

    return (
      <View
        testID={testID}
        style={[styles.banner, styles.bannerOffline, style]}
        accessibilityRole="alert"
      >
        {content}
      </View>
    );
  }

  // State 4: Online but with pending items
  if (pendingCount > 0) {
    return (
      <TouchableOpacity
        testID={testID}
        activeOpacity={0.8}
        onPress={handleSyncPress}
        style={[styles.banner, styles.bannerPending, style]}
        accessibilityRole="button"
        accessibilityLabel={`${pendingCount} alterações pendentes. Toque para sincronizar.`}
      >
        <View style={styles.pendingDot} />
        <Text style={styles.textPending}>
          {pendingCount} {pendingCount === 1 ? 'alteração pendente' : 'alterações pendentes'}
        </Text>
        <Text style={styles.actionTextPending}>Sincronizar agora</Text>
      </TouchableOpacity>
    );
  }

  // State 5: Online & all synced
  if (hideWhenSynced) {
    return null;
  }

  const syncedContent = (
    <>
      <View style={styles.syncedDot} />
      <Text style={styles.textSynced}>Todas as alterações sincronizadas</Text>
    </>
  );

  if (onPressBanner) {
    return (
      <TouchableOpacity
        testID={testID}
        style={[styles.banner, styles.bannerSynced, style]}
        onPress={onPressBanner}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        {syncedContent}
      </TouchableOpacity>
    );
  }

  return (
    <View
      testID={testID}
      style={[styles.banner, styles.bannerSynced, style]}
      accessibilityRole="summary"
    >
      {syncedContent}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: minTouchTarget,
    width: '100%',
  },
  spinner: {
    marginRight: spacing.sm,
  },
  // Syncing
  bannerSyncing: {
    backgroundColor: '#e0f2fe',
    borderBottomWidth: 1,
    borderBottomColor: '#bae6fd',
  },
  textSyncing: {
    fontSize: typography.fontSizes.xs,
    color: '#0369a1',
    fontWeight: typography.fontWeights.medium,
  },
  // Error
  bannerError: {
    backgroundColor: '#fee2e2',
    borderBottomWidth: 1,
    borderBottomColor: '#fca5a5',
  },
  errorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
    marginRight: spacing.sm,
  },
  textError: {
    flex: 1,
    fontSize: typography.fontSizes.xs,
    color: '#b91c1c',
    fontWeight: typography.fontWeights.medium,
  },
  actionTextError: {
    fontSize: typography.fontSizes.xs,
    color: '#b91c1c',
    fontWeight: typography.fontWeights.bold,
    textDecorationLine: 'underline',
  },
  // Offline
  bannerOffline: {
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  offlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d97706',
    marginRight: spacing.sm,
  },
  textOffline: {
    fontSize: typography.fontSizes.xs,
    color: '#b45309',
    fontWeight: typography.fontWeights.medium,
  },
  // Pending
  bannerPending: {
    backgroundColor: '#f0fdf4',
    borderBottomWidth: 1,
    borderBottomColor: '#bbf7d0',
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
    marginRight: spacing.sm,
  },
  textPending: {
    flex: 1,
    fontSize: typography.fontSizes.xs,
    color: '#15803d',
    fontWeight: typography.fontWeights.medium,
  },
  actionTextPending: {
    fontSize: typography.fontSizes.xs,
    color: '#15803d',
    fontWeight: typography.fontWeights.bold,
    textDecorationLine: 'underline',
  },
  // Synced
  bannerSynced: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  syncedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: spacing.sm,
  },
  textSynced: {
    fontSize: typography.fontSizes.xs,
    color: '#475569',
    fontWeight: typography.fontWeights.medium,
  },
});
