import { useEffect, useState } from "react";
import { LocalRoomStore } from "./localRoomStore.ts";
import type { Room, RoomStore } from "./RoomStore.ts";

export type { Room, RoomStore } from "./RoomStore.ts";

// Firebase に差し替えるときは、この 1 行を差し替えた実装にする。
export const localStore = new LocalRoomStore();
export const roomStore: RoomStore = localStore;

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
