"use client";

import { useState } from "react";

const SITE_URL = "https://live-discovery-tool.netlify.app";

// Email clients don't unfurl Open Graph tags into a rich card the way
// WhatsApp/Slack/etc. do - a pasted link is just a plain hyperlink. This
// copies a small ready-made HTML block (branded image + fallback text
// link, both wrapping the real URL) to the clipboard as actual rich HTML,
// so pasting into Gmail/Outlook's compose window inserts a real image and
// link rather than raw markup - both preserve pasted text/html clipboard
// content in their rich-text compose editors.
export function CopyEmailButton({
  url,
  kind,
  alt,
}: {
  url: string;
  kind: "join" | "present" | "questionnaire";
  alt: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const imageUrl = `${SITE_URL}/email-image/${kind}`;
    const html = `
      <a href="${url}" style="text-decoration:none;">
        <img src="${imageUrl}" alt="${alt}" width="600" style="display:block;border:0;border-radius:12px;max-width:100%;height:auto;" />
      </a>
      <p style="font-family:sans-serif;font-size:13px;color:#666;margin-top:8px;">
        If the image doesn't load: <a href="${url}">${url}</a>
      </p>
    `.trim();
    const text = `${alt}\n${url}`;

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (very old browser, or non-HTTPS) -
      // nothing sensible to fall back to for rich HTML specifically.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 text-sm font-semibold text-brand hover:underline"
    >
      {copied ? "Copied!" : "Copy for email"}
    </button>
  );
}
