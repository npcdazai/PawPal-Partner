import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { addDays, startOfDay } from './format';
import {
  DEMO_BANKS,
  DEMO_WEEK,
  FIRST_REQUEST_MS,
  LAST_WEEK_TOTAL,
  LIFETIME_OFFERS,
  NEXT_REQUEST_MS,
  PICKUP_LEAD_MS,
  RECURRING_BOOKINGS,
  REQUEST_FEED,
  REQUEST_WINDOW_S,
  type AvailabilityKey,
  type BankAccount,
  type DayEarnings,
  type IncomingRequest,
  type Payout,
  type RequestLogEntry,
  type RequestOutcome,
  type RoleKey,
  type ScheduledWalk,
  type SizeKey,
  type SkillKey,
} from './partnerModel';

export interface PartnerProfile {
  name: string;
  phone: string;
  email: string;
  bio: string;
}

export interface KycStatus {
  otpVerified: boolean;
  idVerified: boolean;
  selfieMatched: boolean;
  consent: boolean;
}

export interface CareSettings {
  roles: readonly RoleKey[];
  sizes: readonly SizeKey[];
  skills: readonly SkillKey[];
  availability: readonly AvailabilityKey[];
  walkRate: number;
  hourlyRate: number;
  radiusKm: number;
}

export interface PartnerState {
  profile: PartnerProfile;
  kyc: KycStatus;
  care: CareSettings;
  online: boolean;
  week: readonly DayEarnings[];
  /** Monday = 0. */
  todayIndex: number;
  /** Local midnight at the start of today. */
  dayStart: number;
  cashoutAvailable: number;
  rating: number;
  reviews: number;
  banks: readonly BankAccount[];
  primaryBankId: string;
  autoTransfer: boolean;
  /** Bookings by pickup time: today's instant walks plus regular clients' standing bookings. */
  schedule: readonly ScheduledWalk[];
  /** The live instant request waiting for an answer (only while online). */
  incoming: IncomingRequest | null;
  /** Position in the demo request feed. */
  feedIndex: number;
  /** Answered and missed requests, newest first. */
  requestLog: readonly RequestLogEntry[];
  /** Money sent to the bank, newest first. */
  payouts: readonly Payout[];
}

export interface PartnerTotals {
  earned: number;
  walks: number;
  tips: number;
  /** Change vs last week, in whole percent. */
  trend: number;
  kycDone: number;
  kycComplete: boolean;
  primaryBank: BankAccount | undefined;
  /** Lifetime acceptance, in whole percent. */
  acceptanceRate: number;
  acceptedToday: number;
  missedToday: number;
}

export interface PartnerActions {
  updateProfile: (patch: Partial<PartnerProfile>) => void;
  updateKyc: (patch: Partial<KycStatus>) => void;
  toggleRole: (key: RoleKey) => void;
  toggleSize: (key: SizeKey) => void;
  toggleSkill: (key: SkillKey) => void;
  toggleAvailability: (key: AvailabilityKey) => void;
  setWalkRate: (rate: number) => void;
  setHourlyRate: (rate: number) => void;
  setRadiusKm: (km: number) => void;
  /** Going offline also withdraws the pending request. */
  setOnline: (online: boolean) => void;
  /** Sends everything available to the primary bank; returns the amount sent. */
  cashout: () => number;
  /** Answers the request with this key (ignored if it has already gone). */
  acceptRequest: (key: number) => void;
  declineRequest: (key: number) => void;
  startWalk: (id: string) => void;
  finishWalk: (id: string) => void;
  addBank: (bank: Omit<BankAccount, 'id'>) => void;
  setPrimaryBank: (id: string) => void;
  setAutoTransfer: (on: boolean) => void;
  /** "Already a verified partner?": a returning, fully verified partner. */
  signIn: () => void;
  /** Registration finished: verified and online. */
  completeRegistration: () => void;
  /** Offline, and back to a fresh registration. */
  logout: () => void;
}

const KYC_FRESH: KycStatus = { otpVerified: false, idVerified: false, selfieMatched: false, consent: false };
const KYC_VERIFIED: KycStatus = { otpVerified: true, idVerified: true, selfieMatched: true, consent: true };

const HOUR_MS = 60 * 60 * 1000;
const HALF_HOUR_MS = HOUR_MS / 2;

/** Standing bookings placed on real dates around `now`. */
function seedSchedule(now: number, dayStart: number): ScheduledWalk[] {
  return RECURRING_BOOKINGS.map((booking) => {
    let pickupAt = addDays(dayStart, booking.dayOffset) + booking.hour * HOUR_MS + booking.minute * 60 * 1000;
    // Today's booking always lies ahead: if its usual slot has passed, it's later this evening.
    if (booking.dayOffset === 0 && pickupAt <= now) {
      pickupAt = Math.min(Math.ceil((now + HOUR_MS) / HALF_HOUR_MS) * HALF_HOUR_MS, addDays(dayStart, 1) - HALF_HOUR_MS);
    }
    return {
      id: `recurring-${booking.id}`,
      request: booking.request,
      pickupAt,
      status: 'upcoming',
      source: 'recurring',
      note: booking.note,
    };
  });
}

