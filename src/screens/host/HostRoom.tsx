// ホスト Step 2（共有・参加管理）と Step 3（完了宣言・結果）
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { inviteUrl } from "../../device.ts";
import { dataset } from "../../game/dataset.ts";
import { MatchingEngine } from "../../game/engine.ts";
import { getPreset } from "../../game/presets.ts";
import { pad2 } from "../../game/present.ts";
import type { Gender, MatchedPerson } from "../../game/types.ts";
import { navigate } from "../../router.ts";
import { roomStore, useIsHost, useOfflineMode, type Room } from "../../store/index.ts";
import { COLOR } from "../../styles/tokens.ts";
import {
  BrandHeader,
  Button,
  FloatingBar,
  GENDER_LABEL,
  GenderSelect,
  NicknameInput,
  ParticipantRow,
  ProgressSteps,
  ScreenHeading,
  ScreenMain,
  Section,
  TopLinkFooter,
} from "../../ui/components.tsx";
import { CpSymbol } from "../../ui/symbols.tsx";
import { useToast } from "../../ui/toast.tsx";
import { ScoreAndTitle } from "../ResultScreen.tsx";
import { HostDeviceLabel, OfflineModeCard } from "./OfflineMode.tsx";

export function NotHost({ roomId }: { roomId: string }) {
  return (
    <div className="cp-page">
      <BrandHeader right="ホストの端末" />
      <ScreenMain className="cp-content">
        <ScreenHeading
          eyebrow={`ROOM ${roomId}`}
          icon={<CpSymbol name="Secret" size={17} />}
          title="この端末は、このルームのホストではありません"
          lead="ルームを作った端末で開いてください。"
        />
        <Button kind="secondary" onClick={() => navigate("/")}>
          新しいルームを作る
        </Button>
      </ScreenMain>
    </div>
  );
}

export function RoomMissing({ roomId }: { roomId: string }) {
  return (
    <div className="cp-page">
      <BrandHeader />
      <ScreenMain className="cp-content">
        <ScreenHeading
          eyebrow={`ROOM ${roomId}`}
          icon={<CpSymbol name="Secret" size={17} />}
          title="ルームが見つかりません"
          lead="招待の URL をもう一度確かめてください。"
        />
      </ScreenMain>
      <TopLinkFooter />
    </div>
  );
}

export function HostRoom({ room }: { room: Room }) {
  const isHost = useIsHost(room);
  if (isHost === null) return <div className="cp-page" />;
  if (!isHost) return <NotHost roomId={room.id} />;
  return room.status === "declared" ? <HostResults room={room} /> : <HostLobby room={room} />;
}

function ThemeCard({ room }: { room: Room }) {
  return (
    <div className="cp-card cp-card--soft">
      <p className="t-small c-muted">お題</p>
      <p className="t-section">{getPreset(room.presetId).label}</p>
    </div>
  );
}

function HostLobby({ room }: { room: Room }) {
  const toast = useToast();
  const offline = useOfflineMode(room.id);
  const url = inviteUrl(room.id);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("M");
  // 開いたときにいた参加者。後から加わった行だけを打ち込む
  const [initialIds] = useState(() => new Set(room.participants.map((p) => p.id)));

  const total = room.participants.length;
  const done = room.participants.filter((p) => p.selectedCompanyId !== null).length;
  const canDeclare = total >= 2 && done === total;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast("招待の URL をコピーしました", "success");
    } catch {
      toast("コピーできませんでした。URL を長押ししてコピーしてください", "warn");
    }
  };

  const add = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast("ニックネームを入れてください", "warn");
      return;
    }
    await roomStore.addParticipant(room.id, { name: trimmed, gender, joinType: "manual" });
    toast(`${trimmed}さんを登録しました。ホストの端末で選んでもらいます`, "info");
    setName("");
    setAdding(false);
  };

  const declare = async () => {
    const result = MatchingEngine.runMatching(room.participants, dataset, { preset: getPreset(room.presetId) });
    await roomStore.declare(room.id, result);
    toast(
      offline ? "登録完了を宣言しました。この端末を本人に渡して、結果を見せてください" : "登録完了を宣言しました。各自の端末に結果が出ます",
      "success",
    );
  };

  const note = canDeclare
    ? "全員が選び終えました"
    : total < 2
      ? "2人以上が参加すると、結果を発表できます"
      : `全員が選ぶと、結果を発表できます（${total}人中、${done}人が選択済み）`;

  return (
    <div className="cp-page">
      <BrandHeader right={<HostDeviceLabel roomId={room.id} />} />
      <ScreenMain className="cp-content has-floating">
        <ProgressSteps current={2} />
        <ScreenHeading eyebrow={`ROOM ${room.id}`} icon={<CpSymbol name="Pair" size={17} />} title="参加者を集める" />
        <ThemeCard room={room} />

        {offline ? (
          <OfflineModeCard room={room} />
        ) : (
          <div className="cp-card">
            <div className="cp-stack cp-stack--8">
              <p className="t-strong">QR コードか URL を共有</p>
              <p className="t-small c-muted">参加者は自分のスマホで開き、ニックネームと性別を入れて参加します。</p>
            </div>
            <div className="cp-qr">
              <QRCodeSVG value={url} size={176} bgColor={COLOR.paper} fgColor={COLOR.ink} level="M" marginSize={0} title={`ルーム ${room.id} の招待 URL`} />
            </div>
            <div className="cp-url">
              <span className="t-small cp-url__text">{url}</span>
            </div>
            <Button kind="secondary" onClick={copy}>
              URL をコピー
            </Button>
          </div>
        )}

        <Section
          title={offline ? "参加者を登録" : "URL を開けない人"}
          aside={offline ? "この端末で選びます" : "ホストの端末で選びます"}
        >
          {adding ? (
            <form
              className="cp-stack cp-stack--16"
              onSubmit={(e) => {
                e.preventDefault();
                add();
              }}
            >
              <NicknameInput value={name} onChange={setName} autoFocus />
              <GenderSelect value={gender} onChange={setGender} />
              <div className="cp-button-row">
                <Button kind="link" onClick={() => setAdding(false)}>
                  やめる
                </Button>
                <Button kind="secondary" type="submit">
                  登録する
                </Button>
              </div>
            </form>
          ) : (
            <Button kind="link" onClick={() => setAdding(true)}>
              参加者を手動で追加
            </Button>
          )}
        </Section>

        <Section title="参加状況" aside={`${total}人中、${done}人が選び終えた`}>
          {total === 0 ? (
            <p className="t-body c-muted">まだ誰も参加していません。</p>
          ) : (
            <div className="cp-stack cp-stack--8">
              {room.participants.map((p) => {
                const isDone = p.selectedCompanyId !== null;
                // オフラインモードでは、自分の端末で参加していた人も、この端末で選び直せる
                const picksHere = p.joinType === "manual" || offline;
                return (
                  <ParticipantRow
                    key={p.id}
                    name={p.name}
                    gender={p.gender}
                    joinType={p.joinType}
                    done={isDone}
                    entering={!initialIds.has(p.id)}
                    status={isDone ? "選び終えた" : "まだ選んでいません"}
                    action={picksHere ? (isDone ? "選び直す" : "この端末で選ぶ") : undefined}
                    onAction={() => navigate(`/host/${room.id}/pick/${p.id}`)}
                    onRemove={async () => {
                      await roomStore.removeParticipant(room.id, p.id);
                      toast(`${p.name}さんを参加者から外しました`, "info");
                    }}
                  />
                );
              })}
            </div>
          )}
        </Section>
      </ScreenMain>
      <FloatingBar note={note}>
        <Button onClick={declare} disabled={!canDeclare}>
          登録完了を宣言
        </Button>
      </FloatingBar>
    </div>
  );
}

