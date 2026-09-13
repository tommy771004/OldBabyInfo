/**
 * A soft navigation from an open dialog to a route this slot does not
 * intercept — `/parts/x/where-to-buy`, `/parts/compare` — would otherwise
 * leave the previous dialog on screen: an unmatched slot keeps its last
 * state on client navigation. A catch-all outranks `default.tsx` and
 * matches those paths with nothing, which closes it.
 */
export default function ModalCatchAll() {
  return null;
}
