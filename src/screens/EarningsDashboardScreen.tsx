import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOTTOM_NAV_HEIGHT } from '../components/BottomNavigation';
import { Card, SectionTitle } from '../components/Card';
import { Icon } from '../components/Icon';
import { PageTitle } from '../components/PageTitle';
import { ProgressBar } from '../components/ProgressBar';
import { Toast, useToast } from '../components/Toast';
import { MascotDockSlot } from '../mascot/MascotDockSlot';
import { useMascotActions } from '../mascot/MascotProvider';
import { usePartnerNavigation } from '../navigation/usePartnerNavigation';
import { clockTime, duration, maskAccount, money, relativeDay, weekRange } from '../partner/format';
import { OnlinePill } from '../partner/OnlinePill';
import { PEAK_DAYS, type DayEarnings, type Payout, type ScheduledWalk } from '../partner/partnerModel';
import { usePartner, usePartnerActions, usePartnerTotals } from '../partner/PartnerProvider';
import { RequestTeaser } from '../partner/RequestCards';
import { colors, radii, shadows } from '../theme/colors';
import { fonts, typography } from '../theme/typography';

/** Walks to reach Level 5 and its bonus. */
const BONUS_AT_WALKS = 27;
const CHART_HEIGHT = 120;
const PAYOUTS_SHOWN = 4;

/** EARNINGS_DASHBOARD: this week's earnings, cashout, the weekly chart and payouts. */
export function EarningsDashboardScreen() {
  const insets = useSafeAreaInsets();
  const partner = usePartner();
  const totals = usePartnerTotals();
  const { setOnline, cashout } = usePartnerActions();
  const { barkWith } = useMascotActions();
  const { toTab } = usePartnerNavigation();
  const toast = useToast();
  const [weekLabel] = useState(() => weekRange(Date.now()));

  const { online, incoming } = partner;
  const nextWalk = partner.schedule
    .filter((walk) => walk.status !== 'done' && walk.pickupAt >= partner.dayStart)
    .sort((a, b) => a.pickupAt - b.pickupAt)[0];

  const toggleOnline = (next: boolean) => {
    setOnline(next);
    toast.show(next ? '🟢 You’re online — requests incoming' : '⚫ You’re offline — no new requests');
  };

  const onCashout = () => {
    const sent = cashout();
    if (sent <= 0) {
      toast.show('Nothing to cash out yet — accept a walk!');
      return;
    }
    barkWith('Woof! Payday! 💸');
    const bank = totals.primaryBank;
    toast.show(`💸 ${money(sent)} sent to ${bank ? `${bank.name} ${maskAccount(bank.last4)}` : 'your bank'}`);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: BOTTOM_NAV_HEIGHT + Math.max(insets.bottom, 12) + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <PageTitle
          title="Partner Hub"
          leading={
            <View style={styles.logo}>
              <Text style={styles.logoEmoji}>🐾</Text>
            </View>
          }
          trailing={
            <Pressable
              onPress={() => toTab('requests')}
              accessibilityRole="button"
              accessibilityLabel={online && incoming ? 'Notifications: 1 new request' : 'Notifications'}
              style={({ pressed }) => [styles.bell, pressed && styles.pressed]}
            >
              <Icon name="notifications-none" size={24} color={colors.ink} />
              {online && incoming ? <View style={styles.bellDot} /> : null}
            </Pressable>
          }
        />

        <OnlinePill online={online} onToggle={toggleOnline} />

        <EarningsHero
          earned={totals.earned}
          trend={totals.trend}
          available={partner.cashoutAvailable}
          onCashout={onCashout}
        />

        <View style={styles.bento}>
          <BentoCard emoji="🦮" tint={colors.primaryTint} value={`${totals.walks} Walks`} caption="100% Completion" />
          <BentoCard
            emoji="⭐"
            tint={colors.amberTint}
            value={partner.rating.toFixed(2)}
            caption={`${partner.reviews} Reviews`}
          />
          <BentoCard emoji="💝" tint={colors.coralTint} value={money(totals.tips)} caption="Tips • 100% Yours" />
        </View>

        <WeeklyChart week={partner.week} todayIndex={partner.todayIndex} total={totals.earned} range={weekLabel} />

        {(online && incoming) || nextWalk ? (
          <View style={styles.section}>
            <SectionTitle title="Right Now" style={styles.sectionTitle} />
            {online && incoming ? (
              <RequestTeaser key={incoming.key} incoming={incoming} onOpen={() => toTab('requests')} />
            ) : null}
            {nextWalk ? (
              <NextWalkCard walk={nextWalk} dayStart={partner.dayStart} onOpen={() => toTab('schedule')} />
            ) : null}
          </View>
        ) : null}

        <PayoutHistory payouts={partner.payouts} dayStart={partner.dayStart} />
        <LevelCard walks={totals.walks} />
      </ScrollView>
      <Toast message={toast.message} bottomOffset={BOTTOM_NAV_HEIGHT + 24} />
    </View>
  );
}

