import { z } from "zod";

export const eventLeadSchema = z.object({
  eventId: z.string().min(1),
  sourceUrl: z.url(),
  sourceExcerpt: z.string().min(1),
});

export type EventLead = z.infer<typeof eventLeadSchema>;

export const eventLeadsFileSchema = z.array(eventLeadSchema).check((ctx) => {
  const seen = new Set<string>();
  for (const lead of ctx.value) {
    if (seen.has(lead.eventId)) {
      ctx.issues.push({ code: "custom", message: `Duplicate Event lead: ${lead.eventId}`, input: ctx.value });
      return;
    }
    seen.add(lead.eventId);
  }
});

export function mergeEventLeads(previous: EventLead[], incoming: EventLead[]): EventLead[] {
  const byEventId = new Map(previous.map((lead) => [lead.eventId, lead]));
  for (const lead of incoming) byEventId.set(lead.eventId, lead);
  return [...byEventId.values()].sort((a, b) => a.eventId.localeCompare(b.eventId));
}
