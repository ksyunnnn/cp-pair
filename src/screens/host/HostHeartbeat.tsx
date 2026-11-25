// ホストの端末が、Firestore のルームに生存の印（hostSeenAt）を一定間隔で書く。
// 参加者の端末は、印が途絶えたらホストと切れたとみなし、理念を選べなくする（useHostReachable.ts）。
// 書くのは、通常モードで、宣言の前で、画面が見えている間だけ。間隔と無料枠の見積もりは useHostReachable.ts にある。
import { useEffect } from "react";
import { networkEnabled, touchHost, useIsHost, useOfflineMode, type Room } from "../../store/index.ts";

const HOST_HEARTBEAT_MS = 30_000;

export function HostHeartbeat({ room }: { room: Room }) {
  const isHost = useIsHost(room);
  const offline = useOfflineMode(room.id);
  const active = networkEnabled && isHost === true && !offline && room.status === "open";

  useEffect(() => {
    if (!active) return;
    const beat = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      touchHost(room.id).catch((error) => console.warn("生存の印を書けませんでした", error));
    };
    beat();
    const timer = window.setInterval(beat, HOST_HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [active, room.id]);

  return null;
}