/** The latest Monday auto-transfer and an instant cashout the weekend before it, newest first. */
function seedPayouts(now: number, dayStart: number): Payout[] {
  const mondayStart = addDays(dayStart, -((new Date(dayStart).getDay() + 6) % 7));
  let autoDay = mondayStart;
  if (autoDay + 9 * HOUR_MS > now) autoDay = addDays(mondayStart, -7);
  const bank = { bankName: DEMO_BANKS[0].name, last4: DEMO_BANKS[0].last4 };
  return [
    { id: 'seed-auto', amount: 312.4, ...bank, at: autoDay + 9 * HOUR_MS, kind: 'auto' },
    { id: 'seed-instant', amount: 58, ...bank, at: addDays(autoDay, -2) + 18 * HOUR_MS, kind: 'instant' },
  ];
}

const initialState = (now: number): PartnerState => {
  const dayStart = startOfDay(now);
  return {
    profile: {
      name: 'Alex Rivera',
      phone: '+1 (555) 234-8901',
      email: 'alex.rivera@pawsome.care',
      bio: '5+ years caring for Corgis, Retrievers & senior pups. Certified in Pet First Aid & GPS-tracked walks.',
    },
    kyc: KYC_FRESH,
    care: {
      roles: ['walker', 'sitter'],
      sizes: ['medium', 'large'],
      skills: ['meds', 'puppy', 'cpr'],
      availability: ['mornings', 'evenings', 'weekends'],
      walkRate: 22,
      hourlyRate: 28,
      radiusKm: 4,
    },
    online: false,
    week: DEMO_WEEK,
    todayIndex: (new Date(now).getDay() + 6) % 7,
    dayStart,
    cashoutAvailable: 142,
    rating: 4.96,
    reviews: 128,
    banks: DEMO_BANKS,
    primaryBankId: DEMO_BANKS[0].id,
    autoTransfer: true,
    schedule: seedSchedule(now, dayStart),
    incoming: null,
    feedIndex: 0,
    requestLog: [],
    payouts: seedPayouts(now, dayStart),
  };
};

const toggle = <T,>(list: readonly T[], item: T): readonly T[] =>
  list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];

const round2 = (value: number) => Math.round(value * 100) / 100;

const StateContext = createContext<PartnerState | null>(null);
const ActionsContext = createContext<PartnerActions | null>(null);

