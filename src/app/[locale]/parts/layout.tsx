/**
 * `/parts` and everything under it. The `modal` slot is where a record
 * opened from the list renders as a dialog (see `@modal`): the list stays
 * mounted as `children` beneath it, so closing the dialog costs nothing
 * and loses nothing.
 */
export default function PartsLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
