/**
 * Pawsome Partner's catalogue and demo data. Pure data (no React).
 */

/** The partner keeps 85% of every walk; PawPal keeps 15%. */
export const PARTNER_SHARE = 0.85;

export const WALK_RATE = { min: 15, max: 40, step: 1, recommended: [20, 26] as const };
export const HOURLY_RATE = { min: 15, max: 60, step: 1 };
export const RADIUS_KM = { min: 1, max: 15, step: 0.5 };

export type RoleKey = 'walker' | 'sitter' | 'groomer';

export const ROLES: readonly { key: RoleKey; emoji: string; title: string; detail: string; tag: string }[] = [
  {
    key: 'walker',
    emoji: '🦮',
    title: 'Certified Dog Walker',
    detail: 'GPS-tracked 30, 45 & 60 min walks',
    tag: '🔥 High demand • Avg $22/walk',
  },
  {
    key: 'sitter',
    emoji: '🏠',
    title: 'Pet Caretaker & Sitter',
    detail: 'Drop-in feeding, daycare & overnight sitting',
    tag: 'Avg $35–$65 / session',
  },
  {
    key: 'groomer',
    emoji: '🛁',
    title: 'Grooming & Spa Helper',
    detail: 'Baths, brushing & nail trims at home',
    tag: 'Avg $28 / visit',
  },
];

export type SizeKey = 'small' | 'medium' | 'large' | 'giant';

export const SIZES: readonly { key: SizeKey; label: string }[] = [
  { key: 'small', label: 'Small (0–7kg)' },
  { key: 'medium', label: 'Medium / Corgis (7–18kg)' },
  { key: 'large', label: 'Large (18–35kg)' },
  { key: 'giant', label: 'Giant (35kg+)' },
];

export type SkillKey = 'meds' | 'puppy' | 'cpr' | 'runners' | 'senior';

export const SKILLS: readonly { key: SkillKey; label: string }[] = [
  { key: 'meds', label: '💊 Oral Meds Admin' },
  { key: 'puppy', label: '🐶 Puppy Training' },
  { key: 'cpr', label: '🩹 Pet CPR Certified' },
  { key: 'runners', label: '⚡ High-Energy Runners' },
  { key: 'senior', label: '👵 Senior Dogs' },
];

export type AvailabilityKey = 'mornings' | 'afternoons' | 'evenings' | 'weekends';

export const AVAILABILITY: readonly { key: AvailabilityKey; label: string }[] = [
  { key: 'mornings', label: '🌅 Mornings' },
  { key: 'afternoons', label: '☀️ Afternoons' },
  { key: 'evenings', label: '🌙 Evenings' },
  { key: 'weekends', label: '📅 Weekends' },
];

export const BIO_LIMIT = 240;

export interface DayEarnings {
  label: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  earned: number;
  walks: number;
  tips: number;
}

/** This week, Monday first: $486.50 over 24 walks with $64 in tips. */
export const DEMO_WEEK: readonly DayEarnings[] = [
  { label: 'Mon', earned: 45, walks: 2, tips: 6 },
  { label: 'Tue', earned: 68, walks: 3, tips: 8 },
  { label: 'Wed', earned: 52, walks: 2, tips: 6 },
  { label: 'Thu', earned: 74, walks: 3, tips: 9 },
  { label: 'Fri', earned: 115, walks: 6, tips: 14 },
  { label: 'Sat', earned: 98, walks: 5, tips: 13 },
  { label: 'Sun', earned: 34.5, walks: 3, tips: 8 },
];

/** Weekend surge days are drawn in coral. */
export const PEAK_DAYS: readonly DayEarnings['label'][] = ['Fri', 'Sat'];

export const LAST_WEEK_TOTAL = 412.3;

export interface WalkRequest {
  id: string;
  dog: string;
  breed: string;
  emoji: string;
  service: string;
  minutes: number;
  payout: number;
  tip: number;
  distanceKm: number;
  address: string;
  area: string;
  temperament: string;
}

/** Incoming instant requests, played in order and then looped. */
export const REQUEST_FEED: readonly WalkRequest[] = [
  {
    id: 'barnaby',
    dog: 'Barnaby',
    breed: 'Corgi',
    emoji: '🐕',
    service: 'Walk',
    minutes: 45,
    payout: 22,
    tip: 4,
    distanceKm: 0.6,
    address: '742 Evergreen Terrace (Apt 4B)',
    area: 'Elm Creek Estates • 4 mins walk',
    temperament: 'Gentle pacer',
  },
  {
    id: 'luna',
    dog: 'Luna',
    breed: 'Golden Retriever',
    emoji: '🦮',
    service: 'Walk',
    minutes: 30,
    payout: 16.5,
    tip: 2.5,
    distanceKm: 1.1,
    address: '18 Maple Court',
    area: 'Riverside Park • 9 mins walk',
    temperament: 'Loves fetch',
  },
  {
    id: 'mochi',
    dog: 'Mochi',
    breed: 'Shiba Inu',
    emoji: '🐕',
    service: 'Walk',
    minutes: 60,
    payout: 29,
    tip: 5,
    distanceKm: 0.9,
    address: '55 Willow Lane',
    area: 'Oak Hollow • 7 mins walk',
    temperament: 'Strong puller',
  },
  {
    id: 'pepper',
    dog: 'Pepper',
    breed: 'Beagle',
    emoji: '🐶',
    service: 'Drop-in visit',
    minutes: 30,
    payout: 18,
    tip: 3,
    distanceKm: 1.4,
    address: '9 Birch Row',
    area: 'West Riverdale • 12 mins walk',
    temperament: 'Needs meds at 6 PM',
  },
];

