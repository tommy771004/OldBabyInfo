import eventsJson from "../../../data/events.json";
import { eventsFileSchema, type Event } from "./schema.ts";

/** Validated once at module load — an invalid seed file fails the build
 *  immediately here, same pattern as the Part repository (ADR-0001). */
const events: Event[] = eventsFileSchema.parse(eventsJson);

export function getAllEvents(): Event[] {
  return events;
}
