// RoomStore のブラウザ内の実装。localStorage に置き、同じタブの購読者と、別タブ（storage イベント）に変化を伝える。
import type { MatchResult, Participant } from "../game/types.ts";
import type { NewParticipant, Room, RoomStore, SelectOutcome } from "./RoomStore.ts";
import { randomRoomId } from "./roomId.ts";

const ROOM_PREFIX = "cp-pair:room:";

function readRoom(roomId: string): Room | null {
  try {
    const raw = localStorage.getItem(ROOM_PREFIX + roomId);
    return raw ? (JSON.parse(raw) as Room) : null;
  } catch {
    return null;
  }
}

function randomId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

export class LocalRoomStore implements RoomStore {
  private listeners = new Map<string, Set<(room: Room | null) => void>>();

  constructor() {
    window.addEventListener("storage", (event) => {
      if (!event.key || !event.key.startsWith(ROOM_PREFIX)) return;
      this.emit(event.key.slice(ROOM_PREFIX.length));
    });
  }

  private emit(roomId: string) {
    const room = readRoom(roomId);
    this.listeners.get(roomId)?.forEach((listener) => listener(room));
  }

  private write(room: Room) {
    room.updatedAt = Date.now();
    localStorage.setItem(ROOM_PREFIX + room.id, JSON.stringify(room));
    this.emit(room.id);
  }

  private mutate<T>(roomId: string, fn: (room: Room) => T): T {
    const room = readRoom(roomId);
    if (!room) throw new Error(`room ${roomId} not found`);
    const out = fn(room);
    this.write(room);
    return out;
  }

  async createRoom(presetId: string): Promise<Room> {
    let id = randomRoomId();
    while (readRoom(id)) id = randomRoomId();
    const now = Date.now();
    const room: Room = {
      id,
      presetId,
      status: "open",
      participants: [],
      result: null,
      createdAt: now,
      updatedAt: now,
    };
    this.write(room);
    return room;
  }

  async getRoom(roomId: string): Promise<Room | null> {
    return readRoom(roomId);
  }

  subscribe(roomId: string, listener: (room: Room | null) => void): () => void {
    let set = this.listeners.get(roomId);
    if (!set) {
      set = new Set();
      this.listeners.set(roomId, set);
    }
    set.add(listener);
    listener(readRoom(roomId));
    return () => {
      set?.delete(listener);
    };
  }

  async addParticipant(roomId: string, input: NewParticipant): Promise<Participant> {
    return this.mutate(roomId, (room) => {
      const participant: Participant = {
        id: randomId(input.joinType === "manual" ? "manual" : "p"),
        name: input.name,
        gender: input.gender,
        joinType: input.joinType,
        selectedCompanyId: null,
      };
      room.participants.push(participant);
      return participant;
    });
  }

  async removeParticipant(roomId: string, participantId: string): Promise<void> {
    this.mutate(roomId, (room) => {
      room.participants = room.participants.filter((p) => p.id !== participantId);
    });
  }

  async selectCompany(roomId: string, participantId: string, companyId: number): Promise<SelectOutcome> {
    const room = readRoom(roomId);
    if (!room) return "missing";
    if (room.status !== "open") return "closed";
    const me = room.participants.find((p) => p.id === participantId);
    if (!me) return "missing";
    const taken = room.participants.some((p) => p.id !== participantId && p.selectedCompanyId === companyId);
    if (taken) return "taken";
    me.selectedCompanyId = companyId;
    this.write(room);
    return "ok";
  }

  async clearSelection(roomId: string, participantId: string): Promise<void> {
    this.mutate(roomId, (room) => {
      if (room.status !== "open") return;
      const me = room.participants.find((p) => p.id === participantId);
      if (me) me.selectedCompanyId = null;
    });
  }

  async declare(roomId: string, result: MatchResult): Promise<void> {
    this.mutate(roomId, (room) => {
      room.status = "declared";
      room.result = result;
    });
  }

  async undoDeclare(roomId: string): Promise<void> {
    this.mutate(roomId, (room) => {
      room.status = "open";
      room.result = null;
    });
  }

  /** ルームをそのまま置く。オフラインモードで、作ったルームや Firestore から引き継いだルームを置くときに使う */
  putRoom(room: Room) {
    this.write(structuredClone(room));
  }

  /** ルームを消す。オフラインモードを解除して、Firestore へ引き継いだ後に使う */
  deleteRoom(roomId: string) {
    localStorage.removeItem(ROOM_PREFIX + roomId);
    this.emit(roomId);
  }

  /** 開発用: 置いたルームをすべて消す */
  clearAll() {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("cp-pair:")) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
    const ids = [...this.listeners.keys()];
    ids.forEach((id) => this.emit(id));
  }
}
