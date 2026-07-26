import type { CalendarFilters, CalendarScope } from "./calendar.ts";
import type { Event } from "./schema.ts";

const SCOPES: CalendarScope[] = ["upcoming", "past"];
const REGISTRATION_METHODS: Event["registrationMethod"][] = [
  "onsite",
  "online",
  "phone",
  "either",
  "store_community",
];

function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * The whole calendar view lives in the URL (same convention as the parts
 * list, comparator and combo builder): shareable, survives a reload, and
 * works with JavaScript off. Anything unrecognised falls back to the
 * default rather than erroring — a hand-edited URL should degrade to a
 * sensible page, never a crash.
 */
export function parseCalendarParams(
  searchParams: Record<string, string | string[] | undefined>,
): CalendarFilters {
  const scopeRaw = first(searchParams.scope);
  const scope = SCOPES.includes(scopeRaw as CalendarScope) ? (scopeRaw as CalendarScope) : "upcoming";

  const regRaw = first(searchParams.reg);
  const registration = REGISTRATION_METHODS.includes(regRaw as Event["registrationMethod"])
    ? (regRaw as Event["registrationMethod"])
    : null;

  const pageRaw = Number(first(searchParams.page));
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  return {
    scope,
    city: first(searchParams.city) ?? null,
    registration,
    age: first(searchParams.age) ?? null,
    page,
  };
}

/**
 * Omits defaults so a plain `/events` link stays clean, and omits `page`
 * whenever the caller is changing a filter — landing on page 6 of a
 * freshly narrowed result set would usually be an empty page.
 */
export function buildCalendarQuery(filters: Partial<CalendarFilters>): Record<string, string> {
  const query: Record<string, string> = {};
  if (filters.scope && filters.scope !== "upcoming") query.scope = filters.scope;
  if (filters.city) query.city = filters.city;
  if (filters.registration) query.reg = filters.registration;
  if (filters.age) query.age = filters.age;
  if (filters.page && filters.page > 1) query.page = String(filters.page);
  return query;
}
