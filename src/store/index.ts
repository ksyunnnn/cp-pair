import { useEffect, useState, useSyncExternalStore } from "react";
import { isHostOf, rememberHostRoom } from "../device.ts";
import { LocalRoomStore } from "./localRoomStore.ts";
import type { FirestoreRoomStore } from "./firestoreRoomStore.ts";
import { getOfflineMode, onOfflineModeChange, readMirror, setOfflineMode, writeMirror } from "./offlineMode.ts";
import { randomRoomId } from "./roomId.ts";
import type { MatchResult, Participant } from "../game/types.ts";
import type { NewParticipant, Room, RoomStore, SelectOutcome } from "./RoomStore.ts";

export type { Room, RoomStore } from "./RoomStore.ts";

// 既定は localStorage 版だけを使う。VITE_ROOM_STORE=firestore のときは Firestore 版を通常モードに、
// localStorage 版をオフラインモード（ホストの端末 1 台で進める状態）に使う（.env.local.example）。
export const networkEnabled = import.meta.env.VITE_ROOM_STORE === "firestore";

export const localStore = new LocalRoomStore();

// ルームを作るとき・オフラインモードを解除するときに、Firestore の応答をこれ以上は待たない
const CREATE_TIMEOUT_MS = 8_000;
const IMPORT_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(`${ms}ms 待っても応答がありませんでした`)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

// Firestore 版は最初に使うときに読み込む。既定の版のビルドには Firebase の SDK を入れない
class LazyFirestoreRoomStore implements RoomStore {
  private store: Promise<FirestoreRoomStore> | null = null;

  private load(): Promise<FirestoreRoomStore> {
    this.store ??= Promise.all([import("./firebase.ts"), import("./firestoreRoomStore.ts")]).then(
      ([firebase, impl]) => new impl.FirestoreRoomStore(firebase.db, firebase.ensureSignedIn),
    );
    return this.store;
  }

  /** この端末の匿名認証の uid */
  async uid(): Promise<string> {
    const firebase = await import("./firebase.ts");
    return firebase.ensureSignedIn();
  }

  async importRoom(source: Room, knownParticipantIds: string[]): Promise<string> {
    return (await this.load()).importRoom(source, knownParticipantIds);
  }

  async createRoom(presetId: string): Promise<Room> {
    return (await this.load()).createRoom(presetId);
  }
  async getRoom(roomId: string): Promise<Room | null> {
    return (await this.load()).getRoom(roomId);
  }
  subscribe(roomId: string, listener: (room: Room | null) => void): () => void {
    let active = true;
    let stop: (() => void) | null = null;
    this.load().then((store) => {
      if (active) stop = store.subscribe(roomId, listener);
    });
    return () => {
      active = false;
      stop?.();
    };
  }
  async addParticipant(roomId: string, input: NewParticipant): Promise<Participant> {
    return (await this.load()).addParticipant(roomId, input);
  }
  async removeParticipant(roomId: string, participantId: string): Promise<void> {
    return (await this.load()).removeParticipant(roomId, participantId);
  }
  async selectCompany(roomId: string, participantId: string, companyId: number): Promise<SelectOutcome> {
    return (await this.load()).selectCompany(roomId, participantId, companyId);
  }
  async clearSelection(roomId: string, participantId: string): Promise<void> {
    return (await this.load()).clearSelection(roomId, participantId);
  }
  async declare(roomId: string, result: MatchResult): Promise<void> {
    return (await this.load()).declare(roomId, result);
  }
  async undoDeclare(roomId: string): Promise<void> {
    return (await this.load()).undoDeclare(roomId);
  }
}

// ルームごとに、オフラインモードなら localStorage 版、そうでなければ Firestore 版へ渡す
class ModeRoomStore implements RoomStore {
  private remote: LazyFirestoreRoomStore;

  constructor(remote: LazyFirestoreRoomStore) {
    this.remote = remote;
  }

  private pick(roomId: string): RoomStore {
    return getOfflineMode(roomId) ? localStore : this.remote;
  }

  createRoom(presetId: string): Promise<Room> {
    return this.remote.createRoom(presetId);
  }
  getRoom(roomId: string): Promise<Room | null> {
    return this.pick(roomId).getRoom(roomId);
  }
  /** オフラインモードに出入りしたら、購読する先を付け替える */
  subscribe(roomId: string, listener: (room: Room | null) => void): () => void {
    let offline: boolean | null = null;
    let stop: () => void = () => {};
    const attach = () => {
      const next = Boolean(getOfflineMode(roomId));
      if (next === offline) return;
      offline = next;
      stop();
      stop = next
        ? localStore.subscribe(roomId, listener)
        : this.remote.subscribe(roomId, (room) => {
            // ホストの端末は、受け取ったルームを手元に写しておく。途中で切れたら、これを引き継いで進める
            if (room) {
              this.remote.uid().then(
                (uid) => {
                  if (room.hostUid === uid && !getOfflineMode(roomId)) writeMirror(room);
                },
                () => undefined,
              );
            }
            listener(room);
          });
    };
    attach();
    const off = onOfflineModeChange(attach);
    return () => {
      off();
      stop();
    };
  }
  addParticipant(roomId: string, input: NewParticipant): Promise<Participant> {
    return this.pick(roomId).addParticipant(roomId, input);
  }
  removeParticipant(roomId: string, participantId: string): Promise<void> {
    return this.pick(roomId).removeParticipant(roomId, participantId);
  }
  selectCompany(roomId: string, participantId: string, companyId: number): Promise<SelectOutcome> {
    return this.pick(roomId).selectCompany(roomId, participantId, companyId);
  }
  clearSelection(roomId: string, participantId: string): Promise<void> {
    return this.pick(roomId).clearSelection(roomId, participantId);
  }
  declare(roomId: string, result: MatchResult): Promise<void> {
    return this.pick(roomId).declare(roomId, result);
  }
  undoDeclare(roomId: string): Promise<void> {
    return this.pick(roomId).undoDeclare(roomId);
  }
}

