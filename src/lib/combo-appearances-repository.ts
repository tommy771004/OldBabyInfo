import appearancesJson from "../../data/combo-appearances.json" with { type: "json" };
import { validateComboAppearances, type ComboAppearanceRecord } from "./combo-appearances.ts";
import { getAllParts } from "./parts/repository.ts";

/** Static, reviewed records, validated at build time. Empty means no accepted
 * evidence yet; never substitute Event calendar rows or synthetic statistics. */
const appearances = validateComboAppearances(appearancesJson, getAllParts());

export function getComboAppearances(): ComboAppearanceRecord[] {
  return appearances;
}
