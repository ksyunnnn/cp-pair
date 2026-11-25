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
import { randomRoomId } from "./roomId.ts";

const ROOM_ID_ATTEMPTS = 10;

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
    hostUid: data.hostUid,
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

  /** id のルームを uid をホストにして作る。同じ ID のルームが既にあれば作らずに false を返す */
  private tryCreateRoom(id: string, presetId: string, uid: string): Promise<boolean> {
    const ref = this.roomRef(id);
    return runTransaction(this.db, async (tx) => {
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
  }

  async createRoom(presetId: string): Promise<Room> {
    const uid = await this.signIn();
    for (let attempt = 0; attempt < ROOM_ID_ATTEMPTS; attempt++) {
      const id = randomRoomId();
      if (await this.tryCreateRoom(id, presetId, uid)) {
        const now = Date.now();
        return { id, presetId, status: "open", participants: [], result: null, createdAt: now, updatedAt: now, hostUid: uid };
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

  /**
   * オフラインモードを解除するときに、ホストの端末のルーム（source）を Firestore へ引き継ぐ。
   * - Firestore に同じ ID のルームがなければ、同じ ID で作る。別の人がその ID のルームを持っていれば、新しい ID で作る
   * - 参加者: ホストの端末で加えた人は作り、knownParticipantIds（入ったときにいた人）のうちホストの端末にいない人は外す。
   *   切れている間に自分の端末で加わった人は残す
   * - 選択: 上書きするのは、ホストの端末で選び直した人（repickedParticipantIds）と、ホストの端末で加えた人だけ。
   *   ほかの人は Firestore の値（本人の端末で選んだもの）を残す。理念が重なったら、ホストの端末で選び直した人を残し、相手の選択を外す
   * - 宣言の状態と結果は、ホストの端末に揃える
   * 途中で失敗しても、もう一度呼べば同じ状態に揃う。戻り値は引き継いだ先のルームの ID。
   */
  async importRoom(source: Room, knownParticipantIds: string[], repickedParticipantIds: string[]): Promise<string> {
    const uid = await this.signIn();
    let roomId = source.id;
    const existing = await getDoc(this.roomRef(roomId));
    if (!existing.exists()) {
      if (!(await this.tryCreateRoom(roomId, source.presetId, uid))) roomId = (await this.createRoom(source.presetId)).id;
    } else if (existing.data().hostUid !== uid) {
      roomId = (await this.createRoom(source.presetId)).id;
    } else if (existing.data().status !== "open") {
      // 参加者と選択は、宣言の前の状態でしか書き換えられない（firestore.rules）
      await this.undoDeclare(roomId);
    }

    const remoteSnap = await getDocs(this.participantsQuery(roomId));
    const remote = new Map(remoteSnap.docs.map((d) => [d.id, (d.data().selectedCompanyId ?? null) as number | null]));
    const local = new Map(source.participants.map((p) => [p.id, p]));
    const known = new Set(knownParticipantIds);
    // ホストの端末の選択で上書きする人
    const repicked = new Set(repickedParticipantIds);
    const overrides = source.participants.filter((p) => repicked.has(p.id) || !remote.has(p.id));
    const overrideIds = new Set(overrides.map((p) => p.id));
    const hostPicks = new Set(overrides.flatMap((p) => (p.selectedCompanyId === null ? [] : [p.selectedCompanyId])));

    // 先に、外す人と外す選択を片付けて理念の札を空けてから、ホストの端末の選択を書く
    for (const [id, selected] of remote) {
      if (!local.has(id) && known.has(id)) {
        await this.removeParticipant(roomId, id);
        continue;
      }
      if (selected === null) continue;
      const replaced = overrideIds.has(id) && selected !== local.get(id)!.selectedCompanyId;
      const collides = !overrideIds.has(id) && hostPicks.has(selected);
      if (replaced || collides) await this.clearSelection(roomId, id);
    }
    for (const p of overrides) {
      if (!remote.has(p.id)) {
        await setDoc(this.participantRef(roomId, p.id), {
          ownerUid: uid,
          name: p.name,
          gender: p.gender,
          joinType: p.joinType,
          selectedCompanyId: null,
          joinedAt: serverTimestamp(),
        });
      }
      if (p.selectedCompanyId !== null && remote.get(p.id) !== p.selectedCompanyId) {
        const outcome = await this.selectCompany(roomId, p.id, p.selectedCompanyId);
        if (outcome !== "ok") throw new Error(`${p.name}さんの選択を引き継げませんでした（${outcome}）`);
      }
    }

    if (source.status === "declared" && source.result) await this.declare(roomId, source.result);
    return roomId;
  }
}
