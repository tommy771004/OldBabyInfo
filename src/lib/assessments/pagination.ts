export const ASSESSMENT_PAGE_SIZES = [5, 10, 15, 20] as const;

export interface AssessmentPaginationState {
  page: number;
  pageSize: (typeof ASSESSMENT_PAGE_SIZES)[number];
  totalPages: number;
  start: number;
  end: number;
}

export function parseAssessmentPaginationParams(
  searchParams: Record<string, string | string[] | undefined>,
  totalItems: number,
): AssessmentPaginationState {
  const pageSize = parsePageSize(firstValue(searchParams.assessmentSize));
  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalItems) / pageSize));
  const requestedPage = parsePositiveInteger(firstValue(searchParams.assessmentPage));
  const page = Math.min(requestedPage ?? 1, totalPages);

  return {
    page,
    pageSize,
    totalPages,
    start: (page - 1) * pageSize,
    end: Math.min(page * pageSize, Math.max(0, totalItems)),
  };
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInteger(value: string | undefined): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parsePageSize(value: string | undefined): AssessmentPaginationState["pageSize"] {
  const parsed = parsePositiveInteger(value);
  return ASSESSMENT_PAGE_SIZES.includes(parsed as (typeof ASSESSMENT_PAGE_SIZES)[number])
    ? (parsed as AssessmentPaginationState["pageSize"])
    : 10;
}
