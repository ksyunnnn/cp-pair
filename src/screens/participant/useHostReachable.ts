// 参加者の端末が、ホストの端末とつながっているかを判定する。つながっていなければ、理念を選べなくする。
// - この端末が切れた: ブラウザの offline イベントと navigator.onLine
// - ホストの端末だけが切れた: ホストの端末が書く生存の印（hostSeenAt、HostHeartbeat.tsx）が HOST_SILENCE_MS より長く変わらない
//
// 間隔の見積もり（Spark の Firestore の無料枠は書き込み 20K/日・読み取り 50K/日 https://firebase.google.com/pricing ）:
// - 書き込み: 30 秒ごとに 1 回で、ルーム 1 件を 1 時間開くと 120 回。20K/日 では 1 日に約 166 時間分
// - 読み取り: 印を書くたびに、ルームを購読する端末（ホスト + 参加者）ごとに 1 回。7 台なら 1 時間に 840 回で、50K/日 では約 59 時間分
// - 判定: 印が 90 秒（3 回分）変わらなければ切れたとみなす。1 回の書き込みの遅れや取りこぼしでは止めない
//
// 印の時刻はサーバの時刻なので、この端末の時計とは比べない。印の値が変わったのに気づいた時刻を、この端末の時計で覚える。
// 最初だけは印の値とこの端末の時計を比べる（ずれがあっても、次の印に気づけば正しくなる）。判定は CHECK_MS ごとに行う。
import { useEffect, useRef, useState } from "react";
import { networkEnabled, type Room } from "../../store/index.ts";

const HOST_SILENCE_MS = 90_000;
const CHECK_MS = 5_000;

export type HostReach = "ok" | "selfOffline" | "hostSilent";

export function useHostReachable(room: Room): HostReach {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [silent, setSilent] = useState(false);
  const latest = useRef(room.hostSeenAt);
  const tracked = useRef<{ value: number | undefined; at: number } | null>(null);

  useEffect(() => {
    latest.current = room.hostSeenAt;
  }, [room.hostSeenAt]);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const value = latest.current;
      if (tracked.current === null) {
        tracked.current = { value, at: value === undefined ? now : Math.min(now, value) };
      } else if (tracked.current.value !== value) {
        tracked.current = { value, at: now };
      }
      setOnline(navigator.onLine);
      setSilent(value !== undefined && now - tracked.current.at > HOST_SILENCE_MS);
    };
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    document.addEventListener("visibilitychange", update);
    const timer = window.setInterval(update, CHECK_MS);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      document.removeEventListener("visibilitychange", update);
      window.clearInterval(timer);
    };
  }, []);

  // 宣言の後は選べないため判定しない。印のないルーム（印を書く前の版で作ったルーム）は止めない
  if (!networkEnabled || room.status !== "open") return "ok";
  if (!online) return "selfOffline";
  return silent ? "hostSilent" : "ok";
}
