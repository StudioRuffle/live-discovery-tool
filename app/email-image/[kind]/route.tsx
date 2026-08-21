import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Branded card image for the "copy for email" feature (see
// copy-email-button.tsx) - email clients don't unfurl Open Graph tags the
// way chat apps do, so instead of relying on that, the facilitator copies
// a small ready-made HTML snippet (an <a> wrapping this <img>) straight
// into their email compose window. Needs to be a plain, universally
// reachable image URL - no CSS relied on by the email client itself,
// since especially Outlook desktop strips almost all of that.
//
// Uses the same background-texture.jpg as the in-app Welcome hero
// (join-hero.tsx) rather than trying to recreate its grain/glow with a
// CSS gradient - satori (next/og's renderer) can't reproduce a film-grain
// texture, and a flat gradient looked noticeably flatter/different from
// the brand reference in practice.
export const size = { width: 1366, height: 628 };
export const contentType = "image/png";

const BRAND = "#ff2252";

const SUBTITLES: Record<string, string> = {
  join: "Discovery Session - Join",
  present: "Discovery Session - Welcome",
  questionnaire: "Discovery Session - Questionnaire",
};

export function generateStaticParams() {
  return Object.keys(SUBTITLES).map((kind) => ({ kind }));
}

// Doesn't depend on the request, so read once at module scope rather than
// per-request - see Next's "Using Node.js runtime with local assets" docs.
const backgroundData = await readFile(
  join(process.cwd(), "public/brand/background-texture.jpg"),
  "base64"
);
const backgroundSrc = `data:image/jpeg;base64,${backgroundData}`;

async function loadGoogleFont(font: string, weight: number, text: string) {
  const css = await (
    await fetch(
      `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&text=${encodeURIComponent(text)}`
    )
  ).text();
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);
  if (!match) throw new Error("failed to resolve Google Font resource");
  const res = await fetch(match[1]);
  return res.arrayBuffer();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ kind: string }> }
) {
  const { kind } = await params;
  const subtitle = SUBTITLES[kind] ?? SUBTITLES.questionnaire;
  const cta = "Click me";

  const interLight = await loadGoogleFont("Inter", 300, `${subtitle}${cta}`);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={backgroundSrc}
          width={size.width}
          height={size.height}
          style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
          }}
        >
          <svg width={560} height={175} viewBox="0 0 777 243" fill={BRAND}>
            <path d="M197.974 78.2859H256.437V148.897C256.437 183.691 260.751 199.584 270.287 199.584C279.823 199.584 284.137 183.691 284.137 148.897V78.2859H342.601V224.257H290.286L284.137 199.584C281.053 216.026 266.295 226.981 247.204 226.981C208.739 226.981 197.974 209.991 197.974 148.878V78.267V78.2859Z" />
            <path d="M351.437 78.2859H369.903C369.903 36.0934 389.599 16 444.052 16H456.048V40.6722C434.516 40.6722 428.348 52.819 428.348 78.3048H452.472V116.675H428.348V224.294H369.884V116.675H351.418V78.3048L351.437 78.2859Z" />
            <path d="M449.898 78.2859H468.365C468.365 36.0934 488.061 16 542.514 16H554.509V40.6722C532.978 40.6722 526.81 52.819 526.81 78.3048H545.276V116.675H526.81V224.294H468.346V116.675H449.879V78.3048L449.898 78.2859Z" />
            <path d="M554.509 16H612.973V224.275H554.509V16Z" />
            <path d="M764.658 171.923C757.581 207.815 733.269 227 694.501 227C648.032 227 622.187 199.055 622.187 148.897C622.187 104.188 648.032 75.5424 694.501 75.5424C740.969 75.5424 766.814 98.7577 766.814 148.897C766.814 152.189 766.814 155.481 766.512 158.489H680.67C681.294 186.718 685.892 199.603 694.52 199.603C701.596 199.603 705.91 190.843 707.442 171.923H764.676H764.658ZM707.745 133.098C706.213 112.551 701.899 102.958 694.52 102.958C687.141 102.958 682.827 112.551 681.294 133.098H707.764H707.745Z" />
            <path d="M40.0264 164.336V224.276H100.023V156.711C89.0491 164.147 65.5689 169.293 40.0264 164.336Z" />
            <path d="M136.955 121.273C172.034 115.01 189.27 98.2279 189.27 70.6231C189.27 33.9176 158.808 16 96.9578 16H40.0264V74.8045C20.0654 76.4695 4.82944 93.0627 13.4761 104.301C13.4761 104.301 42.259 90.3003 31.8906 113.137C29.4499 118.511 29.885 127.933 33.8962 135.993C35.826 139.872 38.9857 143.807 43.4699 147.099V147.137C59.6657 158.13 79.2105 156.976 100.061 147.743C127.76 147.743 132.377 209.764 132.377 224.275H193.925C193.925 165.944 172.393 121.273 136.993 121.273H136.955ZM100.458 103.904C95.0279 103.488 70.3863 87.5112 66.8863 78C66.8863 78 88.2166 91.5112 100.023 91.5112V50.1324C119.719 50.1324 129.255 58.6654 129.255 76.602C129.255 94.5385 119.492 105.342 100.458 103.904Z" />
          </svg>

          <div
            style={{
              fontSize: 44,
              fontWeight: 300,
              fontFamily: "Inter",
              color: "#ffffff",
            }}
          >
            {subtitle}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 16,
              padding: "16px 32px",
              border: "2px solid #ffffff",
              borderRadius: 16,
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 300,
                fontFamily: "Inter",
                color: "#ffffff",
              }}
            >
              {cta}
            </div>
            <svg width={72} height={10} viewBox="0 0 110 15" fill="#ffffff">
              <path d="M109.581 8.07137C109.971 7.68085 109.971 7.04768 109.581 6.65716L103.217 0.293199C102.826 -0.0973254 102.193 -0.0973255 101.802 0.293199C101.412 0.683723 101.412 1.31689 101.802 1.70741L107.459 7.36427L101.802 13.0211C101.412 13.4116 101.412 14.0448 101.802 14.4353C102.193 14.8259 102.826 14.8259 103.217 14.4353L109.581 8.07137ZM0 7.36426L-8.74228e-08 8.36426L108.874 8.36427L108.874 7.36427L108.874 6.36427L8.74228e-08 6.36426L0 7.36426Z" />
            </svg>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Inter", data: interLight, weight: 300, style: "normal" }],
    }
  );
}
