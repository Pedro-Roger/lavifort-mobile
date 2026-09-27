import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  LayoutChangeEvent,
} from 'react-native';
import { colors, spacing, typography, radii, minTouchTarget } from '@/core/theme';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  trackColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ProgressBar({
  progress,
  color,
  trackColor = colors.neutral.borderSubtle,
  height = 8,
  style,
  testID = 'progress-bar-container',
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const getProgressColor = () => {
    if (color) return color;
    if (clampedProgress >= 100) return '#059669'; // Emerald
    if (clampedProgress >= 70) return colors.brand[600];
    if (clampedProgress >= 30) return '#0284c7';
    return '#64748b'; // Slate
  };

  return (
    <View
      testID={testID}
      style={[
        styles.progressTrack,
        { height, backgroundColor: trackColor, borderRadius: height / 2 },
        style,
      ]}
    >
      <View
        testID="progress-bar-fill"
        style={[
          styles.progressFill,
          {
            width: `${clampedProgress}%`,
            backgroundColor: getProgressColor(),
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

export interface SliderProps {
  value: number; // 0 to 100
  onChange?: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  showPresets?: boolean;
  presets?: number[];
  label?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export function Slider({
  value,
  onChange,
  step = 10,
  min = 0,
  max = 100,
  disabled = false,
  showPresets = true,
  presets = [0, 25, 50, 75, 100],
  label,
  style,
  labelStyle,
  testID = 'slider-container',
}: SliderProps) {
  const clampedValue = Math.min(max, Math.max(min, value));

  const handleDecrement = () => {
    if (disabled || !onChange) return;
    const nextVal = Math.max(min, clampedValue - step);
    onChange(nextVal);
  };

  const handleIncrement = () => {
    if (disabled || !onChange) return;
    const nextVal = Math.min(max, clampedValue + step);
    onChange(nextVal);
  };

  const handlePresetSelect = (preset: number) => {
    if (disabled || !onChange) return;
    onChange(preset);
  };

  return (
    <View testID={testID} style={[styles.container, style]}>
      {/* Label and Value Header */}
      <View style={styles.headerRow}>
        {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : <View />}
        <View style={styles.valueBadge} testID="slider-value-badge">
          <Text style={styles.valueBadgeText}>{clampedValue}%</Text>
        </View>
      </View>

      {/* Interactive Bar & Stepper Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          testID="slider-decrement-button"
          style={[styles.stepperButton, disabled && styles.stepperButtonDisabled]}
          onPress={handleDecrement}
          disabled={disabled || clampedValue <= min}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Diminuir progresso"
        >
          <Text style={styles.stepperButtonText}>−</Text>
        </TouchableOpacity>

        <View style={styles.trackContainer}>
          <ProgressBar progress={clampedValue} height={12} />
        </View>

        <TouchableOpacity
          testID="slider-increment-button"
          style={[styles.stepperButton, disabled && styles.stepperButtonDisabled]}
          onPress={handleIncrement}
          disabled={disabled || clampedValue >= max}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Aumentar progresso"
        >
          <Text style={styles.stepperButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Preset Quick Select Pills */}
      {showPresets && presets.length > 0 && (
        <View style={styles.presetsRow} testID="slider-presets-row">
          {presets.map((preset) => {
            const isSelected = clampedValue === preset;
            return (
              <TouchableOpacity
                key={preset}
                testID={`slider-preset-${preset}`}
                style={[
                  styles.presetPill,
                  isSelected && styles.presetPillSelected,
                  disabled && styles.presetPillDisabled,
                ]}
                onPress={() => handlePresetSelect(preset)}
                disabled={disabled}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Definir progresso em ${preset}%`}
              >
                <Text
                  style={[
                    styles.presetPillText,
                    isSelected && styles.presetPillTextSelected,
                  ]}
                >
                  {preset}%
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral.textPrimary,
  },
  valueBadge: {
    backgroundColor: colors.brand[50],
    borderWidth: 1,
    borderColor: colors.brand[200],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  valueBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand[700],
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    borderRadius: radii.md,
    backgroundColor: colors.neutral.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperButtonText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textPrimary,
    lineHeight: 22,
  },
  trackContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  progressTrack: {
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  presetPill: {
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.neutral.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.neutral.borderSubtle,
    flex: 1,
    marginHorizontal: 2,
  },
  presetPillSelected: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[600],
  },
  presetPillDisabled: {
    opacity: 0.5,
  },
  presetPillText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral.textSecondary,
  },
  presetPillTextSelected: {
    color: '#ffffff',
    fontWeight: typography.fontWeights.bold,
  },
});
