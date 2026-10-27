// Reserved space for the Side Licks logo (task F5). Intentionally EMPTY:
// no image, no placeholder, no made-up logo until the owner sends the real one.
export default function LogoSlot() {
  return (
    <div
      aria-hidden="true"
      data-slot="logo"
      className="h-8 w-28 shrink-0 sm:h-9 sm:w-32 lg:h-10 lg:w-36"
    />
  );
}
