import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme/colors';
import { fonts } from '../theme/typography';
import { Icon } from './Icon';

interface StepperProps {
  label: string;
  /** Second line under the label, e.g. "Drop-ins & daycare". */
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}

/** Full-width row: label on the left, − value + on the right. */
export function Stepper({ label, hint, value, min, max, step, format, onChange }: StepperProps) {
  const set = (next: number) => onChange(Math.min(max, Math.max(min, Number(next.toFixed(2)))));
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <StepButton icon="remove" label={`Decrease ${label}`} disabled={value <= min} onPress={() => set(value - step)} />
      <Text style={styles.value} numberOfLines={1} accessibilityLiveRegion="polite">
        {format(value)}
      </Text>
      <StepButton icon="add" label={`Increase ${label}`} disabled={value >= max} onPress={() => set(value + step)} />
    </View>
  );
}

function StepButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: string;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Icon name={icon} size={18} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    backgroundColor: colors.input,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
  },
  text: {
    flex: 1,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    lineHeight: 18,
    color: colors.ink,
  },
  hint: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 15,
    color: colors.slate,
  },
  value: {
    minWidth: 76,
    textAlign: 'center',
    fontFamily: fonts.extrabold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.ink,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryTint,
  },
  pressed: {
    transform: [{ scale: 0.92 }],
  },
  disabled: {
    opacity: 0.4,
  },
});
