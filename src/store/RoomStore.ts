// ルームのデータの出し入れはこのインターフェースを通す。
// ブラウザ内の実装は localRoomStore.ts、端末をまたぐ実装は firestoreRoomStore.ts。どちらを使うかは index.ts で切り替える。
import type { Gender, JoinType, MatchResult, Participant } from "../game/types.ts";

export type RoomStatus = "open" | "declared";

export interface Room {
  id: string;
  presetId: string;
  status: RoomStatus;
  participants: Participant[];
  result: MatchResult | null;
  createdAt: number;
  updatedAt: number;
  /** Firestore 版だけ。ルームを作った端末の匿名認証の uid。画面はこれでホストを判定する */
  hostUid?: string;
  /** Firestore 版だけ。ホストの端末が最後に生存の印を書いた日時（サーバの時刻）。参加者の端末は、これが途絶えたらホストと切れたとみなす */
  hostSeenAt?: number;
}

export interface NewParticipant {
  name: string;
  gender: Gender;
  joinType: JoinType;
}

export type SelectOutcome = "ok" | "taken" | "closed" | "missing";

export interface RoomStore {
  createRoom(presetId: string): Promise<Room>;
  getRoom(roomId: string): Promise<Room | null>;
  /** ルームの変化を受け取る。登録した直後に現在の値で 1 回呼ぶ。戻り値で解除する。 */
  subscribe(roomId: string, listener: (room: Room | null) => void): () => void;
  addParticipant(roomId: string, input: NewParticipant): Promise<Participant>;
  removeParticipant(roomId: string, participantId: string): Promise<void>;
  /** 他の参加者が選んだ理念は選べない（"taken"）。宣言の後は選べない（"closed"）。 */
  selectCompany(roomId: string, participantId: string, companyId: number): Promise<SelectOutcome>;
  clearSelection(roomId: string, participantId: string): Promise<void>;
  declare(roomId: string, result: MatchResult): Promise<void>;
  undoDeclare(roomId: string): Promise<void>;
}
