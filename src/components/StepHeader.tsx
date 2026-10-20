import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MascotDockSlot } from '../mascot/MascotDockSlot';
import { colors, radii } from '../theme/colors';
import { fonts, typography } from '../theme/typography';
import { ProgressBar } from './ProgressBar';

/** Room on the right of the text for Barnaby (the slot's corgi is ~102px). */
const MASCOT_GUTTER = 112;

interface StepHeaderProps {
  badge: string;
  title: string;
  subtitle: string;
  /** 0–1 */
  progress: number;
}

/** The registration steps' curved peach banner: step badge, title, progress and Barnaby. */
export function StepHeader({ badge, title, subtitle, progress }: StepHeaderProps) {
  return (
    <MascotDockSlot variant="step-header">
      <View style={styles.content}>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText} numberOfLines={1} adjustsFontSizeToFit>
            {badge}
          </Text>
        </View>
        <View style={styles.text}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
        <View style={styles.progressRow}>
          <ProgressBar progress={progress} height={7} trackColor="rgba(41, 98, 255, 0.12)" style={styles.flex} />
          <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
        </View>
      </View>
    </MascotDockSlot>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 16,
    paddingLeft: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '96%',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.coralTint,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.coral,
  },
  badgeText: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 0.6,
    color: colors.coralInk,
  },
  text: {
    gap: 2,
    paddingRight: MASCOT_GUTTER,
  },
  title: {
    ...typography.headline,
    fontSize: 19,
  },
  subtitle: {
    ...typography.bodySm,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: MASCOT_GUTTER,
  },
  flex: {
    flex: 1,
    width: undefined,
  },
  percent: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primary,
  },
});
