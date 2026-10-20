import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';
import { colors, radii, shadows } from '../theme/colors';
import { typography } from '../theme/typography';

/** White 24px card with the soft 0 12 32 shadow. */
export function Card({ children, style, ...rest }: ViewProps & { children: ReactNode }) {
  return (
    <View {...rest} style={[styles.card, style]}>
      {children}
    </View>
  );
}

/** Card / section heading with an optional accessory on the right. */
export function SectionTitle({
  title,
  accessory,
  style,
}: {
  title: string;
  accessory?: ReactNode;
  style?: ViewProps['style'];
}) {
  return (
    <View style={[styles.titleRow, style]}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {accessory}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    gap: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    ...shadows.card,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    ...typography.headline,
    flexShrink: 1,
  },
});
