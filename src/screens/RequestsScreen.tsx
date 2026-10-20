import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, type BadgeTone } from '../components/Badge';
import { BOTTOM_NAV_HEIGHT } from '../components/BottomNavigation';
import { Card, SectionTitle } from '../components/Card';
import { MascotBanner } from '../components/MascotBanner';
import { PageTitle } from '../components/PageTitle';
import { Toast, useToast } from '../components/Toast';
import { useMascotActions } from '../mascot/MascotProvider';
import { clockTime, duration, money } from '../partner/format';
import { OnlinePill } from '../partner/OnlinePill';
import { PARTNER_SHARE, REQUEST_WINDOW_S, type RequestLogEntry, type RequestOutcome } from '../partner/partnerModel';
import { usePartner, usePartnerActions, usePartnerTotals } from '../partner/PartnerProvider';
import { OfflineCard, RequestCard, WaitingCard } from '../partner/RequestCards';
import { colors, radii } from '../theme/colors';
import { fonts, typography } from '../theme/typography';

const OUTCOME: Record<RequestOutcome, { label: string; tone: BadgeTone }> = {
  accepted: { label: 'Accepted', tone: 'success' },
  declined: { label: 'Declined', tone: 'primary' },
  expired: { label: 'Missed', tone: 'coral' },
};

/** REQUESTS: the live instant request, acceptance stats and what happened to earlier ones. */
export function RequestsScreen() {
  const insets = useSafeAreaInsets();
  const { online, incoming, requestLog, care } = usePartner();
  const totals = usePartnerTotals();
  const { setOnline, acceptRequest, declineRequest } = usePartnerActions();
  const { barkWith } = useMascotActions();
  const toast = useToast();

  const toggleOnline = (next: boolean) => {
    setOnline(next);
    toast.show(next ? '🟢 You’re online — requests incoming' : '⚫ You’re offline — no new requests');
  };

  const onAccept = () => {
    if (!incoming) return;
    const { request } = incoming;
    acceptRequest(incoming.key);
    barkWith('Woof! Walk accepted 🐾');
    toast.show(`✅ ${request.dog}'s walk accepted • +${money(request.payout)} • added to Schedule`);
  };

  const onDecline = () => {
    if (!incoming) return;
    declineRequest(incoming.key);
    toast.show('Request declined — no penalty');
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
        <PageTitle title="Live Requests" />

        <MascotBanner
          footer={
            <View style={styles.stats}>
              <Stat value={`${totals.acceptedToday}`} label="Accepted" />
              <Stat value={`${totals.missedToday}`} label="Missed" />
              <Stat value={`${care.radiusKm.toFixed(1)} km`} label="Radius" />
            </View>
          }
        >
          <Text style={styles.overline}>ACCEPTANCE RATE</Text>
          <Text style={styles.rate}>{totals.acceptanceRate}%</Text>
          <Text style={styles.bannerText}>
            Requests within {care.radiusKm.toFixed(1)} km of home • {REQUEST_WINDOW_S}s to accept
          </Text>
        </MascotBanner>

        <OnlinePill online={online} onToggle={toggleOnline} />

        <View style={styles.section}>
          <SectionTitle
            title="Incoming"
            accessory={<Text style={styles.hint}>{online ? (incoming ? '1 waiting' : 'Listening…') : 'Paused'}</Text>}
            style={styles.sectionTitle}
          />
          {!online ? (
            <OfflineCard onGoOnline={() => toggleOnline(true)} />
          ) : incoming ? (
            <RequestCard key={incoming.key} incoming={incoming} onAccept={onAccept} onDecline={onDecline} />
          ) : (
            <WaitingCard lastOutcome={requestLog[0]?.outcome} />
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle
            title="Recent Activity"
            accessory={<Text style={styles.hint}>{requestLog.length} today</Text>}
            style={styles.sectionTitle}
          />
          {requestLog.length === 0 ? (
            <Card style={styles.empty}>
              <Text style={styles.emptyTitle}>🗂️ Nothing yet</Text>
              <Text style={styles.emptyText}>Requests you accept, decline or miss will show up here.</Text>
            </Card>
          ) : (
            <Card style={styles.log}>
              {requestLog.map((entry, index) => (
                <LogRow key={entry.id} entry={entry} first={index === 0} />
              ))}
            </Card>
          )}
        </View>

        <Card style={styles.tips}>
          <Text style={styles.emptyTitle}>💡 How requests work</Text>
          <Tip text={`You always see the payout before accepting — you keep ${Math.round(PARTNER_SHARE * 100)}%.`} />
          <Tip text={`Each request waits ${REQUEST_WINDOW_S} seconds, then goes to the next walker.`} />
          <Tip text="Declining is free: it never lowers your rating or acceptance rate." />
        </Card>
      </ScrollView>
      <Toast message={toast.message} bottomOffset={BOTTOM_NAV_HEIGHT + 24} />
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LogRow({ entry, first }: { entry: RequestLogEntry; first: boolean }) {
  const { request } = entry;
  const outcome = OUTCOME[entry.outcome];
  return (
    <View style={[styles.logRow, !first && styles.divider]}>
      <View style={styles.logAvatar}>
        <Text style={styles.logEmoji}>{request.emoji}</Text>
      </View>
      <View style={styles.flex}>
        <Text style={styles.logTitle} numberOfLines={1}>
          {request.dog} • {duration(request.minutes)} {request.service.toLowerCase()}
        </Text>
        <Text style={styles.logMeta} numberOfLines={1}>
          {clockTime(entry.at)} • {request.distanceKm.toFixed(1)} km away
        </Text>
      </View>
      <View style={styles.logRight}>
        <Badge label={outcome.label} tone={outcome.tone} />
        <Text style={[styles.logAmount, entry.outcome === 'accepted' && { color: colors.successInk }]}>
          {entry.outcome === 'accepted' ? '+' : ''}
          {money(request.payout)}
        </Text>
      </View>
    </View>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <View style={styles.tip}>
      <View style={styles.tipDot} />
      <Text style={styles.tipText}>{text}</Text>
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
  overline: {
    ...typography.overline,
    color: colors.amberInk,
  },
  rate: {
    fontFamily: fonts.extrabold,
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: -1,
    color: colors.ink,
  },
  bannerText: {
    ...typography.bodySm,
    color: colors.ink,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  statValue: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    lineHeight: 21,
    color: colors.ink,
  },
  statLabel: {
    ...typography.bodySm,
    fontSize: 11,
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
  log: {
    gap: 0,
    paddingVertical: 6,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  logAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.stage,
  },
  logEmoji: {
    fontSize: 20,
  },
  logTitle: {
    ...typography.label,
    fontSize: 14,
  },
  logMeta: {
    ...typography.bodySm,
  },
  logRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  logAmount: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 17,
    color: colors.slate,
  },
  tips: {
    gap: 10,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    backgroundColor: colors.primary,
  },
  tipText: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
});
