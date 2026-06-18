export function getPublicAppOrigin(requestUrl: string) {
  return (
    process.env.APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    new URL(requestUrl).origin
  ).replace(/\/+$/g, "");
}