function EarningsHero({
  earned,
  trend,
  available,
  onCashout,
}: {
  earned: number;
  trend: number;
  available: number;
  onCashout: () => void;
}) {
  return (
    <View style={styles.hero}>
      <Text style={styles.heroPaw} accessibilityElementsHidden importantForAccessibility="no">
        🐾
      </Text>
      <View style={styles.heroText}>
        <Text style={styles.heroLabel}>THIS WEEK&apos;S EARNINGS</Text>
        <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit>
          {money(earned)}
        </Text>
        <View style={styles.trendRow}>
          <View style={styles.trend}>
            <Icon name="trending-up" size={14} color={colors.successInk} />
            <Text style={styles.trendText}>
              {trend >= 0 ? '+' : ''}
              {trend}%
            </Text>
          </View>
          <Text style={styles.trendCaption}>vs last week</Text>
        </View>
        <Text style={styles.available}>
          Available for instant cashout: <Text style={styles.availableAmount}>{money(available)}</Text>
        </Text>
      </View>
      <View style={styles.heroSide}>
        <MascotDockSlot variant="compact-dock" />
        <Pressable
          onPress={onCashout}
          accessibilityRole="button"
          accessibilityLabel={`Instant cashout ${money(available)}`}
          style={({ pressed }) => [styles.cashout, available <= 0 && styles.cashoutDone, pressed && styles.pressed]}
        >
          <Text style={styles.cashoutText}>{available > 0 ? '⚡ Instant Cashout' : '✓ Cashed out'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function BentoCard({ emoji, tint, value, caption }: { emoji: string; tint: string; value: string; caption: string }) {
  return (
    <View style={styles.bentoCard}>
      <View style={[styles.bentoIcon, { backgroundColor: tint }]}>
        <Text style={styles.bentoEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.bentoValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.bentoCaption} numberOfLines={2}>
        {caption}
      </Text>
    </View>
  );
}

function WeeklyChart({
  week,
  todayIndex,
  total,
  range,
}: {
  week: readonly DayEarnings[];
  todayIndex: number;
  total: number;
  range: string;
}) {
  const [selected, setSelected] = useState(todayIndex);
  const max = Math.max(...week.map((day) => day.earned), 1);
  const weekdays = week.slice(0, 4);
  const weekdayAverage = weekdays.reduce((sum, day) => sum + day.earned, 0) / weekdays.length;
  const day = week[selected];

  return (
    <Card>
      <View style={styles.chartHead}>
        <View style={styles.flex}>
          <Text style={styles.chartTitle}>Weekly Performance</Text>
          <Text style={styles.chartRange}>{range}</Text>
        </View>
        <View style={styles.chartTotal}>
          <Text style={styles.chartTotalValue}>{money(total)}</Text>
          <Text style={styles.chartRange}>Total Net</Text>
        </View>
      </View>

      <View style={styles.bars} accessibilityRole="list">
        {week.map((entry, index) => {
          const peak = PEAK_DAYS.includes(entry.label);
          const active = index === selected;
          return (
            <Pressable
              key={entry.label}
              onPress={() => setSelected(index)}
              accessibilityRole="button"
              accessibilityLabel={`${entry.label}: ${money(entry.earned)}`}
              accessibilityState={{ selected: active }}
              style={styles.barColumn}
            >
              <Text style={[styles.barValue, peak && { color: colors.coralInk }]} numberOfLines={1}>
                ${Math.round(entry.earned)}
              </Text>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(6, (entry.earned / max) * CHART_HEIGHT),
                    backgroundColor: peak ? colors.coral : colors.primary,
                    opacity: active ? 1 : peak ? 0.85 : 0.35,
                  },
                  active && styles.barActive,
                ]}
              />
              <Text style={[styles.barLabel, active && styles.barLabelActive]}>
                {index === todayIndex ? 'Today' : entry.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.breakdown} accessibilityLiveRegion="polite">
        <Text style={styles.breakdownDay}>
          {day.label}
          {selected === todayIndex ? ' • Today' : ''}
        </Text>
        <Text style={styles.breakdownText}>
          {money(day.earned)} earned • {day.walks} walks • {money(day.tips)} tips
        </Text>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.coral }]} />
          <Text style={styles.legendText}>Peak surge (weekend)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary, opacity: 0.35 }]} />
          <Text style={styles.legendText}>Weekday avg: {money(weekdayAverage)}</Text>
        </View>
      </View>
    </Card>
  );
}