const remoteStore = networkEnabled ? new LazyFirestoreRoomStore() : null;

export const roomStore: RoomStore = remoteStore ? new ModeRoomStore(remoteStore) : localStore;

/**
 * ホストがルームを作る。Firestore 版で、ネットが無いか、Firestore に作れなかったときは、
 * オフラインモードのルームをこの端末に作る（offline: true）。
 */
export async function createHostRoom(presetId: string): Promise<{ room: Room; offline: boolean }> {
  if (!remoteStore) return { room: await localStore.createRoom(presetId), offline: false };
  if (navigator.onLine) {
    try {
      return { room: await withTimeout(remoteStore.createRoom(presetId), CREATE_TIMEOUT_MS), offline: false };
    } catch (error) {
      console.warn("Firestore にルームを作れなかったため、オフラインモードで作ります", error);
    }
  }
  let id = randomRoomId();
  while (await localStore.getRoom(id)) id = randomRoomId();
  const now = Date.now();
  const room: Room = { id, presetId, status: "open", participants: [], result: null, createdAt: now, updatedAt: now };
  setOfflineMode(id, { since: now, knownParticipantIds: [] });
  localStore.putRoom(room);
  return { room, offline: true };
}

/**
 * ルームの途中で切れたときに、オフラインモードへ入る。この端末がホストとして最後に受け取ったルームを引き継ぐ。
 * 入ったら true。既に入っている・Firestore 版でない・引き継ぐルームがない（この端末がホストでない）ときは false。
 */
export function enterOfflineMode(roomId: string): boolean {
  if (!remoteStore || getOfflineMode(roomId)) return false;
  const mirror = readMirror(roomId);
  if (!mirror) return false;
  localStore.putRoom(mirror);
  // オフラインモードの間のホストの判定は device.ts の記録で行う
  rememberHostRoom(roomId);
  setOfflineMode(roomId, { since: Date.now(), knownParticipantIds: mirror.participants.map((p) => p.id) });
  return true;
}

/**
 * オフラインモードを解除し、この端末のルームを Firestore へ引き継ぐ。戻り値は引き継いだ先のルームの ID
 * （同じ ID のルームを別の人が持っていたときだけ変わる）。失敗したらオフラインモードのまま投げる。
 */
export async function leaveOfflineMode(roomId: string): Promise<string> {
  const entry = getOfflineMode(roomId);
  const room = await localStore.getRoom(roomId);
  if (!remoteStore || !entry || !room) throw new Error(`room ${roomId} is not in offline mode`);
  const nextId = await withTimeout(remoteStore.importRoom(room, entry.knownParticipantIds), IMPORT_TIMEOUT_MS);
  rememberHostRoom(nextId);
  setOfflineMode(roomId, null);
  localStore.deleteRoom(roomId);
  return nextId;
}

/** このルームがオフラインモードに入っているか */
export function useOfflineMode(roomId: string | null): boolean {
  return useSyncExternalStore(onOfflineModeChange, () => (roomId ? Boolean(getOfflineMode(roomId)) : false));
}

/**
 * この端末がルームのホストか。判定できるまでは null。
 * Firestore 版の通常モードでは、ルームの hostUid と匿名認証の uid で判定する。
 * オフラインモードと localStorage 版では、device.ts の記録で判定する。
 */
export function useIsHost(room: Room): boolean | null {
  const offline = useOfflineMode(room.id);
  const byUid = remoteStore !== null && !offline;
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    if (!byUid || !remoteStore) return;
    let active = true;
    remoteStore.uid().then(
      (value) => active && setUid(value),
      () => active && setUid(""),
    );
    return () => {
      active = false;
    };
  }, [byUid]);
  if (!byUid) return isHostOf(room.id);
  if (uid === null) return null;
  return uid !== "" && room.hostUid === uid;
}

export function useRoom(roomId: string | null): { room: Room | null; loading: boolean } {
  const [state, setState] = useState<{ room: Room | null; loading: boolean; id: string | null }>({
    room: null,
    loading: true,
    id: roomId,
  });
  useEffect(() => {
    if (!roomId) return;
    return roomStore.subscribe(roomId, (room) => setState({ room, loading: false, id: roomId }));
  }, [roomId]);
  if (!roomId) return { room: null, loading: false };
  if (state.id !== roomId) return { room: null, loading: true };
  return { room: state.room, loading: state.loading };
}
