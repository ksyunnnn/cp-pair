import { useEffect, useState } from "react";
import { LocalRoomStore } from "./localRoomStore.ts";
import type { MatchResult, Participant } from "../game/types.ts";
import type { NewParticipant, Room, RoomStore, SelectOutcome } from "./RoomStore.ts";

export type { Room, RoomStore } from "./RoomStore.ts";

// 既定は localStorage 版。VITE_ROOM_STORE=firestore のときだけ Firestore 版を使う（.env.local.example）。
export const localStore = new LocalRoomStore();

// Firestore 版は最初に使うときに読み込む。既定の版のビルドには Firebase の SDK を入れない
class LazyFirestoreRoomStore implements RoomStore {
  private store: Promise<RoomStore> | null = null;

  private load(): Promise<RoomStore> {
    this.store ??= Promise.all([import("./firebase.ts"), import("./firestoreRoomStore.ts")]).then(
      ([firebase, impl]) => new impl.FirestoreRoomStore(firebase.db, firebase.ensureSignedIn),
    );
    return this.store;
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

export const roomStore: RoomStore =
  import.meta.env.VITE_ROOM_STORE === "firestore" ? new LazyFirestoreRoomStore() : localStore;

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
