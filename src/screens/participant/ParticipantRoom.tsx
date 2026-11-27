// 参加者の端末: Step 1 ルーム参加 → Step 2 理念選び・待機 → Step 3 自分のマッチ結果
import { useState } from "react";
import { getMyParticipantId, setMyParticipantId } from "../../device.ts";
import { dataset } from "../../game/dataset.ts";
import { getPreset } from "../../game/presets.ts";
import type { Gender, Participant } from "../../game/types.ts";
import { networkEnabled, roomStore, type Room } from "../../store/index.ts";
import {
  BrandHeader,
  Button,
  GenderSelect,
  NicknameInput,
  ProgressSteps,
  ScreenHeading,
  ScreenMain,
} from "../../ui/components.tsx";
import { CpSymbol } from "../../ui/symbols.tsx";
import { useToast } from "../../ui/toast.tsx";
import { PhilosophyPicker } from "../PhilosophyPicker.tsx";
import { ResultScreen } from "../ResultScreen.tsx";
import { useOnline } from "./useOnline.ts";

export function ParticipantRoom({ room }: { room: Room }) {
  const myId = getMyParticipantId(room.id);
  const me = room.participants.find((p) => p.id === myId) || null;
  const [, setTick] = useState(0);
  const online = useOnline();

  if (!me) {
    if (room.status === "declared") return <Closed room={room} />;
    return <Join room={room} onJoined={() => setTick((t) => t + 1)} />;
  }
  if (room.status === "declared" && room.result) {
    return <ResultScreen result={room.result} participantId={me.id} />;
  }
  // この端末が切れている間は、選択も解除もさせない（ホストの端末で選んでもらう）
  if (networkEnabled && !online) return <PickOnHost room={room} />;
  if (me.selectedCompanyId === null) {
    return (
      <div className="cp-page">
        <BrandHeader right={`ルーム ${room.id}`} />
        <PhilosophyPicker
          room={room}
          participant={me}
          onDone={() => undefined}
        />
      </div>
    );
  }
  return <Waiting room={room} me={me} />;
}

function ThemeCard({ room }: { room: Room }) {
  return (
    <div className="cp-card cp-card--soft">
      <p className="t-small c-muted">お題</p>
      <p className="t-section">{getPreset(room.presetId).label}</p>
    </div>
  );
}

function Join({ room, onJoined }: { room: Room; onJoined: () => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [busy, setBusy] = useState(false);
  const ready = name.trim().length > 0 && gender !== null;

  const join = async () => {
    if (!ready || !gender) return;
    setBusy(true);
    try {
      const participant = await roomStore.addParticipant(room.id, { name: name.trim(), gender, joinType: "device" });
      setMyParticipantId(room.id, participant.id);
      toast(`${participant.name}さんとして参加しました`, "success");
      onJoined();
    } catch (error) {
      // 失敗したまま押せない状態で残さない（#37）
      console.error(error);
      toast("参加できませんでした。つながりを確かめて、もう一度押してください", "warn");
      setBusy(false);
    }
  };

  return (
    <div className="cp-page">
      <BrandHeader right={`ルーム ${room.id}`} />
      <ScreenMain className="cp-content">
        <ProgressSteps current={2} />
        <ScreenHeading
          eyebrow={`ROOM ${room.id} · JOIN`}
          icon={<CpSymbol name="Pair" size={17} />}
          title="ゲームに参加する"
          lead="ニックネームと性別を入れてください。選んだ理念は、結果が出るまで誰にも見えません。"
        />
        <ThemeCard room={room} />
        <form
          className="cp-stack cp-stack--16"
          onSubmit={(e) => {
            e.preventDefault();
            join();
          }}
        >
          <NicknameInput value={name} onChange={setName} />
          <GenderSelect value={gender} onChange={setGender} />
          <div className="cp-join-submit">
            <Button type="submit" disabled={!ready || busy}>
              参加する
            </Button>
          </div>
        </form>
      </ScreenMain>
    </div>
  );
}

function PickOnHost({ room }: { room: Room }) {
  return (
    <div className="cp-page">
      <BrandHeader right={`ルーム ${room.id}`} />
      <ScreenMain className="cp-content">
        <ProgressSteps current={2} />
        <ScreenHeading
          eyebrow="PICK ON THE HOST DEVICE"
          icon={<CpSymbol name="Talk" size={17} />}
          title="ホストの端末で選んでください"
          lead="この端末がつながっていません。ホストに声をかけて、ホストの端末で選んでください。つながると、この画面でまた選べます。"
        />
        <ThemeCard room={room} />
      </ScreenMain>
    </div>
  );
}

function Closed({ room }: { room: Room }) {
  return (
    <div className="cp-page">
      <BrandHeader right={`ルーム ${room.id}`} />
      <ScreenMain className="cp-content">
        <ScreenHeading
          eyebrow={`ROOM ${room.id}`}
          icon={<CpSymbol name="Secret" size={17} />}
          title="このルームは結果を発表しました"
          lead="参加の受け付けは終わっています。ホストに声をかけてください。"
        />
      </ScreenMain>
    </div>
  );
}

function Waiting({ room, me }: { room: Room; me: Participant }) {
  const company = me.selectedCompanyId !== null ? dataset.getById(me.selectedCompanyId) : null;
  const total = room.participants.length;
  const done = room.participants.filter((p) => p.selectedCompanyId !== null).length;

  return (
    <div className="cp-page">
      <BrandHeader right={`ルーム ${room.id}`} />
      <ScreenMain className="cp-content">
        <ProgressSteps current={2} />
        <ScreenHeading
          eyebrow="WAITING FOR THE HOST"
          icon={<CpSymbol name="Talk" size={17} />}
          title="ホストの発表を待っています"
          lead="ホストが登録完了を宣言すると、この画面にあなたの結果が出ます。"
        />
        <div className="r-you">
          <p className="t-chip c-muted">YOU · あなたが選んだ理念</p>
          <p className="r-you__phrase cp-phrase">{company?.phrase}</p>
          <p className="t-small c-muted">企業名は、結果で明かされます</p>
        </div>
        <div className="cp-card cp-card--soft">
          <p className="t-small c-muted">参加者の選択</p>
          <p className="t-section">
            {total}人中、{done}人が選び終えた
          </p>
        </div>
        <Button kind="link" onClick={() => roomStore.clearSelection(room.id, me.id)}>
          選び直す
        </Button>
      </ScreenMain>
    </div>
  );
}