function NextWalkCard({ walk, dayStart, onOpen }: { walk: ScheduledWalk; dayStart: number; onOpen: () => void }) {
  const { request } = walk;
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      style={({ pressed }) => [styles.nextWalk, pressed && styles.pressed]}
    >
      <View style={styles.nextIcon}>
        <Text style={styles.bentoEmoji}>📅</Text>
      </View>
      <View style={styles.flex}>
        <Text style={styles.nextLabel}>{walk.status === 'active' ? 'WALK IN PROGRESS' : 'NEXT ON YOUR SCHEDULE'}</Text>
        <Text style={styles.nextTitle} numberOfLines={1}>
          {request.emoji} {request.dog} • {duration(request.minutes)} {request.service.toLowerCase()}
        </Text>
        <Text style={styles.nextText} numberOfLines={1}>
          {relativeDay(walk.pickupAt, dayStart)}, {clockTime(walk.pickupAt)} • {request.address}
        </Text>
      </View>
      <Icon name="chevron-right" size={22} color={colors.placeholder} />
    </Pressable>
  );
}

function PayoutHistory({ payouts, dayStart }: { payouts: readonly Payout[]; dayStart: number }) {
  return (
    <Card>
      <SectionTitle title="Recent Payouts" accessory={<Text style={styles.hint}>To your bank</Text>} />
      {payouts.slice(0, PAYOUTS_SHOWN).map((payout, index) => (
        <View key={payout.id} style={[styles.payoutRow, index > 0 && styles.divider]}>
          <View
            style={[
              styles.payoutIcon,
              { backgroundColor: payout.kind === 'instant' ? colors.coralTint : colors.primaryTint },
            ]}
          >
            <Text style={styles.payoutEmoji}>{payout.kind === 'instant' ? '⚡' : '📅'}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.payoutTitle}>
              {payout.kind === 'instant' ? 'Instant cashout' : 'Weekly auto-transfer'}
            </Text>
            <Text style={styles.payoutMeta} numberOfLines={1}>
              {relativeDay(payout.at, dayStart)}, {clockTime(payout.at)} • {maskAccount(payout.last4)}
            </Text>
          </View>
          <Text style={styles.payoutAmount}>{money(payout.amount)}</Text>
        </View>
      ))}
    </Card>
  );
}

