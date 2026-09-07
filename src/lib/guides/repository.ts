import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import type { Locale } from "@/i18n/routing.ts";
import { extractHeadings } from "./headings.ts";

const CONTENT_DIR = join(process.cwd(), "content", "guides");

const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  /**
   * Reading position for a newcomer, smallest first. Optional on purpose:
   * ticket 37's promise is that dropping a file in publishes it with no code
   * change, so a file that omits this still appears — it just sorts after the
   * curated path instead of wedging itself into the middle of it.
   */
  order: z.number().int().positive().optional(),
});

export interface GuideSummary {
  slug: string;
  title: string;
  description: string;
  order?: number;
  /**
   * The article's own `##` headings. The index lists them so a reader can see
   * what is actually inside an article before opening it — real structure
   * pulled from the file, never a per-article label invented to fill a card.
   */
  sections: string[];
}

export interface Guide extends Omit<GuideSummary, "sections"> {
  /** Raw markdown body (frontmatter stripped) — used both for MDX
   *  rendering and for extractHeadings() to build the TOC from the exact
   *  same source. */
  content: string;
}

/**
 * Per-locale content directories (ticket 37: "新增文章不需改動程式" — an
 * author drops a new .mdx file in, no code change needed to publish it).
 * A locale with no guides yet returns an empty list, not an error — the
 * same honest-empty-state pattern as the Meta Standing page (ticket 34),
 * since translating long-form guides is real editorial work ticket 38
 * does locale by locale, not something ticket 37's infrastructure can
 * assume is done for all three languages on day one.
 */
function localeDir(locale: Locale): string {
  return join(CONTENT_DIR, locale);
}

function readSlugs(locale: Locale): string[] {
  try {
    return readdirSync(localeDir(locale))
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => f.replace(/\.mdx$/, ""));
  } catch {
    return [];
  }
}

function readGuide(locale: Locale, slug: string): Guide {
  const raw = readFileSync(join(localeDir(locale), `${slug}.mdx`), "utf-8");
  const { data, content } = matter(raw);
  const frontmatter = frontmatterSchema.parse(data);
  return { slug, content, ...frontmatter };
}

/**
 * Curated order first, then anything unordered by slug. `readdirSync` returns
 * files alphabetically, which for these six would open the beginner path on
 * "basic-rules" and bury "getting-started" third — an order that actively
 * misleads the reader this section is written for.
 */
function byReadingOrder(left: GuideSummary, right: GuideSummary): number {
  if (left.order !== undefined && right.order !== undefined) return left.order - right.order;
  if (left.order !== undefined) return -1;
  if (right.order !== undefined) return 1;
  return left.slug.localeCompare(right.slug);
}

export function getAllGuides(locale: Locale): GuideSummary[] {
  return readSlugs(locale)
    .map((slug) => {
      const guide = readGuide(locale, slug);
      return {
        slug: guide.slug,
        title: guide.title,
        description: guide.description,
        ...(guide.order !== undefined ? { order: guide.order } : {}),
        sections: extractHeadings(guide.content)
          .filter((heading) => heading.level === 2)
          .map((heading) => heading.text),
      };
    })
    .sort(byReadingOrder);
}

export function getGuideBySlug(locale: Locale, slug: string): Guide | undefined {
  if (!readSlugs(locale).includes(slug)) return undefined;
  return readGuide(locale, slug);
}
