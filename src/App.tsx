import { LazyMotion, MotionConfig } from "motion/react";
import { AboutScreen } from "./screens/AboutScreen.tsx";
import { DevPanel } from "./dev/DevPanel.tsx";
import { isDevMode, useRoute } from "./router.ts";
import { HostPick, HostResultView } from "./screens/host/HostDeviceViews.tsx";
import { HostRoom, RoomMissing } from "./screens/host/HostRoom.tsx";
import { HostHeartbeat } from "./screens/host/HostHeartbeat.tsx";
import { HostStart } from "./screens/host/HostStart.tsx";
import { useAutoOfflineMode } from "./screens/host/useAutoOfflineMode.ts";
import { ParticipantRoom } from "./screens/participant/ParticipantRoom.tsx";
import { RulesScreen } from "./screens/RulesScreen.tsx";
import { useRoom } from "./store/index.ts";
import { OfflineReady } from "./ui/offlineReady.tsx";
import { ToastProvider } from "./ui/toast.tsx";

// 動きの機能は最初から読み込む。後から読み込むと、再読み込みで結果の画面を開いたときに機能が揃う前に描かれ、
// 発表の見出しと相性度を中央へ置く指示が効かない（2026-11-25 に確かめた）
import loadMotionFeatures from "./ui/motionFeatures.ts";

function Screen() {
  const route = useRoute();
  const roomId = "roomId" in route ? route.roomId : null;
  const { room, loading } = useRoom(roomId);
  const hostRoute = route.name === "host" || route.name === "hostPick" || route.name === "hostResult";
  // ルームを受け取れないまま切れても入れるよう、読み込みを待たずに見張る
  useAutoOfflineMode(hostRoute ? roomId : null);

  if (route.name === "hostStart") return <HostStart />;
  if (route.name === "rules") return <RulesScreen />;
  // about はルームを読まない。どの画面からでも開ける
  if (route.name === "about") return <AboutScreen />;
  if (loading) return <div className="cp-page" />;
  if (!room) return <RoomMissing roomId={roomId ?? ""} />;

  return (
    <>
      {hostRoute && <HostHeartbeat key={room.id} room={room} />}
      {screen()}
    </>
  );

  function screen() {
    if (!room) return null;
    switch (route.name) {
      case "host":
        return <HostRoom room={room} />;
      case "hostPick":
        return <HostPick key={route.participantId} room={room} participantId={route.participantId} />;
      case "hostResult":
        return <HostResultView key={route.participantId} room={room} participantId={route.participantId} />;
      case "participant":
        return <ParticipantRoom room={room} />;
    }
  }
}

export default function App() {
  const route = useRoute();
  return (
    // reducedMotion="user": 端末の「視差効果を減らす」が有効なら transform を止め、opacity だけを残す
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadMotionFeatures} strict>
        <ToastProvider>
          <OfflineReady />
          <Screen />
          {isDevMode() && <DevPanel route={route} />}
        </ToastProvider>
      </LazyMotion>
    </MotionConfig>
  );
}
