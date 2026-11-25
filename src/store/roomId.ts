// ルームの ID。Firestore の規則（firestore.rules の ^[0-9A-Z]{5}$）と同じ形にする。
// オフラインモードで作ったルームも、解除のときに同じ ID のまま Firestore へ引き継ぐため、同じ作り方にする。
const ROOM_ID_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ROOM_ID_LENGTH = 5;

export function randomRoomId(): string {
  const values = crypto.getRandomValues(new Uint32Array(ROOM_ID_LENGTH));
  return Array.from(values, (v) => ROOM_ID_CHARS[v % ROOM_ID_CHARS.length]).join("");
}
