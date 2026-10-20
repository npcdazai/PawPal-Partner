import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { MascotDockSlot } from '../mascot/MascotDockSlot';
import { colors, radii, shadows } from '../theme/colors';

/** Peach page banner: the page's headline numbers on the left, Barnaby's compact dock on the right. */
export function MascotBanner({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <View style={styles.banner}>
      <View style={styles.row}>
        <View style={styles.text}>{children}</View>
        <MascotDockSlot variant="compact-dock" />
      </View>
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    gap: 14,
    padding: 18,
    borderRadius: radii.xl,
    backgroundColor: colors.stage,
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    flex: 1,
    gap: 4,
  },
});
