import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, spacing, radii, typography, minTouchTarget } from '@/core/theme';
import { Columns, List } from 'lucide-react-native';

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
        <Columns size={16} color={isKanban ? colors.brand[700] : colors.neutral.textSecondary} />
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
        <List size={16} color={isList ? colors.brand[700] : colors.neutral.textSecondary} />
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
    minHeight: minTouchTarget,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.sm,
    minHeight: minTouchTarget - 4,
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
});
