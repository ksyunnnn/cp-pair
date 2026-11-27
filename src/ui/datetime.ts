// ルームを作った日時の表記（#34）。トップの一覧は相対の表記、ルームの中の画面は正確な表記を使う。
// どちらも同じ関数から作り、一覧の title とルームの中の表記を必ず一致させる

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/* 正確な表記（例: 11月27日 21:30）。年は今年でないときだけ付ける */
export function formatExact(ms: number): string {
  const d = new Date(ms);
  const year = d.getFullYear() === new Date().getFullYear() ? "" : `${d.getFullYear()}年`;
  const time = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${year}${d.getMonth() + 1}月${d.getDate()}日 ${time}`;
}

/* 一覧での表記。X（Twitter）に倣い、24 時間以内は「N 分前」「N 時間前」、それより前は日付だけにする */
export function formatRelative(ms: number): string {
  const ago = Date.now() - ms;
  if (ago < MINUTE) return "たった今";
  if (ago < HOUR) return `${Math.floor(ago / MINUTE)}分前`;
  if (ago < DAY) return `${Math.floor(ago / HOUR)}時間前`;
  return formatExact(ms).replace(/ .*$/, "");
}
