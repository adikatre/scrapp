import type { ScanTicket } from "@/lib/types";

export const LEGACY_HISTORY_KEY = "scrapp-scan-history";
const DB_NAME = "scrapp-local";
const STORE_NAME = "scan-history";
const MIGRATION_KEY = "scrapp-history-indexeddb-migrated-v1";
const MAX_SCANS = 20;

function normalize(ticket: ScanTicket): ScanTicket {
  return { ...ticket, timestamp: new Date(ticket.timestamp) };
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readAllFromDb() {
  const db = await openDatabase();
  try {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const records = await requestResult(transaction.objectStore(STORE_NAME).getAll());
    return (records as ScanTicket[])
      .map(normalize)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } finally {
    db.close();
  }
}

async function migrateLegacyRecords() {
  if (localStorage.getItem(MIGRATION_KEY) === "complete") return;
  const raw = localStorage.getItem(LEGACY_HISTORY_KEY);
  if (!raw) {
    localStorage.setItem(MIGRATION_KEY, "complete");
    return;
  }

  const parsed = (JSON.parse(raw) as ScanTicket[]).slice(0, MAX_SCANS).map(normalize);
  const db = await openDatabase();
  try {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    for (const ticket of parsed) store.put(ticket);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    localStorage.setItem(MIGRATION_KEY, "complete");
  } finally {
    db.close();
  }
}

export async function listScanTickets() {
  if (typeof indexedDB === "undefined") return [];
  try {
    await migrateLegacyRecords();
    return await readAllFromDb();
  } catch {
    try {
      const raw = localStorage.getItem(LEGACY_HISTORY_KEY);
      return raw ? (JSON.parse(raw) as ScanTicket[]).map(normalize).slice(0, MAX_SCANS) : [];
    } catch {
      return [];
    }
  }
}

export async function saveScanTicket(ticket: ScanTicket) {
  const db = await openDatabase();
  try {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(ticket);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }

  const tickets = await readAllFromDb();
  for (const oldTicket of tickets.slice(MAX_SCANS)) await deleteScanTicket(oldTicket.id);
}

export async function deleteScanTicket(id: string) {
  const db = await openDatabase();
  try {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

export async function clearScanTickets() {
  const db = await openDatabase();
  try {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).clear();
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}
