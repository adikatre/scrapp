const DEVICE_ID_KEY = "scrapp-device-id";

export function getOrCreateDeviceId() {
  if (typeof window === "undefined") return "server";
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, id);
  // biome-ignore lint/suspicious/noDocumentCookie: server actions need the same random first-party id.
  document.cookie = `scrapp_device_id=${id}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
  return id;
}
