/** "$1,486.50" — hand-rolled so it doesn't depend on Intl support in the JS engine. */
export function money(amount: number, decimals = 2): string {
  const fixed = Math.abs(amount).toFixed(decimals);
  const [whole, fraction] = fixed.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${amount < 0 ? '-' : ''}$${grouped}${fraction ? `.${fraction}` : ''}`;
}

/** "$22" for whole amounts, "$18.70" otherwise. */
export function shortMoney(amount: number): string {
  return Number.isInteger(amount) ? money(amount, 0) : money(amount);
}

/** "4:35 PM" */
export function clockTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours % 12 || 12}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Mon, Oct 19 – Sun, Oct 25" for the week containing `timestamp`. */
export function weekRange(timestamp: number): string {
  const day = new Date(timestamp);
  const monday = new Date(day.getFullYear(), day.getMonth(), day.getDate() - ((day.getDay() + 6) % 7));
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  const label = (date: Date) => `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  return `Mon, ${label(monday)} – Sun, ${label(sunday)}`;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_MS = 24 * 60 * 60 * 1000;

/** Local midnight at the start of `timestamp`'s day. */
export function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Local midnight `days` days after `dayStart` (DST-safe). */
export function addDays(dayStart: number, days: number): number {
  const date = new Date(dayStart);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days).getTime();
}

/** "Thu" */
export function weekday(timestamp: number): string {
  return WEEKDAYS[new Date(timestamp).getDay()];
}

/** "Tuesday, Oct 20" */
export function longDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${WEEKDAYS_LONG[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/** "Today", "Tomorrow", "Yesterday" or "Thu, Oct 22", relative to `dayStart`. */
export function relativeDay(timestamp: number, dayStart: number): string {
  const day = startOfDay(timestamp);
  if (day === dayStart) return 'Today';
  if (day === addDays(dayStart, 1)) return 'Tomorrow';
  if (day === addDays(dayStart, -1)) return 'Yesterday';
  const date = new Date(timestamp);
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/** "45 min" or "3 hr". */
export function duration(minutes: number): string {
  return minutes >= 120 && minutes % 60 === 0 ? `${minutes / 60} hr` : `${minutes} min`;
}

/** Last four digits, masked: "•••• 4829". */
export function maskAccount(number: string): string {
  return `•••• ${number.replace(/\D/g, '').slice(-4)}`;
}
