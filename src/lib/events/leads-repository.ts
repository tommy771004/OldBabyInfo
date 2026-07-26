import leadsJson from "../../../data/event-leads.json";
import { eventLeadsFileSchema, type EventLead } from "./leads.ts";

const leads = eventLeadsFileSchema.parse(leadsJson);

export function getEventLeadsForEvent(eventId: string): EventLead[] {
  return leads.filter((lead) => lead.eventId === eventId);
}
