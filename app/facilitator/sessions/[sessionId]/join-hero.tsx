import { PanelShape, ArrowIcon } from "@/components/panel-shape";

// "Welcome" hero for the attendee join link, built from the brand assets
// in public/brand/ - a textured dark panel with two die-cut cards: one to
// scan (QR, for phones) and one to click straight through (for laptops in
// the room). The dark grain background is a shorter layer behind the
// content rather than a container around it, so the cards and the
// shocked-face photo can overhang/bleed past its edges onto the page.
export function JoinHero({ joinUrl, qrSvg }: { joinUrl: string; qrSvg: string }) {
  return (
    <div className="relative min-w-0 pb-4 sm:pb-6">
      <div
        className="bg-grain absolute inset-x-0 top-0 h-52 overflow-hidden rounded-3xl bg-ink bg-cover bg-center sm:h-96"
        style={{ backgroundImage: "url(/brand/background-texture.jpg)" }}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/shocked-face.png"
        alt=""
        className="pointer-events-none absolute -right-2 -top-4 w-14 select-none sm:-right-6 sm:-top-10 sm:w-28"
      />

      <div className="relative px-4 pt-10 sm:px-10 sm:pt-16">
        {/* Fluid size (not a discrete Tailwind step) so this never overflows
            a narrow phone width - it's one unbreakable word at a font that's
            already wide/bold by design, and this page can be opened on
            anything from a phone to a projector. */}
        <h2 className="relative whitespace-nowrap text-center font-display text-brand text-[clamp(2rem,10vw,9rem)]">
          Welcome
        </h2>

        <div className="relative mt-0 flex flex-wrap items-start justify-center gap-6 sm:-mt-16 sm:gap-12">
          <div className="relative aspect-[330/392] w-48 sm:w-64">
            <PanelShape className="absolute inset-0 h-full w-full drop-shadow-xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/mobile.png"
              alt=""
              className="pointer-events-none absolute -top-6 left-1 w-20 select-none sm:-top-7 sm:w-24"
            />
            <div
              className="absolute left-1/2 top-1 h-24 w-24 -translate-x-1/2 overflow-hidden rounded-lg bg-white p-2 shadow-md [&>svg]:h-full [&>svg]:w-full sm:top-1 sm:h-32 sm:w-32"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="absolute inset-x-4 bottom-16 text-center text-xl font-light leading-tight text-ink sm:bottom-24 sm:text-3xl">
              Scan me if
              <br />
              using a mobile
            </p>
            <ArrowIcon className="absolute bottom-6 left-1/2 w-16 -translate-x-1/2 text-ink sm:bottom-8 sm:w-20" />
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
              className="pointer-events-none absolute left-1/2 -top-10 w-32 -translate-x-1/2 select-none sm:-top-12 sm:w-40"
            />
            <p className="absolute inset-x-4 bottom-16 text-center text-xl font-light leading-tight text-ink sm:bottom-24 sm:text-3xl">
              Click me if
              <br />
              using a laptop
            </p>
            <ArrowIcon className="absolute bottom-6 left-1/2 w-16 -translate-x-1/2 text-ink sm:bottom-8 sm:w-20" />
          </a>
        </div>
      </div>
    </div>
  );
}
