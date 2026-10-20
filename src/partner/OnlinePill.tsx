import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Toggle } from '../components/Toggle';
import { colors, radii } from '../theme/colors';
import { fonts } from '../theme/typography';

/** The whole pill toggles: "🟢 ONLINE & ACCEPTING WALKS" / "⚫ OFFLINE". */
export function OnlinePill({ online, onToggle }: { online: boolean; onToggle: (next: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onToggle(!online)}
      accessibilityRole="switch"
      accessibilityState={{ checked: online }}
      style={[styles.pill, online ? styles.on : styles.off]}
    >
      <Text style={[styles.text, { color: online ? colors.successInk : colors.slate }]}>
        {online ? '🟢 ONLINE & ACCEPTING WALKS' : '⚫ OFFLINE'}
      </Text>
      <Toggle value={online} onValueChange={onToggle} accessibilityLabel="Online" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingLeft: 18,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1.5,
  },
  on: {
    backgroundColor: colors.successTint,
    borderColor: 'rgba(46, 204, 113, 0.35)',
  },
  off: {
    backgroundColor: colors.card,
    borderColor: colors.inputBorder,
  },
  text: {
    flexShrink: 1,
    fontFamily: fonts.extrabold,
    fontSize: 12.5,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
});
