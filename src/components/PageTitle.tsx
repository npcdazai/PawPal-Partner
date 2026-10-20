import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

/** "PAWSOME PARTNER" over the page title, with an optional control on the right. */
export function PageTitle({ title, leading, trailing }: { title: string; leading?: ReactNode; trailing?: ReactNode }) {
  return (
    <View style={styles.row}>
      {leading}
      <View style={styles.text}>
        <Text style={styles.brand}>PAWSOME PARTNER</Text>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
  },
  text: {
    flex: 1,
  },
  brand: {
    ...typography.overline,
    color: colors.primary,
  },
  title: {
    ...typography.title,
    fontSize: 22,
    lineHeight: 28,
  },
});
