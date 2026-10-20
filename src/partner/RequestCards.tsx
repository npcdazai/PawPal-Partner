import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/Button';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { ProgressBar } from '../components/ProgressBar';
import { colors, radii, shadows } from '../theme/colors';
import { fonts, typography } from '../theme/typography';
import { NATIVE_DRIVER } from '../theme/motion';
import { duration, money } from './format';
import { REQUEST_WINDOW_S, type IncomingRequest, type RequestOutcome } from './partnerModel';

/** Whole seconds left in a request's 25s window, ticking while mounted. */
export function useSecondsLeft(arrivedAt: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);
  return Math.max(0, Math.min(REQUEST_WINDOW_S, Math.ceil((arrivedAt + REQUEST_WINDOW_S * 1000 - now) / 1000)));
}

function usePulse() {
  const [pulse] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(pulse, { toValue: 0, duration: 650, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return useMemo(
    () => ({
      opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] }),
      transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }],
    }),
    [pulse]
  );
}

const tipText = (tip: number) => money(tip, tip % 1 ? 2 : 0);

/** The live instant request: payout first, pickup, and a 25s countdown to accept. */
export function RequestCard({
  incoming,
  onAccept,
  onDecline,
}: {
  incoming: IncomingRequest;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const { request } = incoming;
  const left = useSecondsLeft(incoming.arrivedAt);
  const pulseStyle = usePulse();

  return (
    <View style={styles.request}>
      <View style={styles.requestTop}>
        <Animated.View style={[styles.newPill, pulseStyle]}>
          <Text style={styles.newText}>
            🔔 NEW INSTANT {request.service.toUpperCase()} • {request.distanceKm.toFixed(1)} KM AWAY
          </Text>
        </Animated.View>
        <Text style={styles.countdown}>{left}s</Text>
      </View>
      <ProgressBar progress={left / REQUEST_WINDOW_S} color={colors.coral} height={4} />

      <View style={styles.dogRow}>
        <View style={styles.dogAvatar}>
          <Text style={styles.dogEmoji}>{request.emoji}</Text>
          <View style={styles.dogOnline} />
        </View>
        <View style={styles.flex}>
          <View style={styles.dogNameRow}>
            <Text style={styles.dogName}>{request.dog}</Text>
            <View style={styles.breed}>
              <Text style={styles.breedText}>{request.breed}</Text>
            </View>
          </View>
          <Text style={styles.dogMeta}>
            {request.minutes} Mins {request.service} • {request.temperament}
          </Text>
          <Text style={styles.payout}>
            Payout: {money(request.payout)} <Text style={styles.tip}>(incl. {tipText(request.tip)} tip)</Text>
          </Text>
        </View>
      </View>

      <View style={styles.pickup}>
        <Icon name="place" size={22} color={colors.primary} />
        <View style={styles.flex}>
          <Text style={styles.pickupLabel}>PICKUP ADDRESS</Text>
          <Text style={styles.pickupAddress}>{request.address}</Text>
          <Text style={styles.pickupArea}>{request.area}</Text>
        </View>
      </View>

      <PrimaryButton label={`Accept Walk Request (${left}s)`} onPress={onAccept} />
      <View style={styles.requestFooter}>
        <Pressable onPress={onDecline} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.decline}>Decline (No penalty)</Text>
        </Pressable>
        <View style={styles.insured}>
          <Icon name="verified-user" size={14} color={colors.successInk} />
          <Text style={styles.insuredText}>Pet Insurance Covered</Text>
        </View>
      </View>
    </View>
  );
}

/** Compact version for the Earnings page: who, how much, time left, and a way to the Requests page. */
export function RequestTeaser({ incoming, onOpen }: { incoming: IncomingRequest; onOpen: () => void }) {
  const { request } = incoming;
  const left = useSecondsLeft(incoming.arrivedAt);
  const pulseStyle = usePulse();

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`New request from ${request.dog}, ${money(request.payout)}, ${left} seconds left. Open requests`}
      style={({ pressed }) => [styles.teaser, pressed && styles.pressed]}
    >
      <Animated.View style={[styles.teaserBell, pulseStyle]}>
        <Text style={styles.teaserEmoji}>🔔</Text>
      </Animated.View>
      <View style={styles.flex}>
        <Text style={styles.teaserTitle} numberOfLines={1}>
          {request.dog} • {duration(request.minutes)} {request.service.toLowerCase()} • {money(request.payout)}
        </Text>
        <Text style={styles.teaserText} numberOfLines={1}>
          {request.distanceKm.toFixed(1)} km away • {left}s left to accept
        </Text>
      </View>
      <View style={styles.teaserCta}>
        <Text style={styles.teaserCtaText}>View</Text>
        <Icon name="chevron-right" size={18} color={colors.onPrimary} />
      </View>
    </Pressable>
  );
}

