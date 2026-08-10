export function getRequestId(request: Request) {
  const supplied = request.headers.get("x-request-id")?.trim().slice(0, 128);
  return supplied || crypto.randomUUID();
}

export const requestIdHeaders = (requestId: string) => ({
  "X-Request-Id": requestId,
  "Cache-Control": "no-store"
});
