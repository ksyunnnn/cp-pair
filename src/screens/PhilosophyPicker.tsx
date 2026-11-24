// 理念選び（8 択・入れ替え・企業名は出さない）。参加者の端末とホストの端末で共通。
import { useEffect, useMemo, useState } from "react";
import { dataset } from "../game/dataset.ts";
import { getPreset } from "../game/presets.ts";
import { pad2 } from "../game/present.ts";
import type { Company, Participant } from "../game/types.ts";
import { roomStore, type Room } from "../store/index.ts";
import { Button, ChoiceCard, FloatingBar, ProgressSteps, ScreenHeading } from "../ui/components.tsx";
import { CpSymbol } from "../ui/symbols.tsx";
import { useToast } from "../ui/toast.tsx";

// 参加者ごとの 8 択。端末を切り替えても同じ並びに戻れるよう、画面の外に置く（モックの deviceStates と同じ役割）。
const pools = new Map<string, number[]>();

function excludedFor(room: Room, participantId: string): Set<number> {
  const excluded = new Set<number>();
  for (const p of room.participants) {
    if (p.id !== participantId && p.selectedCompanyId !== null) excluded.add(p.selectedCompanyId);
  }
  return excluded;
}

function ensurePool(room: Room, participantId: string): Company[] {
  const excluded = excludedFor(room, participantId);
  let ids = pools.get(participantId);
  if (!ids) {
    ids = dataset.getRandomPool(8, 4, excluded).map((c) => c.id);
  }
  let current = ids.filter((id) => !excluded.has(id));
  if (current.length < 8) {
    const currentIds = new Set([...excluded, ...current]);
    const extra = dataset.getRandomPool(8 - current.length, 3, currentIds).map((c) => c.id);
    current = [...current, ...extra];
  }
  pools.set(participantId, current);
  return current.map((id) => dataset.getById(id)).filter((c): c is Company => Boolean(c));
}

export function PhilosophyPicker({
  room,
  participant,
  eyebrow,
  onDone,
  secondary,
}: {
  room: Room;
  participant: Participant;
  eyebrow: string;
  onDone: (company: Company) => void;
  secondary?: { label: string; onClick: () => void };
}) {
  const toast = useToast();
  const preset = getPreset(room.presetId);
  const [version, setVersion] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const signature = room.participants.map((p) => `${p.id}:${p.selectedCompanyId}`).join("|");
  const options = useMemo(() => ensurePool(room, participant.id), [signature, participant.id, version]);

  useEffect(() => {
    if (chosen !== null && !options.some((c) => c.id === chosen)) setChosen(null);
  }, [options, chosen]);

  const reroll = () => {
    const excluded = excludedFor(room, participant.id);
    pools.set(
      participant.id,
      dataset.getRandomPool(8, 3, excluded).map((c) => c.id),
    );
    setChosen(null);
    setVersion((v) => v + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirm = async () => {
    if (chosen === null) return;
    setBusy(true);
    const outcome = await roomStore.selectCompany(room.id, participant.id, chosen);
    setBusy(false);
    if (outcome === "taken") {
      toast("その理念は、ほかの人が先に選びました", "warn");
      setChosen(null);
      setVersion((v) => v + 1);
      return;
    }
    if (outcome === "closed") {
      toast("ホストが結果を発表したため、選べません", "warn");
      return;
    }
    if (outcome !== "ok") {
      toast("この参加者はルームにいません", "warn");
      return;
    }
    const company = dataset.getById(chosen);
    if (company) onDone(company);
  };

  return (
    <>
      <main className="cp-content has-floating">
        <ProgressSteps current={2} />
        <ScreenHeading
          eyebrow={eyebrow}
          icon={<CpSymbol name="Secret" size={17} />}
          title={preset.label}
          lead="直感でひとつ。企業名は、結果が出るまで伏せられています。"
        />
        <div className="cp-stack">
          {options.map((company, i) => (
            <ChoiceCard
              key={company.id}
              category={`企業理念 ${pad2(i + 1)}`}
              label={company.phrase}
              selected={chosen === company.id}
              onClick={() => setChosen(chosen === company.id ? null : company.id)}
            />
          ))}
        </div>
        {secondary && (
          <Button kind="link" onClick={secondary.onClick}>
            {secondary.label}
          </Button>
        )}
      </main>
      <FloatingBar note={chosen === null ? "ひとつ選ぶと、決められます" : `${participant.name}さんの理念として送ります`}>
        <div className="cp-button-row">
          <Button kind="secondary" onClick={reroll}>
            入れ替える
          </Button>
          <Button onClick={confirm} disabled={chosen === null || busy}>
            これにする
          </Button>
        </div>
      </FloatingBar>
    </>
  );
}
