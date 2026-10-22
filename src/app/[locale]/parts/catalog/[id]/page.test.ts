import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { getAllPublishableGenerationCatalogRecords } from "@/lib/generation-catalog/repository.ts";
import { dynamicParams, generateStaticParams } from "./page.tsx";

describe("Catalog record page prerendering (ADR-0015)", () => {
  it("prerenders every publishable record in the default locale only", () => {
    const params = generateStaticParams();
    expect(new Set(params.map((param) => param.locale))).toEqual(new Set([routing.defaultLocale]));
    expect(params).toHaveLength(getAllPublishableGenerationCatalogRecords().length);
  });

  it("renders the other locales on demand instead of 404ing them", () => {
    expect(dynamicParams).toBe(true);
  });
});
