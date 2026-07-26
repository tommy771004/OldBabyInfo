import { z } from "zod";
import { MAX_THREAD_BODY_LENGTH, type SubjectType, type Thread } from "./rules.ts";

export const subjectTypes = ["part", "combo", "event"] as const satisfies readonly SubjectType[];

export const threadSchema = z.object({
  id: z.string().min(1),
  subjectType: z.enum(subjectTypes),
  subjectId: z.string().min(1),
  authorId: z.string().min(1),
  body: z.string().trim().min(1).max(MAX_THREAD_BODY_LENGTH),
  createdAt: z.iso.datetime(),
  hiddenAt: z.iso.datetime().nullable(),
}) satisfies z.ZodType<Thread>;

export const createThreadInputSchema = z.object({
  subjectType: z.enum(subjectTypes),
  subjectId: z.string().min(1),
  authorId: z.string().min(1),
  body: z.string().trim().min(1).max(MAX_THREAD_BODY_LENGTH),
});

export const reportInputSchema = z.object({
  threadId: z.string().min(1),
  reporterId: z.string().min(1),
  reason: z.string().trim().max(500).optional(),
});

export type CreateThreadInput = z.infer<typeof createThreadInputSchema>;
export type ReportInput = z.infer<typeof reportInputSchema>;
