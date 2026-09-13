import { parsePaginationParams, type PaginationState } from "@/lib/pagination.ts";

export const ASSESSMENT_PAGE_SIZES = [5, 10, 15, 20] as const;

export type AssessmentPaginationState = PaginationState<(typeof ASSESSMENT_PAGE_SIZES)[number]>;

export function parseAssessmentPaginationParams(
  searchParams: Record<string, string | string[] | undefined>,
  totalItems: number,
): AssessmentPaginationState {
  return parsePaginationParams(searchParams, totalItems, {
    pageParam: "assessmentPage",
    sizeParam: "assessmentSize",
    sizes: ASSESSMENT_PAGE_SIZES,
    defaultSize: 10,
  });
}
