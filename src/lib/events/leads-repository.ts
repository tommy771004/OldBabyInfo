import leadsJson from "../../../data/event-leads.json";
import { eventLeadsFileSchema, type EventLead } from "./leads.ts";
import { loadStaticData } from "../data/static-data.ts";

const leads = loadStaticData(eventLeadsFileSchema, leadsJson);

export function getEventLeadsForEvent(eventId: string): EventLead[] {
  return leads.filter((lead) => lead.eventId === eventId);
}
