import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { Icon } from './Icon';

interface AppBarProps {
  title: string;
  onBack?: () => void;
  trailing?: ReactNode;
}

/** Slim top bar for the registration steps. */
export function AppBar({ title, onBack, trailing }: AppBarProps) {
  return (
    <View style={styles.bar}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.icon, pressed && styles.pressed]}
        >
          <Icon name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
      ) : null}
      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.track,
  },
  trailing: {
    justifyContent: 'center',
    paddingRight: 4,
  },
  title: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: colors.ink,
  },
});
