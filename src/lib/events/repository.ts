import eventsJson from "../../../data/events.json";
import { eventsFileSchema, type Event } from "./schema.ts";
import { loadStaticData } from "../data/static-data.ts";

/** Validated at module load during the build — an invalid seed file fails
 *  the build immediately here, same pattern as the Part repository
 *  (ADR-0001). A deployed function skips the re-check; see static-data.ts. */
const events: Event[] = loadStaticData(eventsFileSchema, eventsJson);

export function getAllEvents(): Event[] {
  return events;
}
