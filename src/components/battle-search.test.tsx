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
    aliases: ["劍龍", "DrSw"],
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

  it("finds a Part through a source-backed combo abbreviation", () => {
    render(
      <BattleSearch
        allParts={[dranSword, cobaltDragoon]}
        initialLeft={dranSword}
        initialRight={cobaltDragoon}
        locale="en"
        labels={labels}
      />,
    );

    const leftSearch = screen.getByRole("combobox", { name: "First subject" });
    fireEvent.change(leftSearch, { target: { value: "DrSw" } });

    expect(screen.getByRole("option", { name: /Dran Sword/ })).toBeInTheDocument();
  });

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

    expect(screen.getByRole("heading", { level: 1, name: "Battle subject" })).toBeInTheDocument();
    const leftSearch = screen.getByRole("combobox", { name: "First subject" });
    fireEvent.change(leftSearch, { target: { value: "蒼龍神劍" } });

    expect(screen.getByRole("option", { name: /Dran Sword.*蒼龍神劍/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: /Dran Sword.*蒼龍神劍/ }));

    const rightSearch = screen.getByRole("combobox", { name: "Second subject" });
    fireEvent.change(rightSearch, { target: { value: "龍王" } });
    expect(screen.getByRole("option", { name: /Cobalt Dragoon.*蒼龍騎兵/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: /Cobalt Dragoon.*蒼龍騎兵/ }));

    expect(screen.getByRole("heading", { name: /蒼龍神劍.*versus.*蒼龍騎兵/ })).toBeInTheDocument();
    expect(screen.getByText("Attack")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("exposes the result list state to keyboard and assistive technology", () => {
    render(
      <BattleSearch
        allParts={[dranSword, cobaltDragoon]}
        initialLeft={dranSword}
        initialRight={cobaltDragoon}
        locale="en"
        labels={labels}
      />,
    );

    const leftSearch = screen.getByRole("combobox", { name: "First subject" });
    expect(leftSearch).toHaveAttribute("aria-autocomplete", "list");
    expect(leftSearch).toHaveAttribute("aria-expanded", "false");

    fireEvent.change(leftSearch, { target: { value: "Dran" } });

    expect(leftSearch).toHaveAttribute("aria-expanded", "true");
    const results = screen.getByRole("listbox", { name: "First subject results" });
    expect(leftSearch).toHaveAttribute("aria-controls", results.id);
  });

  it("lets a keyboard user navigate, choose and dismiss a result", () => {
    render(
      <BattleSearch
        allParts={[dranSword, cobaltDragoon]}
        initialLeft={dranSword}
        initialRight={cobaltDragoon}
        locale="en"
        labels={labels}
      />,
    );

    const leftSearch = screen.getByRole("combobox", { name: "First subject" });
    fireEvent.change(leftSearch, { target: { value: "Cobalt" } });
    const results = screen.getByRole("listbox", { name: "First subject results" });
    const firstOption = screen.getByRole("option", { name: /Cobalt Dragoon/ });

    fireEvent.keyDown(leftSearch, { key: "ArrowDown" });
    expect(leftSearch).toHaveAttribute("aria-activedescendant", firstOption.id);
    fireEvent.keyDown(leftSearch, { key: "Enter" });
    expect(screen.getByRole("heading", { level: 2, name: /Cobalt Dragoon.*versus.*Cobalt Dragoon/ })).toBeInTheDocument();
    expect(leftSearch).toHaveValue("");
    expect(leftSearch).not.toHaveAttribute("aria-activedescendant");
    expect(results).not.toBeInTheDocument();

    fireEvent.change(leftSearch, { target: { value: "Dran" } });
    fireEvent.keyDown(leftSearch, { key: "Escape" });
    expect(leftSearch).toHaveValue("");
    expect(screen.queryByRole("listbox", { name: "First subject results" })).not.toBeInTheDocument();
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

    const leftSearch = screen.getByRole("combobox", { name: "First subject" });
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

    const rightSearch = screen.getByRole("combobox", { name: "Second subject" });
    fireEvent.change(rightSearch, { target: { value: "コバルトドラグーン" } });
    expect(screen.getByRole("option", { name: /Cobalt Dragoon/ })).toBeInTheDocument();
  });
});
