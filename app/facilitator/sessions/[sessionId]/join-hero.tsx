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
            className="absolute right-4 top-6 h-[84px] w-[84px] overflow-hidden rounded-md bg-white p-1.5 shadow-md sm:right-5 sm:top-7 sm:h-24 sm:w-24"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="absolute inset-x-5 bottom-16 text-center text-sm font-semibold text-ink sm:bottom-[4.75rem]">
            Scan me if using a mobile
          </p>
          <ArrowIcon className="absolute bottom-7 left-1/2 w-16 -translate-x-1/2 text-ink sm:bottom-8" />
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
            className="pointer-events-none absolute -top-7 left-1 w-24 select-none sm:-top-8 sm:w-28"
          />
          <p className="absolute inset-x-5 bottom-16 text-center text-sm font-semibold text-ink sm:bottom-[4.75rem]">
            Click me if using a laptop
          </p>
          <ArrowIcon className="absolute bottom-7 left-1/2 w-16 -translate-x-1/2 text-ink sm:bottom-8" />
        </a>
      </div>

      <a
        href={joinUrl}
        className="relative mt-8 block break-all text-center text-sm text-white/70 underline"
      >
        {joinUrl}
      </a>
    </section>
  );
}
