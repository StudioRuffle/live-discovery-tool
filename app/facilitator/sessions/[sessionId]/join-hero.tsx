import { PanelShape, ArrowIcon } from "@/components/panel-shape";

// "Welcome" hero for the attendee join link, built from the brand assets
// in public/brand/ - a textured dark panel with two die-cut cards: one to
// scan (QR, for phones) and one to click straight through (for laptops in
// the room). Meant to be legible/inviting on its own if this is what's
// projected while people are arriving, not just a utility QR code block.
export function JoinHero({ joinUrl, qrSvg }: { joinUrl: string; qrSvg: string }) {
  return (
    <section
      className="bg-grain relative min-w-0 overflow-hidden rounded-3xl bg-ink bg-cover bg-center px-4 py-12 sm:px-10 sm:py-20"
      style={{ backgroundImage: "url(/brand/background-texture.jpg)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/shocked-face.png"
        alt=""
        className="pointer-events-none absolute right-3 top-1 w-14 select-none sm:right-10 sm:top-4 sm:w-28"
      />

      {/* Fluid size (not a discrete Tailwind step) so this never overflows
          a narrow phone width - it's one unbreakable word at a font that's
          already wide/bold by design, and this page can be opened on
          anything from a phone to a projector. */}
      <h2 className="relative whitespace-nowrap text-center font-display text-brand text-[clamp(1.25rem,5.5vw,4.5rem)]">
        Welcome
      </h2>

      <div className="relative mt-8 flex flex-wrap items-start justify-center gap-6 sm:mt-14 sm:gap-12">
        <div className="relative aspect-[330/392] w-48 sm:w-64">
          <PanelShape className="absolute inset-0 h-full w-full drop-shadow-xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/mobile.png"
            alt=""
            className="pointer-events-none absolute -top-7 left-1 w-20 select-none sm:-top-8 sm:w-24"
          />
          <div
            className="absolute left-1/2 top-10 h-24 w-24 -translate-x-1/2 overflow-hidden rounded-lg bg-white p-2 shadow-md sm:top-14 sm:h-32 sm:w-32"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="absolute inset-x-4 bottom-8 text-center text-base font-bold leading-tight text-ink sm:bottom-12 sm:text-xl">
            Scan me if using a mobile
          </p>
          <ArrowIcon className="absolute bottom-4 left-1/2 w-16 -translate-x-1/2 text-ink sm:bottom-6 sm:w-20" />
        </div>

        <a
          href={joinUrl}
          className="relative aspect-[330/392] w-48 transition-transform hover:-translate-y-1 sm:w-64"
        >
          <PanelShape className="absolute inset-0 h-full w-full drop-shadow-xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/laptop.png"
            alt=""
            className="pointer-events-none absolute -top-10 -left-1 w-32 select-none sm:-top-12 sm:w-40"
          />
          <p className="absolute inset-x-4 bottom-8 text-center text-base font-bold leading-tight text-ink sm:bottom-12 sm:text-xl">
            Click me if using a laptop
          </p>
          <ArrowIcon className="absolute bottom-4 left-1/2 w-16 -translate-x-1/2 text-ink sm:bottom-6 sm:w-20" />
        </a>
      </div>
    </section>
  );
}
