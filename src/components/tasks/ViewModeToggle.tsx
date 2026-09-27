import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, spacing, radii, typography, minTouchTarget } from '@/core/theme';

export type ViewMode = 'kanban' | 'list';

export interface ViewModeToggleProps {
  mode: ViewMode;
  onChangeMode: (mode: ViewMode) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ViewModeToggle({
  mode,
  onChangeMode,
  style,
  testID = 'view-mode-toggle',
}: ViewModeToggleProps) {
  const isKanban = mode === 'kanban';
  const isList = mode === 'list';

  return (
    <View style={[styles.container, style]} testID={testID}>
      <TouchableOpacity
        testID="view-mode-kanban"
        accessibilityRole="button"
        accessibilityLabel="Visualização em Quadro Kanban"
        accessibilityState={{ selected: isKanban }}
        style={[
          styles.button,
          isKanban ? styles.activeButton : styles.inactiveButton,
        ]}
        onPress={() => onChangeMode('kanban')}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonIcon, isKanban && styles.activeText]}>📊</Text>
        <Text
          style={[
            styles.buttonText,
            isKanban ? styles.activeButtonText : styles.inactiveButtonText,
          ]}
        >
          Kanban
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="view-mode-list"
        accessibilityRole="button"
        accessibilityLabel="Visualização em Lista Rápida"
        accessibilityState={{ selected: isList }}
        style={[
          styles.button,
          isList ? styles.activeButton : styles.inactiveButton,
        ]}
        onPress={() => onChangeMode('list')}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonIcon, isList && styles.activeText]}>📋</Text>
        <Text
          style={[
            styles.buttonText,
            isList ? styles.activeButtonText : styles.inactiveButtonText,
          ]}
        >
          Lista
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.surfaceSubtle,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: 2,
    minHeight: 36,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.sm,
    minHeight: 32,
    gap: 4,
  },
  activeButton: {
    backgroundColor: colors.neutral.surface,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  inactiveButton: {
    backgroundColor: 'transparent',
  },
  buttonIcon: {
    fontSize: 12,
  },
  activeText: {
    opacity: 1,
  },
  buttonText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  activeButtonText: {
    color: colors.brand[700],
    fontWeight: typography.fontWeights.semibold,
  },
  inactiveButtonText: {
    color: colors.neutral.textSecondary,
  },
});
