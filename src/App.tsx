import { DevPanel } from "./dev/DevPanel.tsx";
import { isDevMode, useRoute } from "./router.ts";
import { HostPick, HostResultView } from "./screens/host/HostDeviceViews.tsx";
import { HostRoom, RoomMissing } from "./screens/host/HostRoom.tsx";
import { HostStart } from "./screens/host/HostStart.tsx";
import { ParticipantRoom } from "./screens/participant/ParticipantRoom.tsx";
import { useRoom } from "./store/index.ts";
import { OfflineReady } from "./ui/offlineReady.tsx";
import { ToastProvider } from "./ui/toast.tsx";

function Screen() {
  const route = useRoute();
  const roomId = "roomId" in route ? route.roomId : null;
  const { room, loading } = useRoom(roomId);

  if (route.name === "hostStart") return <HostStart />;
  if (loading) return <div className="cp-page" />;
  if (!room) return <RoomMissing roomId={roomId ?? ""} />;

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

export default function App() {
  const route = useRoute();
  return (
    <ToastProvider>
      <OfflineReady />
      <Screen />
      {isDevMode() && <DevPanel route={route} />}
    </ToastProvider>
  );
}
