import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/Button';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { MascotDockSlot } from '../mascot/MascotDockSlot';
import { useMascotActions, useMascotStatus } from '../mascot/MascotProvider';
import { usePartnerNavigation } from '../navigation/usePartnerNavigation';
import { usePartnerActions } from '../partner/PartnerProvider';
import { colors, radii, shadows } from '../theme/colors';
import { fonts, typography } from '../theme/typography';

const GOOD_LUCK = ['Woof! Good luck! 🍀', 'Woof! You got this! 🐾', 'Arf! Big tips today! 💰', 'Woof! Pawsome shift! ⭐'];

const PERKS = [
  {
    emoji: '💰',
    tint: colors.stage,
    title: 'Earn up to $1,500/mo',
    detail: 'Flexible schedule & walks tailored to your local area.',
    tag: 'High Demand',
  },
  {
    emoji: '⚡',
    tint: colors.primaryTint,
    title: 'Instant Daily Payouts',
    detail: 'Earnings transfer straight to your verified bank or debit card.',
  },
  {
    emoji: '🛡️',
    tint: colors.successTint,
    title: '100% Pet Safety Insurance',
    detail: 'Zero-deductible medical & liability cover on every booking.',
    verified: true,
  },
] as const;

/** PARTNER_SPLASH: Barnaby in the hero circle, the perks, and the way in. */
export function SplashScreen() {
  const insets = useSafeAreaInsets();
  const { barkWith } = useMascotActions();
  const { delight } = useMascotStatus();
  const { signIn } = usePartnerActions();
  const nav = usePartnerNavigation();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.versionPill}>
        <Text style={styles.versionText}>
          💼 Pawsome Partner Network <Text style={styles.versionNumber}>v2.4</Text>
        </Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroRing} />
        <MascotDockSlot variant="hero-circle" />
        <Text style={styles.sparkle} accessibilityElementsHidden importantForAccessibility="no">
          ✦
        </Text>
      </View>

      <View style={styles.moraleRow}>
        <Pressable
          onPress={() => barkWith(GOOD_LUCK[delight % GOOD_LUCK.length])}
          accessibilityRole="button"
          style={({ pressed }) => [styles.barkPill, pressed && styles.pressed]}
        >
          <Text style={styles.barkText}>🐾 Tap Barnaby for a Good Luck Bark</Text>
        </Pressable>
        <View style={styles.morale} accessibilityLabel={`Partner Morale Boost ${delight}`}>
          <Text style={styles.moraleLabel}>Partner Morale Boost</Text>
          <Text style={styles.moraleCount}>💪 {delight}</Text>
        </View>
      </View>

      <View style={styles.headline}>
        <Text style={styles.title} accessibilityRole="header">
          Pawsome Partner
        </Text>
        <Text style={styles.subtitle}>Earn on your schedule as a certified Dog Walker & Pet Caretaker</Text>
      </View>

      <Card style={styles.perks}>
        {PERKS.map((perk, index) => (
          <View key={perk.title} style={[styles.perk, index > 0 && styles.perkDivider]}>
            <View style={[styles.perkIcon, { backgroundColor: perk.tint }]}>
              <Text style={styles.perkEmoji}>{perk.emoji}</Text>
            </View>
            <View style={styles.perkText}>
              <View style={styles.perkTitleRow}>
                <Text style={styles.perkTitle}>{perk.title}</Text>
                {'tag' in perk ? (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{perk.tag}</Text>
                  </View>
                ) : null}
                {'verified' in perk ? <Icon name="verified" size={18} color={colors.success} /> : null}
              </View>
              <Text style={styles.perkDetail}>{perk.detail}</Text>
            </View>
          </View>
        ))}
      </Card>

      <PrimaryButton label="Register as a Partner" onPress={nav.toKyc} />

      <Pressable
        onPress={() => {
          signIn();
          nav.toDashboard();
        }}
        accessibilityRole="link"
        hitSlop={8}
        style={styles.signIn}
      >
        <Text style={styles.signInText}>
          Already a verified partner? <Text style={styles.signInLink}>Jump to Dashboard</Text>
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: 20,
    gap: 18,
  },
  versionPill: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    ...shadows.soft,
  },
  versionText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.ink,
  },
  versionNumber: {
    fontFamily: fonts.medium,
    color: colors.slate,
  },
  hero: {
    alignSelf: 'center',
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 243, 232, 0.55)',
    boxShadow: '0px 18px 48px rgba(255, 179, 64, 0.18)',
  },
  sparkle: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontSize: 26,
    color: colors.amber,
  },
  moraleRow: {
    alignItems: 'center',
    gap: 8,
  },
  barkPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.full,
    backgroundColor: colors.stage,
    ...shadows.soft,
  },
  barkText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.coralInk,
  },
  morale: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.successTint,
  },
  moraleLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.successInk,
  },
  moraleCount: {
    fontFamily: fonts.extrabold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.successInk,
  },
  headline: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...typography.display,
    fontSize: 32,
    lineHeight: 38,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  perks: {
    gap: 0,
    paddingVertical: 6,
  },
  perk: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 14,
  },
  perkDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  perkIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkEmoji: {
    fontSize: 22,
  },
  perkText: {
    flex: 1,
    gap: 3,
  },
  perkTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  perkTitle: {
    ...typography.subhead,
    fontSize: 16,
  },
  perkDetail: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: colors.coralTint,
  },
  tagText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 15,
    color: colors.coralInk,
  },
  signIn: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  signInText: {
    ...typography.body,
    textAlign: 'center',
  },
  signInLink: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
