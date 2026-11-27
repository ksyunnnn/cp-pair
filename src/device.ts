// この端末が「どのルームのホストか」「どのルームのどの参加者か」を覚える。
// 開発パネルは端末の名前（deviceKey）を切り替えて、1 台のブラウザで複数の端末を再現する。
const DEVICE_KEY = "cp-pair-dev:device";
const ME_KEY = "cp-pair:me";
const HOST_KEY = "cp-pair:host";

export function deviceKey(): string {
  try {
    return sessionStorage.getItem(DEVICE_KEY) || "default";
  } catch {
    return "default";
  }
}

export function setDeviceKey(key: string) {
  try {
    sessionStorage.setItem(DEVICE_KEY, key);
  } catch {
    /* 保存できない環境では既定の端末のまま */
  }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getMyParticipantId(roomId: string): string | null {
  const map = readJson<Record<string, Record<string, string>>>(ME_KEY, {});
  return map[deviceKey()]?.[roomId] ?? null;
}

export function setMyParticipantId(roomId: string, participantId: string, key = deviceKey()) {
  const map = readJson<Record<string, Record<string, string>>>(ME_KEY, {});
  map[key] = { ...(map[key] || {}), [roomId]: participantId };
  localStorage.setItem(ME_KEY, JSON.stringify(map));
}

export function isHostOf(roomId: string): boolean {
  return readJson<string[]>(HOST_KEY, []).includes(roomId);
}

export function rememberHostRoom(roomId: string) {
  const list = readJson<string[]>(HOST_KEY, []);
  if (!list.includes(roomId)) list.push(roomId);
  localStorage.setItem(HOST_KEY, JSON.stringify(list));
}

export function lastHostRoom(): string | null {
  const list = readJson<string[]>(HOST_KEY, []);
  return list.length ? list[list.length - 1] : null;
}

/* この端末が関わったルーム。ホストとして作ったものと、参加者として入ったもの。両方にあるルームはホストとして数える */
export type RoomRecord = { roomId: string; role: "host" | "participant"; participantId?: string };

export function roomRecords(): RoomRecord[] {
  const hosted = readJson<string[]>(HOST_KEY, []);
  const joined = readJson<Record<string, Record<string, string>>>(ME_KEY, {})[deviceKey()] || {};
  const records: RoomRecord[] = hosted.map((roomId) => ({ roomId, role: "host" }));
  for (const [roomId, participantId] of Object.entries(joined)) {
    if (!hosted.includes(roomId)) records.push({ roomId, role: "participant", participantId });
  }
  return records;
}

export function inviteUrl(roomId: string): string {
  return `${location.origin}/r/${roomId}`;
}