function LevelCard({ walks }: { walks: number }) {
  const left = Math.max(0, BONUS_AT_WALKS - walks);
  return (
    <View style={styles.level}>
      <View style={styles.levelIcon}>
        <Text style={styles.bentoEmoji}>🏅</Text>
      </View>
      <View style={styles.flex}>
        <Text style={styles.levelTitle}>Level 4 Master Walker</Text>
        <Text style={styles.levelText}>
          {left > 0 ? `${left} more walk${left === 1 ? '' : 's'} to unlock a $50 bonus` : '🎉 $50 bonus unlocked!'}
        </Text>
        <ProgressBar progress={Math.min(1, walks / BONUS_AT_WALKS)} height={6} style={styles.levelBar} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: 18,
    gap: 16,
  },
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryTint,
  },
  logoEmoji: {
    fontSize: 22,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    ...shadows.soft,
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.coral,
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  hero: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderRadius: radii.xl,
    backgroundColor: colors.stage,
    overflow: 'hidden',
    ...shadows.card,
  },
  heroPaw: {
    position: 'absolute',
    right: -14,
    bottom: -26,
    fontSize: 120,
    opacity: 0.06,
  },
  heroText: {
    flex: 1,
    gap: 4,
  },
  heroLabel: {
    ...typography.overline,
    color: colors.amberInk,
  },
  heroAmount: {
    fontFamily: fonts.extrabold,
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: -1,
    color: colors.ink,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: colors.card,
  },
  trendText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.successInk,
  },
  trendCaption: {
    ...typography.bodySm,
  },
  available: {
    ...typography.bodySm,
    color: colors.ink,
    marginTop: 8,
  },
  availableAmount: {
    fontFamily: fonts.extrabold,
  },
  heroSide: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cashout: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.full,
    backgroundColor: colors.coral,
    ...shadows.coral,
  },
  cashoutDone: {
    backgroundColor: colors.successInk,
    boxShadow: 'none',
  },
  cashoutText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.onPrimary,
  },
  bento: {
    flexDirection: 'row',
    gap: 10,
  },
  bentoCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    ...shadows.card,
  },
  bentoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bentoEmoji: {
    fontSize: 18,
  },
  bentoValue: {
    fontFamily: fonts.extrabold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.ink,
  },
  bentoCaption: {
    ...typography.bodySm,
    fontSize: 11,
    textAlign: 'center',
  },
  chartHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  chartTitle: {
    ...typography.headline,
  },
  chartRange: {
    ...typography.bodySm,
  },
  chartTotal: {
    alignItems: 'flex-end',
  },
  chartTotalValue: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.primary,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: CHART_HEIGHT + 44,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barValue: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 13,
    color: colors.slate,
  },
  bar: {
    alignSelf: 'stretch',
    marginHorizontal: 3,
    borderRadius: 8,
  },
  barActive: {
    boxShadow: '0px 6px 14px rgba(24, 26, 32, 0.15)',
  },
  barLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    lineHeight: 14,
    color: colors.slate,
  },
  barLabelActive: {
    fontFamily: fonts.extrabold,
    color: colors.ink,
  },
  breakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.primaryTint,
  },
  breakdownDay: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primary,
  },
  breakdownText: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.ink,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    ...typography.bodySm,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    paddingHorizontal: 4,
    marginTop: 4,
  },
  hint: {
    ...typography.bodySm,
    fontFamily: fonts.semibold,
  },
  nextWalk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    ...shadows.card,
  },
  nextIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryTint,
  },
  nextLabel: {
    ...typography.overline,
    fontSize: 10,
    color: colors.primary,
  },
  nextTitle: {
    ...typography.subhead,
    marginTop: 2,
  },
  nextText: {
    ...typography.bodySm,
    marginTop: 1,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  payoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutEmoji: {
    fontSize: 18,
  },
  payoutTitle: {
    ...typography.label,
    fontSize: 14,
  },
  payoutMeta: {
    ...typography.bodySm,
  },
  payoutAmount: {
    fontFamily: fonts.extrabold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.successInk,
  },
  level: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    ...shadows.card,
  },
  levelIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryTint,
  },
  levelTitle: {
    ...typography.subhead,
  },
  levelText: {
    ...typography.bodySm,
    marginTop: 2,
  },
  levelBar: {
    marginTop: 8,
  },
});