export function PartnerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => initialState(Date.now()));

  const patchCare = useCallback((update: (care: CareSettings) => Partial<CareSettings>) => {
    setState((current) => ({ ...current, care: { ...current.care, ...update(current.care) } }));
  }, []);

  /** Closes the request with `key`; an accepted walk is paid and booked. */
  const resolve = useCallback((key: number, outcome: RequestOutcome) => {
    const at = Date.now();
    setState((current) => {
      if (!current.incoming || current.incoming.key !== key) return current;
      const { request } = current.incoming;
      const next: PartnerState = {
        ...current,
        incoming: null,
        feedIndex: current.feedIndex + 1,
        requestLog: [{ id: `${request.id}-${key}`, request, outcome, at }, ...current.requestLog].slice(0, 20),
      };
      if (outcome !== 'accepted') return next;
      return {
        ...next,
        week: current.week.map((day, index) =>
          index === current.todayIndex
            ? {
                ...day,
                earned: round2(day.earned + request.payout),
                walks: day.walks + 1,
                tips: round2(day.tips + request.tip),
              }
            : day
        ),
        cashoutAvailable: round2(current.cashoutAvailable + request.payout),
        schedule: [
          ...current.schedule,
          { id: `instant-${key}`, request, pickupAt: at + PICKUP_LEAD_MS, status: 'upcoming', source: 'instant' },
        ],
      };
    });
  }, []);

  // While online with nothing pending, the next instant request arrives shortly…
  const { online, incoming, feedIndex } = state;
  useEffect(() => {
    if (!online || incoming) return undefined;
    const timer = setTimeout(
      () => {
        const arrivedAt = Date.now();
        setState((current) =>
          current.online && !current.incoming
            ? {
                ...current,
                incoming: {
                  request: REQUEST_FEED[current.feedIndex % REQUEST_FEED.length],
                  key: current.feedIndex,
                  arrivedAt,
                },
              }
            : current
        );
      },
      feedIndex === 0 ? FIRST_REQUEST_MS : NEXT_REQUEST_MS
    );
    return () => clearTimeout(timer);
  }, [online, incoming, feedIndex]);

  // …and is missed if nobody answers within its 25s window, whichever tab is open.
  useEffect(() => {
    if (!incoming) return undefined;
    const left = incoming.arrivedAt + REQUEST_WINDOW_S * 1000 - Date.now();
    const timer = setTimeout(() => resolve(incoming.key, 'expired'), Math.max(0, left));
    return () => clearTimeout(timer);
  }, [incoming, resolve]);

  const cashout = useCallback(() => {
    const amount = state.cashoutAvailable;
    if (amount <= 0) return 0;
    const at = Date.now();
    setState((current) => {
      const bank = current.banks.find((entry) => entry.id === current.primaryBankId) ?? current.banks[0];
      return {
        ...current,
        cashoutAvailable: 0,
        payouts: [
          {
            id: `instant-${at}`,
            amount: current.cashoutAvailable,
            bankName: bank?.name ?? 'Bank',
            last4: bank?.last4 ?? '',
            at,
            kind: 'instant' as const,
          },
          ...current.payouts,
        ],
      };
    });
    return amount;
  }, [state.cashoutAvailable]);

  const setWalkStatus = useCallback((id: string, status: ScheduledWalk['status']) => {
    setState((current) => ({
      ...current,
      schedule: current.schedule.map((walk) => (walk.id === id ? { ...walk, status } : walk)),
    }));
  }, []);

  const actions = useMemo<Omit<PartnerActions, 'cashout'>>(
    () => ({
      updateProfile: (patch) => setState((current) => ({ ...current, profile: { ...current.profile, ...patch } })),
      updateKyc: (patch) => setState((current) => ({ ...current, kyc: { ...current.kyc, ...patch } })),
      toggleRole: (key) => patchCare((care) => ({ roles: toggle(care.roles, key) })),
      toggleSize: (key) => patchCare((care) => ({ sizes: toggle(care.sizes, key) })),
      toggleSkill: (key) => patchCare((care) => ({ skills: toggle(care.skills, key) })),
      toggleAvailability: (key) => patchCare((care) => ({ availability: toggle(care.availability, key) })),
      setWalkRate: (walkRate) => patchCare(() => ({ walkRate })),
      setHourlyRate: (hourlyRate) => patchCare(() => ({ hourlyRate })),
      setRadiusKm: (radiusKm) => patchCare(() => ({ radiusKm })),
      setOnline: (next) =>
        setState((current) => ({ ...current, online: next, incoming: next ? current.incoming : null })),
      acceptRequest: (key) => resolve(key, 'accepted'),
      declineRequest: (key) => resolve(key, 'declined'),
      startWalk: (id) => setWalkStatus(id, 'active'),
      finishWalk: (id) => setWalkStatus(id, 'done'),
      addBank: (bank) =>
        setState((current) => ({
          ...current,
          banks: [...current.banks, { ...bank, id: `bank-${current.banks.length + 1}-${bank.last4}` }],
        })),
      setPrimaryBank: (primaryBankId) => setState((current) => ({ ...current, primaryBankId })),
      setAutoTransfer: (autoTransfer) => setState((current) => ({ ...current, autoTransfer })),
      signIn: () => setState((current) => ({ ...current, kyc: KYC_VERIFIED, online: true })),
      completeRegistration: () => setState((current) => ({ ...current, kyc: KYC_VERIFIED, online: true })),
      logout: () => setState(initialState(Date.now())),
    }),
    [patchCare, resolve, setWalkStatus]
  );

  const allActions = useMemo<PartnerActions>(() => ({ ...actions, cashout }), [actions, cashout]);

  return (
    <ActionsContext.Provider value={allActions}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </ActionsContext.Provider>
  );
}

function useRequired<T>(context: React.Context<T | null>, hook: string): T {
  const value = useContext(context);
  if (!value) throw new Error(`${hook} must be used inside <PartnerProvider>`);
  return value;
}

export const usePartner = () => useRequired(StateContext, 'usePartner');
export const usePartnerActions = () => useRequired(ActionsContext, 'usePartnerActions');

/** Derived numbers shown across the tabs. */
export function usePartnerTotals(): PartnerTotals {
  const state = usePartner();
  const earned = round2(state.week.reduce((sum, day) => sum + day.earned, 0));
  const kycDone = Object.values(state.kyc).filter(Boolean).length;
  const acceptedToday = state.requestLog.filter((entry) => entry.outcome === 'accepted').length;
  const missedToday = state.requestLog.filter((entry) => entry.outcome === 'expired').length;
  return {
    earned,
    walks: state.week.reduce((sum, day) => sum + day.walks, 0),
    tips: round2(state.week.reduce((sum, day) => sum + day.tips, 0)),
    trend: Math.round((earned / LAST_WEEK_TOTAL - 1) * 100),
    kycDone,
    kycComplete: kycDone === 4,
    primaryBank: state.banks.find((bank) => bank.id === state.primaryBankId),
    acceptanceRate: Math.round(
      ((LIFETIME_OFFERS.accepted + acceptedToday) / (LIFETIME_OFFERS.offered + state.requestLog.length)) * 100
    ),
    acceptedToday,
    missedToday,
  };
}

/** Today's bookings in pickup order. */
export function useTodaysWalks(): readonly ScheduledWalk[] {
  const { schedule, dayStart } = usePartner();
  const end = addDays(dayStart, 1);
  return schedule
    .filter((walk) => walk.pickupAt >= dayStart && walk.pickupAt < end)
    .sort((a, b) => a.pickupAt - b.pickupAt);
}
