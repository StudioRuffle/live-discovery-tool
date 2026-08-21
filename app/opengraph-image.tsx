import { ImageResponse } from "next/og";

// Default link-preview image for the whole app (WhatsApp, Google Chat,
// Slack, iMessage, etc. all read this via the og:image meta tag Next
// generates from this file). No request-time data, so this is generated
// once at build time and cached - not per-share.
//
// Deliberately doesn't use the Raghero display font: that file is
// gitignored (not cleared for redistribution via the public repo, see
// app/fonts/README.md) so it doesn't exist in the deployed build. Inter
// is fetched from Google Fonts instead, which is safe to embed.
export const alt = "Studio Ruffle — Live Discovery Session Tool";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BRAND = "#ff2252";
const INK = "#3f0315";
const INK_LIGHT = "#6b1930";

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

export default async function Image() {
  const title = "Discovery Session Tool";
  const subtitle = "Live workshop facilitation";

  const [interBold, interMedium] = await Promise.all([
    loadGoogleFont("Inter", 700, title),
    loadGoogleFont("Inter", 500, subtitle),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: `linear-gradient(135deg, ${INK} 0%, ${INK_LIGHT} 100%)`,
        }}
      >
        <svg width={260} height={81} viewBox="0 0 777 243" fill={BRAND}>
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
            fontSize: 56,
            fontWeight: 700,
            fontFamily: "Inter",
            color: "#ffffff",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            fontFamily: "Inter",
            color: BRAND,
          }}
        >
          {subtitle}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: interBold, weight: 700, style: "normal" },
        { name: "Inter", data: interMedium, weight: 500, style: "normal" },
      ],
    }
  );
}