/** Seconds a partner has to accept an instant request. */
export const REQUEST_WINDOW_S = 25;
/** The first request after going online arrives quickly… */
export const FIRST_REQUEST_MS = 1500;
/** …then there's a pause before each next one. */
export const NEXT_REQUEST_MS = 5000;
/** An accepted instant walk is picked up ~10 minutes later. */
export const PICKUP_LEAD_MS = 10 * 60 * 1000;

/** Before this session: 124 of 128 offered requests accepted (97%). */
export const LIFETIME_OFFERS = { accepted: 124, offered: 128 };

/** The request on screen right now, and when it arrived (its 25s window starts then). */
export interface IncomingRequest {
  request: WalkRequest;
  key: number;
  arrivedAt: number;
}

export type RequestOutcome = 'accepted' | 'declined' | 'expired';

export interface RequestLogEntry {
  id: string;
  request: WalkRequest;
  outcome: RequestOutcome;
  at: number;
}

export type WalkStatus = 'upcoming' | 'active' | 'done';

export interface ScheduledWalk {
  id: string;
  request: WalkRequest;
  pickupAt: number;
  status: WalkStatus;
  /** Instant requests accepted live, or a regular client's standing booking. */
  source: 'instant' | 'recurring';
  note?: string;
}

/** Standing bookings from regular clients, `dayOffset` days from today. */
export const RECURRING_BOOKINGS: readonly {
  id: string;
  dayOffset: number;
  hour: number;
  minute: number;
  note: string;
  request: WalkRequest;
}[] = [
  {
    id: 'biscuit',
    dayOffset: 0,
    hour: 18,
    minute: 30,
    note: 'Every weekday',
    request: {
      id: 'biscuit',
      dog: 'Biscuit',
      breed: 'Cavapoo',
      emoji: '🐩',
      service: 'Walk',
      minutes: 30,
      payout: 16,
      tip: 2,
      distanceKm: 0.8,
      address: '31 Juniper Street',
      area: 'Elm Creek • 6 mins walk',
      temperament: 'Shy with big dogs',
    },
  },
  {
    id: 'max',
    dayOffset: 1,
    hour: 8,
    minute: 0,
    note: 'Every Wed & Fri',
    request: {
      id: 'max',
      dog: 'Max',
      breed: 'Labrador',
      emoji: '🦮',
      service: 'Walk',
      minutes: 60,
      payout: 29,
      tip: 4,
      distanceKm: 1.2,
      address: '7 Harbor View Road',
      area: 'Riverside • 10 mins walk',
      temperament: 'Loves the lake loop',
    },
  },
  {
    id: 'coco',
    dayOffset: 2,
    hour: 7,
    minute: 30,
    note: 'Every Thursday',
    request: {
      id: 'coco',
      dog: 'Coco',
      breed: 'Poodle',
      emoji: '🐩',
      service: 'Walk',
      minutes: 45,
      payout: 22,
      tip: 3,
      distanceKm: 0.5,
      address: '12 Orchard Lane',
      area: 'Elm Creek • 4 mins walk',
      temperament: 'Senior, slow pace',
    },
  },
  {
    id: 'rocky',
    dayOffset: 3,
    hour: 12,
    minute: 0,
    note: 'Monthly',
    request: {
      id: 'rocky',
      dog: 'Rocky',
      breed: 'Boxer',
      emoji: '🐕',
      service: 'Pet sitting',
      minutes: 180,
      payout: 84,
      tip: 10,
      distanceKm: 2.1,
      address: '480 Cedar Park Drive',
      area: 'Oak Hollow • 15 mins walk',
      temperament: 'Feed at 1 PM',
    },
  },
  {
    id: 'hazel',
    dayOffset: 5,
    hour: 9,
    minute: 0,
    note: 'Every weekend',
    request: {
      id: 'hazel',
      dog: 'Hazel',
      breed: 'Dachshund',
      emoji: '🐶',
      service: 'Walk',
      minutes: 30,
      payout: 16,
      tip: 2,
      distanceKm: 0.7,
      address: '3 Sparrow Court',
      area: 'West Riverdale • 5 mins walk',
      temperament: 'Pulls toward squirrels',
    },
  },
];

export interface Payout {
  id: string;
  amount: number;
  bankName: string;
  last4: string;
  at: number;
  kind: 'instant' | 'auto';
}

export interface BankAccount {
  id: string;
  name: string;
  kind: string;
  last4: string;
}

export const DEMO_BANKS: readonly BankAccount[] = [
  { id: 'chase', name: 'Chase Bank Checking', kind: 'Instant Payout Ready', last4: '4829' },
  { id: 'upi', name: 'Direct Debit / UPI Linked', kind: 'Debit card', last4: '9012' },
];

export const REFERRAL_CODE = 'ALEX-PAWS50';
