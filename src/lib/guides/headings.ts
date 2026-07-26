import GithubSlugger from "github-slugger";

export interface Heading {
  level: number;
  text: string;
  slug: string;
}

/**
 * A table of contents needs to know the heading list separately from the
 * rendered body (ticket 37: "具備目錄與段落錨點"). Reusing GithubSlugger
 * directly — the same slugger rehype-slug uses internally to assign each
 * rendered heading's real `id` — is what makes a TOC link
 * (`href="#slug"`) actually land on the right heading instead of two
 * independently-invented slug schemes drifting apart.
 */
export function extractHeadings(markdown: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];

  for (const line of markdown.split("\n")) {
    const match = /^(#{1,6})\s+(.+?)\s*#*$/.exec(line);
    if (!match) continue;
    const level = match[1]!.length;
    const text = match[2]!.trim();
    headings.push({ level, text, slug: slugger.slug(text) });
  }

  return headings;
}
