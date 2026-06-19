export const SITE_NAME = "Nudgeable AI Practice Lab";
export const SITE_DESCRIPTION =
  "Practical AI workflows for everyday work — apply, learn, and stay current.";

export function getMetadataBase(): URL {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL);
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return new URL("http://localhost:3000");
}
