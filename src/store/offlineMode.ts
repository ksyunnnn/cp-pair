// オフラインモード（ホストの端末 1 台で進める状態）の記録。Firestore 版（VITE_ROOM_STORE=firestore）のときだけ使う。
// ルームごとに、この端末の localStorage に置く。入る・解除の処理は index.ts にある。
//
// - cp-pair:offline-mode      オフラインモードに入っているルームと、入ったときの参加者
// - cp-pair:mirror:<roomId>   ホストの端末が最後に Firestore から受け取ったルーム。途中で切れたら、これを引き継いで進める
import type { Room } from "./RoomStore.ts";

const MODE_KEY = "cp-pair:offline-mode";
const MIRROR_PREFIX = "cp-pair:mirror:";

export interface OfflineModeEntry {
  /** 入った日時 */
  since: number;
  /** 入ったときに Firestore にいた参加者の ID。解除のとき、ホストが外した人と、切れている間に加わった人を見分ける */
  knownParticipantIds: string[];
}

function readAll(): Record<string, OfflineModeEntry> {
  try {
    const raw = localStorage.getItem(MODE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, OfflineModeEntry>) : {};
  } catch {
    return {};
  }
}

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

window.addEventListener("storage", (event) => {
  if (event.key === null || event.key === MODE_KEY) emit();
});

export function getOfflineMode(roomId: string): OfflineModeEntry | null {
  return readAll()[roomId] ?? null;
}

export function setOfflineMode(roomId: string, entry: OfflineModeEntry | null) {
  const all = readAll();
  if (entry) all[roomId] = entry;
  else delete all[roomId];
  localStorage.setItem(MODE_KEY, JSON.stringify(all));
  emit();
}

/** オフラインモードの出入りを受け取る。戻り値で解除する */
export function onOfflineModeChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function writeMirror(room: Room) {
  try {
    localStorage.setItem(MIRROR_PREFIX + room.id, JSON.stringify(room));
  } catch {
    /* 保存できなければ、途中で切れたときに引き継げないだけ */
  }
}

export function readMirror(roomId: string): Room | null {
  try {
    const raw = localStorage.getItem(MIRROR_PREFIX + roomId);
    return raw ? (JSON.parse(raw) as Room) : null;
  } catch {
    return null;
  }
}
