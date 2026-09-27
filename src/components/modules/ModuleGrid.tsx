import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, radii } from '@/core/theme';

export interface ModuleEntry {
  /** Ruta de Expo Router. null = módulo aún no disponible en mobile. */
  route?: string | null;
  label: string;
  description: string;
  shortLabel: string;
  badgeColor?: string;
}

export interface ModuleGridProps {
  modules: ModuleEntry[];
  onNavigate: (route: string) => void;
  testID?: string;
}

/**
 * Launcher de módulos. Muestra cada módulo como card honesta: los ya
 * implementados navegan (columna brand), los pendientes marcan su estado
 * real ("Próximamente") sin inventar UI ni decoración ai-slop.
 */
export function ModuleGrid({
  modules,
  onNavigate,
  testID = 'module-grid',
}: ModuleGridProps) {
  return (
    <View testID={testID} style={styles.container}>
      {modules.map((entry) => {
        const isAvailable = Boolean(entry.route);
        const CardComponent = isAvailable ? TouchableOpacity : View;
        const touchProps = isAvailable
          ? {
              accessibilityRole: 'button' as const,
              accessibilityLabel: entry.label,
              activeOpacity: 0.7,
              onPress: () => entry.route && onNavigate(entry.route),
            }
          : {};
        return (
          <CardComponent
            key={`${entry.label}-${entry.route ?? 'pending'}`}
            style={[styles.card, entry.badgeColor ? { backgroundColor: entry.badgeColor } : null]}
            {...touchProps}
          >
            <View style={[styles.badge, { backgroundColor: entry.badgeColor || colors.brand[50] }]}>
              <Text style={[styles.badgeText, { color: colors.brand[700] }]}>
                {entry.shortLabel}
              </Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardLabel}>{entry.label}</Text>
              <Text style={styles.cardDescription}>{entry.description}</Text>
            </View>
            <View
              style={[
                styles.statusPill,
                isAvailable ? styles.statusPillAvailable : styles.statusPillPending,
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  isAvailable ? styles.statusPillTextAvailable : styles.statusPillTextPending,
                ]}
              >
                {isAvailable ? 'Abrir' : 'Próximamente'}
              </Text>
            </View>
          </CardComponent>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  card: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    backgroundColor: colors.neutral.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  badgeText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  cardBody: {
    flex: 1,
  },
  cardLabel: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textPrimary,
  },
  cardDescription: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.sm,
    color: colors.neutral.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    marginLeft: spacing.sm,
  },
  statusPillAvailable: {
    backgroundColor: colors.brand[50],
  },
  statusPillPending: {
    backgroundColor: colors.neutral.surfaceSubtle,
  },
  statusPillText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  statusPillTextAvailable: {
    color: colors.brand[700],
  },
  statusPillTextPending: {
    color: colors.neutral.textMuted,
  },
});