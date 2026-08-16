import "server-only";
import QRCode from "qrcode";

export async function generateQrSvg(text: string): Promise<string> {
  return QRCode.toString(text, { type: "svg", margin: 1, width: 240 });
}
