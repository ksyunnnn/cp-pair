// ホスト Step 1: お題決定・ルーム作成
import { useState } from "react";
import { PRESET_PROMPTS } from "../../game/presets.ts";
import { pad2 } from "../../game/present.ts";
import { rememberHostRoom } from "../../device.ts";
import { navigate } from "../../router.ts";
import { createHostRoom } from "../../store/index.ts";
import { BrandHeader, Button, ChoiceCard, FloatingBar, ProgressSteps, ScreenHeading } from "../../ui/components.tsx";
import { CpSymbol } from "../../ui/symbols.tsx";
import { useToast } from "../../ui/toast.tsx";

export function HostStart() {
  const toast = useToast();
  const [presetId, setPresetId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!presetId) return;
    setBusy(true);
    const { room, offline } = await createHostRoom(presetId);
    rememberHostRoom(room.id);
    if (offline) {
      toast(`つながらないため、この端末だけで進めます。参加者は全員、この端末で順番に選びます（ルーム ${room.id}）`, "info", 6000);
    } else {
      toast(`ルーム ${room.id} を作りました`, "success");
    }
    navigate(`/host/${room.id}`);
  };

  return (
    <div className="cp-page">
      <BrandHeader right="ホストの端末" />
      <main className="cp-content has-floating">
        <ProgressSteps current={1} />
        <ScreenHeading
          eyebrow="HOST · CHOOSE A THEME"
          icon={<CpSymbol name="Pair" size={17} />}
          title="今夜のお題を選ぶ"
          lead="参加者は、このお題に合う企業理念を選びます。お題によって、相性の判定が少し変わります。"
        />
        <div className="cp-stack">
          {PRESET_PROMPTS.map((p, i) => (
            <ChoiceCard
              key={p.id}
              category={`お題 ${pad2(i + 1)}`}
              label={p.label}
              selected={presetId === p.id}
              onClick={() => setPresetId(p.id)}
            />
          ))}
        </div>
      </main>
      <FloatingBar note={presetId ? "ルームを作ると、招待の QR コードと URL が出ます" : "お題を選ぶと、ルームを作れます"}>
        <Button onClick={create} disabled={!presetId || busy}>
          このお題でルームを作る
        </Button>
      </FloatingBar>
    </div>
  );
}
