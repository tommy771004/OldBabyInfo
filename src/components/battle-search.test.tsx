import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Part } from "@/lib/parts/schema.ts";
import { makeComboSubject } from "@/lib/parts/battle-subjects.ts";
import { BattleSearch } from "./battle-search.tsx";

function part(overrides: Partial<Part> = {}): Part {
  return {
    id: "DRANSWORD",
    type: "blade",
    nameEn: "Dran Sword",
    nameJa: "ドランソード",
    nameZhTw: "蒼龍神劍",
    generation: "X",
    stats: { attack: 60, defense: 30, stamina: 25 },
    modes: [],
    releaseAt: "2022-05-10",
    statEditions: [],
    moldBatches: [],
    aliases: ["劍龍"],
    ...overrides,
  } as Part;
}

const dranSword = part();
const cobaltDragoon = part({
  id: "COBALTDRAGOON",
  nameEn: "Cobalt Dragoon",
  nameJa: "コバルトドラグーン",
  nameZhTw: "蒼龍騎兵",
  stats: { attack: 45, defense: 55, stamina: 40 },
  aliases: ["龍王"],
});
const ratchet = part({ id: "3-60", type: "ratchet", nameEn: "3-60", stats: { attack: 10, defense: 10, stamina: 10 }, aliases: [] });
const bit = part({ id: "F", type: "bit", nameEn: "Flat", stats: { attack: 20, defense: 10, stamina: 20, xDash: 30, burstResistance: 50 }, aliases: ["F"] });
const dranCombo = makeComboSubject([dranSword, ratchet, bit]);

const labels = {
  searchLabel: "Battle subject",
  searchPlaceholder: "Search by Chinese, Japanese, English or alias",
  leftLabel: "First subject",
  rightLabel: "Second subject",
  empty: "No matching subject",
  analysisLabel: "Battle analysis",
  versus: "versus",
  statAttack: "Attack",
  statDefense: "Defense",
  statStamina: "Stamina",
};

describe("BattleSearch", () => {
  afterEach(cleanup);

  it("lets a player find and select two subjects across languages and aliases", () => {
    render(
      <BattleSearch
        allParts={[dranSword, cobaltDragoon]}
        initialLeft={dranSword}
        initialRight={cobaltDragoon}
        locale="zh-TW"
        labels={labels}
      />,
    );

    const leftSearch = screen.getByRole("searchbox", { name: "First subject" });
    fireEvent.change(leftSearch, { target: { value: "蒼龍神劍" } });

    expect(screen.getByRole("option", { name: /Dran Sword.*蒼龍神劍/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: /Dran Sword.*蒼龍神劍/ }));

    const rightSearch = screen.getByRole("searchbox", { name: "Second subject" });
    fireEvent.change(rightSearch, { target: { value: "龍王" } });
    expect(screen.getByRole("option", { name: /Cobalt Dragoon.*蒼龍騎兵/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: /Cobalt Dragoon.*蒼龍騎兵/ }));

    expect(screen.getByRole("heading", { name: /蒼龍神劍.*versus.*蒼龍騎兵/ })).toBeInTheDocument();
    expect(screen.getByText("Attack")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("lets a player find a complete Combo by its assembled name", () => {
    render(
      <BattleSearch
        allParts={[dranSword, cobaltDragoon, ratchet, bit]}
        combos={[dranCombo]}
        initialLeft={dranCombo}
        initialRight={cobaltDragoon}
        locale="en"
        labels={labels}
      />,
    );

    const leftSearch = screen.getByRole("searchbox", { name: "First subject" });
    fireEvent.change(leftSearch, { target: { value: "Dran Sword 3-60F" } });
    expect(screen.getByRole("option", { name: /Dran Sword 3-60F/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: /Dran Sword 3-60F/ }));

    expect(screen.getByRole("heading", { name: /Dran Sword 3-60F.*versus.*Cobalt Dragoon/ })).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
  });

  it("keeps Japanese names in the same public search journey", () => {
    render(
      <BattleSearch
        allParts={[dranSword, cobaltDragoon]}
        initialLeft={dranSword}
        initialRight={cobaltDragoon}
        locale="en"
        labels={labels}
      />,
    );

    const rightSearch = screen.getByRole("searchbox", { name: "Second subject" });
    fireEvent.change(rightSearch, { target: { value: "コバルトドラグーン" } });
    expect(screen.getByRole("option", { name: /Cobalt Dragoon/ })).toBeInTheDocument();
  });
});
