// RoomStore の Firestore の実装。端末をまたいでルームを共有する（通常モード）。
// 形と守りは firestore.rules にある。書き込みは匿名認証でサインインしてから行う。
//
// - rooms/{roomId}                     presetId・status・result・hostUid・createdAt・updatedAt
// - rooms/{roomId}/participants/{pid}  name・gender・joinType・selectedCompanyId・ownerUid・joinedAt
// - rooms/{roomId}/claims/{companyId}  participantId。1 つの理念を選べるのは 1 人だけ、を文書の一意性で守る
//
// Room.updatedAt はルームの文書の更新日時で、参加者の変化では進まない。
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { MatchResult, Participant } from "../game/types.ts";
import type { NewParticipant, Room, RoomStatus, RoomStore, SelectOutcome } from "./RoomStore.ts";

const ROOM_ID_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ROOM_ID_LENGTH = 5;
const ROOM_ID_ATTEMPTS = 10;

function randomRoomId(): string {
  const values = crypto.getRandomValues(new Uint32Array(ROOM_ID_LENGTH));
  return Array.from(values, (v) => ROOM_ID_CHARS[v % ROOM_ID_CHARS.length]).join("");
}

function millis(value: unknown): number {
  return value instanceof Timestamp ? value.toMillis() : Date.now();
}

function toParticipant(snap: QueryDocumentSnapshot<DocumentData>): Participant {
  const data = snap.data({ serverTimestamps: "estimate" });
  return {
    id: snap.id,
    name: data.name,
    gender: data.gender,
    joinType: data.joinType,
    selectedCompanyId: data.selectedCompanyId ?? null,
  };
}

function toRoom(snap: DocumentSnapshot<DocumentData>, participants: Participant[]): Room | null {
  if (!snap.exists()) return null;
  const data = snap.data({ serverTimestamps: "estimate" });
  return {
    id: snap.id,
    presetId: data.presetId,
    status: data.status as RoomStatus,
    participants,
    result: (data.result as MatchResult | null) ?? null,
    createdAt: millis(data.createdAt),
    updatedAt: millis(data.updatedAt),
  };
}

function isPermissionDenied(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "permission-denied";
}

export class FirestoreRoomStore implements RoomStore {
  private db: Firestore;
  private signIn: () => Promise<string>;

  /** signIn はサインインを済ませて uid を返す。画面からは firebase.ts の ensureSignedIn を渡す */
  constructor(db: Firestore, signIn: () => Promise<string>) {
    this.db = db;
    this.signIn = signIn;
  }

  private roomRef(roomId: string) {
    return doc(this.db, "rooms", roomId);
  }

  private participantRef(roomId: string, participantId: string) {
    return doc(this.db, "rooms", roomId, "participants", participantId);
  }

  private claimRef(roomId: string, companyId: number) {
    return doc(this.db, "rooms", roomId, "claims", String(companyId));
  }

  private participantsQuery(roomId: string) {
    return query(collection(this.db, "rooms", roomId, "participants"), orderBy("joinedAt"));
  }

