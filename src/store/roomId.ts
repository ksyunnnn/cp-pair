// ルームの ID。Firestore の規則（firestore.rules の ^[2-35-68-9A-HJKMNP-UW-Z]{5}$）と同じ形にする。
// オフラインモードで作ったルームも、解除のときに同じ ID のまま Firestore へ引き継ぐため、同じ作り方にする。
// ID は画面と URL にそのまま出るので、読み違えやすい文字を外した 28 文字から選ぶ（#51）:
//   見た目で 1・0 と紛れる I・L・1・O・0 と、読み方が 2 通りある 4（よん／し）・7（なな／しち）・V（ブイ／ヴィー）を外す。
//   28⁵ ＝ 17,210,368 通り。重ならないことは、作るときに Firestore で確かめる（firestoreRoomStore.ts の createRoom）
const ROOM_ID_CHARS = "235689ABCDEFGHJKMNPQRSTUWXYZ";
const ROOM_ID_LENGTH = 5;

export function randomRoomId(): string {
  const values = crypto.getRandomValues(new Uint32Array(ROOM_ID_LENGTH));
  return Array.from(values, (v) => ROOM_ID_CHARS[v % ROOM_ID_CHARS.length]).join("");
}

/* 新しい形の ID か。前の形（英数字 36 文字）で作ったオフラインのルームを引き継ぐときに、ルールに拒まれる ID を見分ける */
export function isRoomId(id: string): boolean {
  return id.length === ROOM_ID_LENGTH && [...id].every((c) => ROOM_ID_CHARS.includes(c));
}
