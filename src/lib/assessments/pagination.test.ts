import { describe, expect, it } from "vitest";
import { parseAssessmentPaginationParams } from "./pagination.ts";

describe("parseAssessmentPaginationParams", () => {
  it("defaults to ten entries on the first page", () => {
    expect(parseAssessmentPaginationParams({}, 21)).toEqual({
      page: 1,
      pageSize: 10,
      totalPages: 3,
      start: 0,
      end: 10,
    });
  });

  it("accepts only the published page-size options", () => {
    expect(parseAssessmentPaginationParams({ assessmentSize: "15", assessmentPage: "2" }, 31)).toEqual({
      page: 2,
      pageSize: 15,
      totalPages: 3,
      start: 15,
      end: 30,
    });
    expect(parseAssessmentPaginationParams({ assessmentSize: "12" }, 31).pageSize).toBe(10);
  });

  it("normalizes negative, fractional and non-numeric values", () => {
    expect(parseAssessmentPaginationParams({ assessmentPage: "-3.4", assessmentSize: "wat" }, 2)).toEqual({
      page: 1,
      pageSize: 10,
      totalPages: 1,
      start: 0,
      end: 2,
    });
  });

  it("clamps a shared URL to the last page and handles empty results", () => {
    expect(parseAssessmentPaginationParams({ assessmentPage: "99", assessmentSize: "5" }, 11)).toMatchObject({
      page: 3,
      pageSize: 5,
      totalPages: 3,
      start: 10,
      end: 11,
    });
    expect(parseAssessmentPaginationParams({ assessmentPage: "99" }, 0)).toEqual({
      page: 1,
      pageSize: 10,
      totalPages: 1,
      start: 0,
      end: 0,
    });
  });
});
