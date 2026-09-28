import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, spacing, radii, typography, minTouchTarget } from '@/core/theme';
import { Project } from '@/types';

export interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  showAllOption?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ProjectSelector({
  projects,
  selectedProjectId,
  onSelectProject,
  showAllOption = true,
  style,
  testID = 'project-selector',
}: ProjectSelectorProps) {
  const isAllSelected = selectedProjectId === null;

  return (
    <View style={[styles.container, style]} testID={testID}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {showAllOption && (
          <TouchableOpacity
            key="all"
            testID="project-chip-all"
            accessibilityRole="button"
            accessibilityLabel="Todos os setores"
            accessibilityState={{ selected: isAllSelected }}
            style={[
              styles.chip,
              isAllSelected ? styles.activeChip : styles.inactiveChip,
            ]}
            onPress={() => onSelectProject(null)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: isAllSelected ? colors.brand[600] : colors.neutral.textMuted },
              ]}
            />
            <Text
              style={[
                styles.chipText,
                isAllSelected ? styles.activeChipText : styles.inactiveChipText,
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>
        )}

        {projects.map((project) => {
          const isSelected = selectedProjectId === project.id;
          const projectColor = project.cor || colors.brand[600];
          const projectName = project.nome || (project as any).name || 'Sem Nome';

          return (
            <TouchableOpacity
              key={project.id}
              testID={`project-chip-${project.id}`}
              accessibilityRole="button"
              accessibilityLabel={`Setor ${projectName}`}
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.chip,
                isSelected ? styles.activeChip : styles.inactiveChip,
              ]}
              onPress={() => onSelectProject(project.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.dot, { backgroundColor: projectColor }]} />
              <Text
                style={[
                  styles.chipText,
                  isSelected ? styles.activeChipText : styles.inactiveChipText,
                ]}
                numberOfLines={1}
              >
                {projectName}
              </Text>
              {typeof project.tarefasCount === 'number' && project.tarefasCount > 0 && (
                <View
                  style={[
                    styles.countBadge,
                    isSelected ? styles.activeCountBadge : styles.inactiveCountBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.countBadgeText,
                      isSelected ? styles.activeCountBadgeText : styles.inactiveCountBadgeText,
                    ]}
                  >
                    {project.tarefasCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  inactiveChip: {
    backgroundColor: colors.neutral.surface,
    borderColor: colors.neutral.border,
  },
  activeChip: {
    backgroundColor: colors.brand[50],
    borderColor: colors.brand[600],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.sm,
    marginRight: spacing.xs,
  },
  chipText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
  inactiveChipText: {
    color: colors.neutral.textSecondary,
  },
  activeChipText: {
    color: colors.brand[700],
    fontWeight: typography.fontWeights.semibold,
  },
  countBadge: {
    marginLeft: spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.md,
  },
  inactiveCountBadge: {
    backgroundColor: colors.neutral.surfaceSubtle,
  },
  activeCountBadge: {
    backgroundColor: colors.brand[200],
  },
  countBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  inactiveCountBadgeText: {
    color: colors.neutral.textMuted,
  },
  activeCountBadgeText: {
    color: colors.brand[900],
  },
});
