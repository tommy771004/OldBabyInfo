import { localizedNameOf } from "./localized-name.ts";
import { computeComboStats, type ComboStats } from "./combo-stats.ts";
import type { Locale } from "@/i18n/routing.ts";
import type { Part } from "./schema.ts";

export interface PartBattleSubject {
  kind: "part";
  id: string;
  part: Part;
  nameEn: string;
}

export interface ComboBattleSubject {
  kind: "combo";
  id: string;
  parts: readonly [Part, Part, Part];
  nameEn: string;
  stats: ComboStats;
}

export type BattleSubject = PartBattleSubject | ComboBattleSubject;

export function makePartSubject(part: Part): PartBattleSubject {
  return { kind: "part", id: part.id, part, nameEn: part.nameEn };
}

function bitCodeOf(bit: Part): string {
  const shortAlias = bit.aliases.find((alias) => /^[A-Za-z0-9-]{1,4}$/.test(alias));
  return shortAlias ?? bit.nameEn;
}

export function makeComboSubject(parts: readonly [Part, Part, Part]): ComboBattleSubject {
  const [blade, ratchet, bit] = parts;
  return {
    kind: "combo",
    id: `combo:${parts.map((part) => part.id).join("|")}`,
    parts,
    nameEn: `${blade.nameEn} ${ratchet.nameEn}${bitCodeOf(bit)}`,
    stats: computeComboStats(blade, ratchet, bit),
  };
}

export function subjectNameOf(subject: BattleSubject, locale: Locale): string {
  if (subject.kind === "part") return localizedNameOf(subject.part, locale);

  const [blade, ratchet, bit] = subject.parts;
  return `${localizedNameOf(blade, locale)} ${localizedNameOf(ratchet, locale)}${bitCodeOf(bit)}`;
}

export function subjectStatsOf(subject: BattleSubject): Part["stats"] | ComboStats {
  return subject.kind === "part" ? subject.part.stats : subject.stats;
}

export function imagePartOf(subject: BattleSubject): Part {
  return subject.kind === "part" ? subject.part : subject.parts[0];
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

function searchTermsOf(subject: BattleSubject): string[] {
  if (subject.kind === "part") {
    return [subject.nameEn, subject.part.nameJa, subject.part.nameZhTw, ...subject.part.aliases].filter(
      (value): value is string => Boolean(value),
    );
  }

  return [subject.nameEn, ...subject.parts.flatMap((part) => [part.nameEn, part.nameJa, part.nameZhTw, ...part.aliases])].filter(
    (value): value is string => Boolean(value),
  );
}

export function searchBattleSubjects(subjects: BattleSubject[], query: string): BattleSubject[] {
  const needle = normalize(query);
  if (!needle) return subjects;

  return subjects.filter((subject) => searchTermsOf(subject).some((term) => normalize(term).includes(needle)));
}

export function defaultBattleCombos(parts: Part[]): ComboBattleSubject[] {
  const byId = new Map(parts.map((part) => [part.id, part]));
  const combos: ComboBattleSubject[] = [];
  const first = [byId.get("DRANSWORD"), byId.get("3-60"), byId.get("F")];
  const second = [byId.get("COBALTDRAGOON"), byId.get("5-60"), byId.get("F")];

  for (const candidate of [first, second]) {
    if (candidate.every((part): part is Part => Boolean(part))) {
      combos.push(makeComboSubject(candidate as [Part, Part, Part]));
    }
  }

  return combos;
}