const LAST_OUTCOME_TEXT: Record<RequestOutcome, string> = {
  accepted: 'Nice! That walk is on your schedule.',
  declined: 'No worries — declining never hurts your rating.',
  expired: 'That one timed out — the next request is on its way.',
};

export function WaitingCard({ lastOutcome }: { lastOutcome?: RequestOutcome }) {
  const [spin] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE_DRIVER })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const ring = useMemo(
    () => ({
      opacity: spin.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
      transform: [{ scale: spin.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.8] }) }],
    }),
    [spin]
  );

  return (
    <Card style={styles.waiting}>
      <View style={styles.radar}>
        <Animated.View style={[styles.radarRing, ring]} />
        <View style={styles.radarDot} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.waitingTitle}>Looking for walks near you…</Text>
        <Text style={styles.waitingText}>
          {lastOutcome ? LAST_OUTCOME_TEXT[lastOutcome] : 'New instant requests pop up here with a 25s window to accept.'}
        </Text>
      </View>
    </Card>
  );
}

export function OfflineCard({ onGoOnline }: { onGoOnline: () => void }) {
  return (
    <Card style={styles.offline}>
      <Text style={styles.waitingTitle}>⚫ You&apos;re offline</Text>
      <Text style={styles.waitingText}>Go online to start receiving instant walk requests within your radius.</Text>
      <Pressable
        onPress={onGoOnline}
        accessibilityRole="button"
        style={({ pressed }) => [styles.goOnline, pressed && styles.pressed]}
      >
        <Text style={styles.goOnlineText}>🟢 Go Online</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  request: {
    gap: 14,
    padding: 18,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.card,
    ...shadows.card,
  },
  requestTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  newPill: {
    flexShrink: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    backgroundColor: colors.coralTint,
  },
  newText: {
    fontFamily: fonts.extrabold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
    color: colors.coralInk,
  },
  countdown: {
    fontFamily: fonts.extrabold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.coral,
  },
  dogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dogAvatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.stage,
  },
  dogEmoji: {
    fontSize: 32,
  },
  dogOnline: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.card,
  },
  dogNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dogName: {
    ...typography.headline,
    fontSize: 20,
  },
  breed: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
    backgroundColor: colors.track,
  },
  breedText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 15,
    color: colors.ink,
  },
  dogMeta: {
    ...typography.body,
    fontSize: 13,
  },
  payout: {
    fontFamily: fonts.extrabold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.primary,
    marginTop: 2,
  },
  tip: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.primary,
  },
  pickup: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.input,
  },
  pickupLabel: {
    ...typography.overline,
    fontSize: 10,
  },
  pickupAddress: {
    ...typography.subhead,
    marginTop: 2,
  },
  pickupArea: {
    ...typography.bodySm,
  },
  requestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  decline: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.slate,
  },
  insured: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  insuredText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.successInk,
  },
  teaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.card,
    ...shadows.card,
  },
  teaserBell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.coralTint,
  },
  teaserEmoji: {
    fontSize: 20,
  },
  teaserTitle: {
    ...typography.subhead,
  },
  teaserText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.coralInk,
    marginTop: 2,
  },
  teaserCta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  teaserCtaText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.onPrimary,
  },
  waiting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  radar: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
  },
  radarDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
  },
  waitingTitle: {
    ...typography.subhead,
  },
  waitingText: {
    ...typography.bodySm,
    marginTop: 2,
  },
  offline: {
    gap: 6,
  },
  goOnline: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.full,
    backgroundColor: colors.successTint,
  },
  goOnlineText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.successInk,
  },
});
