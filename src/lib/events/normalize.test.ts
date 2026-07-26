import { describe, expect, it } from "vitest";
import { normalizeAgeCategory, normalizeCity } from "./normalize.ts";

describe("normalizeCity", () => {
  it("reads the 縣市 off a normal address", () => {
    expect(normalizeCity("桃園市中壢區芝芭里高鐵南路二段352號4樓")).toBe("桃園市");
    expect(normalizeCity("高雄市鳳山區文德路138號2樓")).toBe("高雄市");
  });

  it("treats 臺 and 台 as the same place", () => {
    expect(normalizeCity("臺北市內湖區南京東路6段346號5樓")).toBe("台北市");
    expect(normalizeCity("台北市南港區忠孝東路七段369號A棟3樓")).toBe("台北市");
    expect(normalizeCity("臺中市西屯區")).toBe(normalizeCity("台中市西屯區"));
  });

  it("folds a county-seat city written without its county into that county", () => {
    // "宜蘭市羅東鎮" is really 宜蘭縣 — 羅東 is in the county, not the city.
    expect(normalizeCity("宜蘭市羅東鎮維揚路33-1號")).toBe("宜蘭縣");
    expect(normalizeCity("屏東市台糖街3號2樓")).toBe("屏東縣");
    expect(normalizeCity("彰化市中山路")).toBe("彰化縣");
  });

  it("keeps 省轄市 separate from the same-named county — merging them would be wrong", () => {
    expect(normalizeCity("新竹市東區")).toBe("新竹市");
    expect(normalizeCity("新竹縣竹北市")).toBe("新竹縣");
    expect(normalizeCity("新竹市東區")).not.toBe(normalizeCity("新竹縣竹北市"));
    expect(normalizeCity("嘉義市垂楊路537號4F")).toBe("嘉義市");
  });

  it("returns null when the address has no 縣市 at all, rather than guessing", () => {
    expect(normalizeCity("中山路一段100號")).toBeNull();
    expect(normalizeCity("")).toBeNull();
  });
});

describe("normalizeAgeCategory", () => {
  it("folds the duplicate wording of the same child bracket together", () => {
    expect(normalizeAgeCategory("兒童 (6歲~12歲)")).toBe("通常 (6~12歲)");
  });

  it("leaves genuinely different brackets alone", () => {
    expect(normalizeAgeCategory("公開 (6歲以上)")).toBe("公開 (6歲以上)");
    expect(normalizeAgeCategory("成人(12歲以上)")).toBe("成人(12歲以上)");
    // These two are NOT the same bracket and must not collapse.
    expect(normalizeAgeCategory("公開 (6歲以上)")).not.toBe(normalizeAgeCategory("成人(12歲以上)"));
  });
});
