import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii } from '../theme/colors';
import { fonts } from '../theme/typography';
import { Icon } from './Icon';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** Multi-select pill: tinted blue with a tick when on, neutral when off. */
export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      role="checkbox"
      aria-checked={selected}
      aria-label={label}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      {selected ? <Icon name="check" size={16} color={colors.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    backgroundColor: colors.input,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 17,
    color: colors.slate,
    userSelect: 'none',
  },
  labelSelected: {
    color: colors.primary,
  },
});