function PersonLine({ person }: { person: MatchedPerson }) {
  return (
    <div className="h-person">
      <div className="h-person__name">
        <span className="t-section">{person.name}</span>
        <span className="t-small c-muted">
          {GENDER_LABEL[person.gender]} · {person.company.company_name}
        </span>
      </div>
      <p className="t-label">{person.company.phrase}</p>
    </div>
  );
}

function HostResults({ room }: { room: Room }) {
  const toast = useToast();
  const offline = useOfflineMode(room.id);
  const result = room.result;
  if (!result) return null;

  const pairIndex = new Map<string, number>();
  result.pairs.forEach((pair, i) => {
    pairIndex.set(pair.personA.id, i + 1);
    pairIndex.set(pair.personB.id, i + 1);
  });

  const undo = async () => {
    await roomStore.undoDeclare(room.id);
    toast("宣言を取り消しました。参加管理に戻ります", "info");
  };

  return (
    <div className="cp-page">
      <BrandHeader right={<HostDeviceLabel roomId={room.id} />} />
      <ScreenMain className="cp-content">
        <ProgressSteps current={3} />
        <ScreenHeading
          eyebrow={`ROOM ${room.id} · RESULTS`}
          icon={<CpSymbol name="Pair" size={17} />}
          title="結果を発表しました"
          lead={
            offline
              ? "この端末を本人に渡して、結果を見せてください。マッチ相手が分かるのは本人とホストだけです。"
              : "各自の端末に、本人の結果だけが出ています。マッチ相手が分かるのは本人とホストだけです。"
          }
        />
        <ThemeCard room={room} />
        {offline && <OfflineModeCard room={room} />}

        <Section title="各自の結果を開く">
          <div className="cp-stack cp-stack--8">
            {room.participants
              .filter((p) => p.selectedCompanyId !== null)
              .map((p) => {
                const n = pairIndex.get(p.id);
                return (
                  <ParticipantRow
                    key={p.id}
                    name={p.name}
                    gender={p.gender}
                    joinType={p.joinType}
                    done
                    status={n ? `ペア ${pad2(n)}` : "フリー／ジョーカー枠"}
                    action={p.joinType === "manual" || offline ? "端末を渡して見せる" : "この人の画面を見る"}
                    onAction={() => navigate(`/host/${room.id}/result/${p.id}`)}
                  />
                );
              })}
          </div>
        </Section>

        <Section title="全員の結果" aside={`${result.pairs.length}組・フリー ${result.unmatched.length}人`}>
          <div className="cp-stack">
            {result.pairs.map((pair, i) => (
              <article key={pair.personA.id} className="cp-card">
                <p className="t-eyebrow c-muted">PAIR {pad2(i + 1)}</p>
                <ScoreAndTitle score={pair.evaluation.score} title={pair.evaluation.title} />
                <PersonLine person={pair.personA} />
                <PersonLine person={pair.personB} />
              </article>
            ))}
            {result.unmatched.length > 0 && (
              <article className="cp-card">
                <p className="t-eyebrow c-muted">FREE / JOKER</p>
                {result.unmatched.map((u) => (
                  <PersonLine key={u.id} person={u} />
                ))}
              </article>
            )}
          </div>
        </Section>

        <Button kind="secondary" onClick={undo}>
          宣言を取り消して、参加管理に戻る
        </Button>
      </ScreenMain>
      <TopLinkFooter />
    </div>
  );
}
