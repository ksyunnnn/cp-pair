// ホストの画面で、ルームの途中で切れたらオフラインモード（ホストの端末 1 台で進める状態）へ自動で入る。
// 切れたことは、ブラウザの offline イベントと navigator.onLine で知る
// （https://developer.mozilla.org/en-US/docs/Web/API/Window/offline_event ）。
import { useEffect } from "react";
import { enterOfflineMode, networkEnabled } from "../../store/index.ts";
import { useToast } from "../../ui/toast.tsx";

const OFFLINE_TOAST_MS = 6000;

/** ホストの画面で、ルームの途中で切れたらオフラインモードへ入り、toast で知らせる */
export function useAutoOfflineMode(roomId: string | null) {
  const toast = useToast();
  useEffect(() => {
    if (!networkEnabled || !roomId) return;
    const enter = () => {
      if (enterOfflineMode(roomId)) {
        toast(
          "つながらなくなったため、この端末だけで進めます。自分の端末で参加していた人も、この端末で選べます",
          "info",
          OFFLINE_TOAST_MS,
        );
      }
    };
    // 画面を消している間に切れたときは、戻ったときに気づく
    const check = () => {
      if (!navigator.onLine) enter();
    };
    check();
    window.addEventListener("offline", enter);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.removeEventListener("offline", enter);
      document.removeEventListener("visibilitychange", check);
    };
  }, [roomId, toast]);
}