  async createRoom(presetId: string): Promise<Room> {
    const uid = await this.signIn();
    for (let attempt = 0; attempt < ROOM_ID_ATTEMPTS; attempt++) {
      const id = randomRoomId();
      const ref = this.roomRef(id);
      const created = await runTransaction(this.db, async (tx) => {
        const existing = await tx.get(ref);
        if (existing.exists()) return false;
        tx.set(ref, {
          hostUid: uid,
          presetId,
          status: "open",
          result: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return true;
      });
      if (created) {
        const now = Date.now();
        return { id, presetId, status: "open", participants: [], result: null, createdAt: now, updatedAt: now };
      }
    }
    throw new Error("空いているルームの ID が見つかりませんでした");
  }

  async getRoom(roomId: string): Promise<Room | null> {
    await this.signIn();
    const snap = await getDoc(this.roomRef(roomId));
    if (!snap.exists()) return null;
    const participants = await getDocs(this.participantsQuery(roomId));
    return toRoom(snap, participants.docs.map(toParticipant));
  }

  subscribe(roomId: string, listener: (room: Room | null) => void): () => void {
    let active = true;
    const stops: (() => void)[] = [];
    let roomSnap: DocumentSnapshot<DocumentData> | null = null;
    let participants: Participant[] | null = null;

    const emit = () => {
      if (!active || !roomSnap || !participants) return;
      listener(toRoom(roomSnap, participants));
    };
    const fail = (error: unknown) => {
      console.error(error);
      if (active) listener(null);
    };

    this.signIn().then(
      () => {
        if (!active) return;
        stops.push(
          onSnapshot(
            this.roomRef(roomId),
            (snap) => {
              roomSnap = snap;
              emit();
            },
            fail,
          ),
        );
        stops.push(
          onSnapshot(
            this.participantsQuery(roomId),
            (snap) => {
              participants = snap.docs.map(toParticipant);
              emit();
            },
            fail,
          ),
        );
      },
      fail,
    );

    return () => {
      active = false;
      stops.forEach((stop) => stop());
    };
  }

  async addParticipant(roomId: string, input: NewParticipant): Promise<Participant> {
    const uid = await this.signIn();
    const ref = doc(collection(this.db, "rooms", roomId, "participants"));
    await setDoc(ref, {
      ownerUid: uid,
      name: input.name,
      gender: input.gender,
      joinType: input.joinType,
      selectedCompanyId: null,
      joinedAt: serverTimestamp(),
    });
    return { id: ref.id, name: input.name, gender: input.gender, joinType: input.joinType, selectedCompanyId: null };
  }

  async removeParticipant(roomId: string, participantId: string): Promise<void> {
    await this.signIn();
    const ref = this.participantRef(roomId, participantId);
    await runTransaction(this.db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const selected = snap.data().selectedCompanyId as number | null;
      if (selected !== null) tx.delete(this.claimRef(roomId, selected));
      tx.delete(ref);
    });
  }

  async selectCompany(roomId: string, participantId: string, companyId: number): Promise<SelectOutcome> {
    await this.signIn();
    const roomRef = this.roomRef(roomId);
    const meRef = this.participantRef(roomId, participantId);
    const claimRef = this.claimRef(roomId, companyId);
    const attempt = () =>
      runTransaction(this.db, async (tx): Promise<SelectOutcome> => {
        const room = await tx.get(roomRef);
        if (!room.exists()) return "missing";
        if (room.data().status !== "open") return "closed";
        const me = await tx.get(meRef);
        if (!me.exists()) return "missing";
        const claim = await tx.get(claimRef);
        if (claim.exists() && claim.data().participantId !== participantId) return "taken";
        const previous = me.data().selectedCompanyId as number | null;
        if (previous === companyId && claim.exists()) return "ok";
        if (previous !== null && previous !== companyId) tx.delete(this.claimRef(roomId, previous));
        if (!claim.exists()) tx.set(claimRef, { participantId });
        tx.update(meRef, { selectedCompanyId: companyId });
        return "ok";
      });
    try {
      return await attempt();
    } catch (error) {
      // 読んだ後に宣言された・札を取られたなどで、ルールが拒んだ。読み直して理由を返す
      if (!isPermissionDenied(error)) throw error;
      const room = await getDoc(roomRef);
      if (!room.exists()) return "missing";
      if (room.data().status !== "open") return "closed";
      const claim = await getDoc(claimRef);
      if (claim.exists() && claim.data().participantId !== participantId) return "taken";
      throw error;
    }
  }

  async clearSelection(roomId: string, participantId: string): Promise<void> {
    await this.signIn();
    const roomRef = this.roomRef(roomId);
    const meRef = this.participantRef(roomId, participantId);
    await runTransaction(this.db, async (tx) => {
      const room = await tx.get(roomRef);
      if (!room.exists() || room.data().status !== "open") return;
      const me = await tx.get(meRef);
      if (!me.exists()) return;
      const selected = me.data().selectedCompanyId as number | null;
      if (selected === null) return;
      tx.delete(this.claimRef(roomId, selected));
      tx.update(meRef, { selectedCompanyId: null });
    });
  }

  async declare(roomId: string, result: MatchResult): Promise<void> {
    await this.signIn();
    // Firestore は undefined を保存できないため、JSON にできる形に揃える
    const plain = JSON.parse(JSON.stringify(result)) as MatchResult;
    await updateDoc(this.roomRef(roomId), { status: "declared", result: plain, updatedAt: serverTimestamp() });
  }

  async undoDeclare(roomId: string): Promise<void> {
    await this.signIn();
    await updateDoc(this.roomRef(roomId), { status: "open", result: null, updatedAt: serverTimestamp() });
  }
}
