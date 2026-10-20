import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '../components/Badge';
import { BOTTOM_NAV_HEIGHT } from '../components/BottomNavigation';
import { Card, SectionTitle } from '../components/Card';
import { Chip } from '../components/Chip';
import { Icon } from '../components/Icon';
import { MascotBanner } from '../components/MascotBanner';
import { PageTitle } from '../components/PageTitle';
import { ProgressBar } from '../components/ProgressBar';
import { Toast, useToast } from '../components/Toast';
import { useMascotActions } from '../mascot/MascotProvider';
import { addDays, clockTime, duration, longDate, money, relativeDay, weekday } from '../partner/format';
import { AVAILABILITY, type ScheduledWalk } from '../partner/partnerModel';
import { usePartner, usePartnerActions, useTodaysWalks } from '../partner/PartnerProvider';
import { colors, radii, shadows } from '../theme/colors';
import { fonts, typography } from '../theme/typography';

const DAYS_SHOWN = 7;

/** SCHEDULE: today's walks with start / complete, the week ahead, and availability. */
export function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const { schedule, dayStart, care, online } = usePartner();
  const today = useTodaysWalks();
  const { startWalk, finishWalk, toggleAvailability } = usePartnerActions();
  const { barkWith, setWalking } = useMascotActions();
  const toast = useToast();
  const [dayIndex, setDayIndex] = useState(0);

  // Barnaby trots along while one of your walks is in progress.
  const walkActive = schedule.some((walk) => walk.status === 'active');
  useEffect(() => {
    setWalking(walkActive);
  }, [walkActive, setWalking]);
  useEffect(() => () => setWalking(false), [setWalking]);

  const days = Array.from({ length: DAYS_SHOWN }, (_, index) => addDays(dayStart, index));
  const walksOn = (day: number) => {
    const end = addDays(day, 1);
    return schedule.filter((walk) => walk.pickupAt >= day && walk.pickupAt < end).sort((a, b) => a.pickupAt - b.pickupAt);
  };
  const selectedDay = days[dayIndex];
  const agenda = walksOn(selectedDay);

  const done = today.filter((walk) => walk.status === 'done').length;
  const bookedToday = today.reduce((sum, walk) => sum + walk.request.payout, 0);

  const onStart = (walk: ScheduledWalk) => {
    const active = schedule.find((entry) => entry.status === 'active');
    if (active) {
      toast.show(`Finish ${active.request.dog}'s walk first`);
      return;
    }
    startWalk(walk.id);
    barkWith("Woof! Let's go! 🦮");
    toast.show(`▶️ ${walk.request.dog}'s ${walk.request.service.toLowerCase()} started — GPS tracking on`);
  };

  const onFinish = (walk: ScheduledWalk) => {
    finishWalk(walk.id);
    barkWith('Woof! Walk complete 🏁');
    toast.show(`🏁 ${walk.request.dog} is home safe • ${money(walk.request.payout)} earned`);
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
        <PageTitle title="Schedule" />

        <MascotBanner
          footer={
            today.length > 0 ? (
              <View style={styles.progressRow}>
                <ProgressBar
                  progress={done / today.length}
                  color={colors.success}
                  trackColor="rgba(46, 204, 113, 0.15)"
                  height={7}
                  style={styles.progress}
                />
                <Text style={styles.progressText}>
                  {done}/{today.length} done
                </Text>
              </View>
            ) : null
          }
        >
          <Text style={styles.overline}>TODAY • {longDate(dayStart).toUpperCase()}</Text>
          <Text style={styles.count}>
            {today.length} {today.length === 1 ? 'booking' : 'bookings'}
          </Text>
          <Text style={styles.bannerText}>
            {money(bookedToday)} booked • {walkActive ? '🦮 Walk in progress' : online ? '🟢 Online' : '⚫ Offline'}
          </Text>
        </MascotBanner>

        <View style={styles.days} accessibilityRole="tablist">
          {days.map((day, index) => {
            const selected = index === dayIndex;
            const count = walksOn(day).length;
            return (
              <Pressable
                key={day}
                onPress={() => setDayIndex(index)}
                role="tab"
                aria-selected={selected}
                aria-label={`${relativeDay(day, dayStart)}, ${count} bookings`}
                style={({ pressed }) => [styles.day, selected && styles.daySelected, pressed && styles.pressed]}
              >
                <Text style={[styles.dayName, selected && styles.dayTextSelected]}>
                  {index === 0 ? 'Today' : weekday(day)}
                </Text>
                <Text style={[styles.dayNumber, selected && styles.dayTextSelected]}>{new Date(day).getDate()}</Text>
                <View style={[styles.dayDot, count === 0 && styles.dayDotEmpty, selected && styles.dayDotSelected]} />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.section}>
          <SectionTitle
            title={relativeDay(selectedDay, dayStart)}
            accessory={
              <Text style={styles.hint}>
                {agenda.length} {agenda.length === 1 ? 'booking' : 'bookings'}
              </Text>
            }
            style={styles.sectionTitle}
          />
          {agenda.length === 0 ? (
            <Card style={styles.empty}>
              <Text style={styles.emptyTitle}>📅 Nothing booked</Text>
              <Text style={styles.emptyText}>
                {dayIndex === 0
                  ? 'Go online and accept instant requests to fill your day.'
                  : 'Regular clients and accepted requests for this day show up here.'}
              </Text>
            </Card>
          ) : (
            agenda.map((walk) => (
              <WalkCard
                key={walk.id}
                walk={walk}
                actionable={dayIndex === 0}
                onStart={() => onStart(walk)}
                onFinish={() => onFinish(walk)}
              />
            ))
          )}
        </View>

        <Card>
          <SectionTitle title="Your Availability" accessory={<Text style={styles.hint}>For new requests</Text>} />
          <View style={styles.chips}>
            {AVAILABILITY.map((slot) => (
              <Chip
                key={slot.key}
                label={slot.label}
                selected={care.availability.includes(slot.key)}
                onPress={() => toggleAvailability(slot.key)}
              />
            ))}
          </View>
          <Text style={styles.emptyText}>📍 Matching walks within {care.radiusKm.toFixed(1)} km of home</Text>
        </Card>
      </ScrollView>
      <Toast message={toast.message} bottomOffset={BOTTOM_NAV_HEIGHT + 24} />
    </View>
  );
}

function WalkCard({
  walk,
  actionable,
  onStart,
  onFinish,
}: {
  walk: ScheduledWalk;
  actionable: boolean;
  onStart: () => void;
  onFinish: () => void;
}) {
  const { request, status } = walk;
  return (
    <View style={[styles.walk, status === 'active' && styles.walkActive, status === 'done' && styles.walkDone]}>
      <View style={styles.walkTop}>
        <View style={styles.time}>
          <Text style={styles.clock}>{clockTime(walk.pickupAt)}</Text>
          <Text style={styles.length}>{duration(request.minutes)}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.walkTitle} numberOfLines={1}>
            {request.emoji} {request.dog} <Text style={styles.breed}>• {request.breed}</Text>
          </Text>
          <Text style={styles.walkMeta} numberOfLines={1}>
            {request.service} • {request.temperament}
          </Text>
          <View style={styles.address}>
            <Icon name="place" size={14} color={colors.slate} />
            <Text style={styles.walkMeta} numberOfLines={1}>
              {request.address}
            </Text>
          </View>
        </View>
        <Text style={styles.pay}>{money(request.payout)}</Text>
      </View>

      <View style={styles.walkBottom}>
        <Badge
          label={walk.source === 'instant' ? '⚡ Instant request' : `🔁 ${walk.note ?? 'Regular client'}`}
          tone={walk.source === 'instant' ? 'coral' : 'amber'}
        />
        {status === 'done' ? (
          <Badge label="✓ Completed" tone="success" />
        ) : !actionable ? (
          <Text style={styles.upcoming}>Upcoming</Text>
        ) : status === 'active' ? (
          <Pressable
            onPress={onFinish}
            accessibilityRole="button"
            style={({ pressed }) => [styles.action, styles.finish, pressed && styles.pressed]}
          >
            <Text style={styles.actionText}>🏁 Complete Walk</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onStart}
            accessibilityRole="button"
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <Text style={styles.actionText}>▶ Start Walk</Text>
          </Pressable>
        )}
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
    transform: [{ scale: 0.97 }],
  },
  overline: {
    ...typography.overline,
    color: colors.amberInk,
  },
  count: {
    fontFamily: fonts.extrabold,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.8,
    color: colors.ink,
  },
  bannerText: {
    ...typography.bodySm,
    color: colors.ink,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progress: {
    flex: 1,
    width: undefined,
  },
  progressText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.successInk,
  },
  days: {
    flexDirection: 'row',
    gap: 6,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    ...shadows.soft,
  },
  daySelected: {
    backgroundColor: colors.primary,
    ...shadows.primary,
  },
  dayName: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    lineHeight: 14,
    color: colors.slate,
  },
  dayNumber: {
    fontFamily: fonts.extrabold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.ink,
  },
  dayTextSelected: {
    color: colors.onPrimary,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.coral,
  },
  dayDotEmpty: {
    backgroundColor: 'transparent',
  },
  dayDotSelected: {
    backgroundColor: colors.onPrimary,
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
  empty: {
    gap: 4,
  },
  emptyTitle: {
    ...typography.subhead,
  },
  emptyText: {
    ...typography.bodySm,
  },
  walk: {
    gap: 12,
    padding: 16,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.card,
    ...shadows.card,
  },
  walkActive: {
    borderColor: colors.success,
  },
  walkDone: {
    opacity: 0.7,
  },
  walkTop: {
    flexDirection: 'row',
    gap: 12,
  },
  time: {
    width: 68,
  },
  clock: {
    fontFamily: fonts.extrabold,
    fontSize: 14,
    lineHeight: 19,
    color: colors.ink,
  },
  length: {
    ...typography.bodySm,
  },
  walkTitle: {
    ...typography.subhead,
    fontSize: 16,
  },
  breed: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.slate,
  },
  walkMeta: {
    ...typography.bodySm,
    flexShrink: 1,
  },
  address: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  pay: {
    fontFamily: fonts.extrabold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.successInk,
  },
  walkBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  upcoming: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primary,
  },
  action: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    ...shadows.primary,
  },
  finish: {
    backgroundColor: colors.successInk,
    boxShadow: '0px 6px 14px rgba(23, 138, 76, 0.25)',
  },
  actionText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.onPrimary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
