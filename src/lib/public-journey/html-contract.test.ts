import { describe, expect, it } from "vitest";
import {
  evaluateMoldBatchGuidanceHtml,
  evaluatePartDetailHtml,
  evaluatePublicNavigationHtml,
  evaluatePublicSemanticsHtml,
} from "./html-contract.ts";

const validHtml = `
  <section aria-labelledby="part-identity-heading"><h1 id="part-identity-heading">Dran Sword</h1></section>
  <section aria-labelledby="official-facts-heading"><h2 id="official-facts-heading">Official</h2></section>
  <section aria-labelledby="part-assessment-heading"><h2 id="part-assessment-heading">Assessment</h2>
    <a href="https://hackmd.io/@liangyutw/beyblade-important-record">Discovery</a>
  </section>
  <section aria-labelledby="part-physical-heading"><h2 id="part-physical-heading">Mold Batch</h2><p>Dran Sword V2: +3g</p><a href="https://go-shoot.github.io/x/db/-update.json">Go-Shoot</a></section>
  <section aria-labelledby="where-to-buy-heading"><h2 id="where-to-buy-heading">Where to buy</h2><a href="/zh-TW/parts/dran-sword/where-to-buy">Full snapshot</a><p>No listings.</p></section>
  <section aria-labelledby="discussion-empty-heading"><h2 id="discussion-empty-heading">Start discussion</h2></section>
`;

describe("server-rendered Part public journey contract", () => {
  it("accepts the five-stage order, source link and empty states", () => {
    expect(evaluatePartDetailHtml(validHtml)).toEqual({ status: "ok", failures: [] });
  });

  it("rejects a page with a missing stage", () => {
    const broken = validHtml.replace('id="part-physical-heading"', 'id="part-physical-missing"');

    expect(evaluatePartDetailHtml(broken)).toEqual({
      status: "invalid",
      failures: [
        "missing Part stage: part-physical-heading",
      ],
    });
  });

  it("rejects a Part page that drops the reviewed Go-Shoot weight observation", () => {
    const broken = validHtml
      .replace("Dran Sword V2: +3g", "")
      .replace(' href="https://go-shoot.github.io/x/db/-update.json"', "");

    expect(evaluatePartDetailHtml(broken)).toEqual({
      status: "invalid",
      failures: [
        "missing Go-Shoot weight observation",
        "missing Go-Shoot Discovery Source link",
      ],
    });
  });
});

describe("public navigation HTML contract", () => {
  it("requires the same primary navigation on every public route", () => {
    const result = evaluatePublicNavigationHtml(`
      <header>
        <nav aria-label="Main navigation">
          <a href="/en/parts">Parts</a>
          <a href="/en/events">Events</a>
          <a href="/en/discussion">Discussion</a>
          <a href="/en/login">Login</a>
        </nav>
      </header>
    `);

    expect(result).toEqual({ status: "ok", failures: [] });
  });
});

describe("public semantic HTML contract", () => {
  it("accepts a labelled public page with usable form controls", () => {
    const result = evaluatePublicSemanticsHtml(`
      <html lang="en"><body>
        <header><nav aria-label="Main navigation"><a href="/en/parts">Parts</a></nav></header>
        <main><h1>Parts</h1>
          <form><label for="query">Search</label><input id="query" name="query" type="search" />
            <button type="submit">Search</button>
          </form>
          <label for="locale">Language</label><select id="locale"><option>English</option></select>
        </main>
      </body></html>
    `);

    expect(result).toEqual({ status: "ok", failures: [] });
  });

  it("rejects unlabeled controls and missing page landmarks", () => {
    expect(evaluatePublicSemanticsHtml(`
      <body><div><input type="search" /><button>Search</button></div></body>
    `)).toEqual({
      status: "invalid",
      failures: [
        "missing main landmark",
        "missing h1 heading",
        "missing document language",
        "missing labelled form control: input",
        "button is missing an explicit type",
      ],
    });
  });
});

describe("Mold Batch source guidance HTML contract", () => {
  it("requires general guidance to retain its discovery link and explicit attribution state", () => {
    const result = evaluateMoldBatchGuidanceHtml(`
      <section aria-labelledby="mold-batch-source-guidance-heading">
        <h2 id="mold-batch-source-guidance-heading">Source guidance</h2>
        <p>This is general guidance, not a Part-specific observation.</p>
        <a href="https://go-shoot.github.io/x/">Go-Shoot X</a>
        <dd>Original source not attached</dd>
      </section>
    `);

    expect(result).toEqual({ status: "ok", failures: [] });
  });
});
