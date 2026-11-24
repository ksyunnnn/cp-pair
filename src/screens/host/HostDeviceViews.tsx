// ホストの端末の中で開く、参加者ひとりのための画面（手動登録者の理念選び / 各自の結果）。
import { useState } from "react";
import { navigate } from "../../router.ts";
import type { Room } from "../../store/index.ts";
import { BrandHeader } from "../../ui/components.tsx";
import { useToast } from "../../ui/toast.tsx";
import { PhilosophyPicker } from "../PhilosophyPicker.tsx";
import { ResultScreen } from "../ResultScreen.tsx";
import { Handoff } from "./Handoff.tsx";
import { HostRoom } from "./HostRoom.tsx";

export function HostPick({ room, participantId }: { room: Room; participantId: string }) {
  const toast = useToast();
  const [passed, setPassed] = useState(false);
  const participant = room.participants.find((p) => p.id === participantId);
  const back = () => navigate(`/host/${room.id}`);

  if (!participant || room.status !== "open") return <HostRoom room={room} />;

  if (!passed) {
    return (
      <Handoff
        name={participant.name}
        purpose="さんの番です"
        lead="ほかの人に画面が見えないようにしてから、下のボタンを押してください。選んだ理念は、ホストにも表示されません。"
        onProceed={() => setPassed(true)}
        onBack={back}
      />
    );
  }

  return (
    <div className="cp-page">
      <BrandHeader right="ホストの端末" />
      <PhilosophyPicker
        room={room}
        participant={participant}
        onDone={() => {
          toast(`${participant.name}さんの選択を受け付けました。端末をホストに戻してください`, "success");
          back();
        }}
        secondary={{ label: "選ばずにホスト画面に戻る", onClick: back }}
      />
    </div>
  );
}

export function HostResultView({ room, participantId }: { room: Room; participantId: string }) {
  const participant = room.participants.find((p) => p.id === participantId);
  const [passed, setPassed] = useState(participant?.joinType !== "manual");
  const back = () => navigate(`/host/${room.id}`);

  if (!participant || room.status !== "declared" || !room.result) return <HostRoom room={room} />;

  if (!passed) {
    return (
      <Handoff
        name={participant.name}
        purpose="さんの結果です"
        lead="マッチ相手が分かるのは本人とホストだけです。本人に端末を渡してから、下のボタンを押してください。"
        onProceed={() => setPassed(true)}
        onBack={back}
      />
    );
  }

  return <ResultScreen result={room.result} participantId={participant.id} onBackToHost={back} />;
}
