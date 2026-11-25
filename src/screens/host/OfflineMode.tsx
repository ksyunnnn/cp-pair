// オフラインモード（ホストの端末 1 台で進める状態）の表示と操作。Firestore 版（VITE_ROOM_STORE=firestore）のときだけ出る。
// 「オフライン」とは書かず、動作で言う（web.dev Offline UX design guidelines https://web.dev/articles/offline-ux-design-guidelines ）。
import { useState } from "react";
import { navigate } from "../../router.ts";
import { leaveOfflineMode, useOfflineMode, type Room } from "../../store/index.ts";
import { Button } from "../../ui/components.tsx";
import { useToast } from "../../ui/toast.tsx";

const OFFLINE_TOAST_MS = 6000;

/** ホストの画面の上部の右に出す文字。オフラインモードの間は、そのことを常に添える */
export function HostDeviceLabel({ roomId }: { roomId: string }) {
  const offline = useOfflineMode(roomId);
  return <>{offline ? "ホストの端末 · この端末だけで進行中" : "ホストの端末"}</>;
}

/** オフラインモードの説明と、ホストが解除する操作 */
export function OfflineModeCard({ room }: { room: Room }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const release = async () => {
    if (!navigator.onLine) {
      toast("まだつながっていません。つながってから押してください", "warn");
      return;
    }
    setBusy(true);
    try {
      const nextId = await leaveOfflineMode(room.id);
      if (nextId === room.id) {
        toast("各自の端末での参加に戻しました", "success", OFFLINE_TOAST_MS);
      } else {
        toast(`各自の端末での参加に戻しました。ルーム ${room.id} は使えなかったため、ルーム ${nextId} に移しました`, "success", OFFLINE_TOAST_MS);
        navigate(`/host/${nextId}`);
      }
    } catch (error) {
      console.error(error);
      toast("戻せませんでした。つながりを確かめて、もう一度押してください", "warn");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cp-card">
      <div className="cp-stack cp-stack--8">
        <p className="t-strong">この端末だけで進めています</p>
        <p className="t-small c-muted">
          {room.status === "declared"
            ? "結果は、この端末を本人に渡して見せてください。つながったら、各自の端末での参加に戻すと、各自の端末にも結果が出ます。"
            : "つながらないため、QR コードでの参加を止めています。参加者は全員、この端末で順番に選びます。つながったら、各自の端末での参加に戻せます。"}
        </p>
      </div>
      <Button kind="secondary" onClick={release} disabled={busy}>
        各自の端末での参加に戻す
      </Button>
    </div>
  );
}
