// Brand mark shown in the top-left corner of every page (wired up once in
// the root layout, not per-page) - plain text in the Raghero display font
// rather than an image, since it needs to render crisply and stay legible
// against both the light (cream) and dark (ink) page backgrounds we use.
export function Logo() {
  return (
    <div className="pointer-events-none fixed left-4 top-4 z-50 select-none font-display text-2xl text-brand md:left-6 md:top-6 md:text-3xl">
      Ruffle
    </div>
  );
}
