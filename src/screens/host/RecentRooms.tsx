// トップ（/、src/screens/Home.tsx）の「最近のルーム」。この端末の記録にあるルームを 1 件ずつ読み、新しい順に並べる（#34）。
// firestore.rules はルームの一覧（list）を禁じているため、記録にある ID で 1 件ずつ get する
import { useEffect, useState } from "react";
import { roomRecords, type RoomRecord } from "../../device.ts";
import { getPreset } from "../../game/presets.ts";
import { roomStore, withTimeout, type Room } from "../../store/index.ts";
import { Button } from "../../ui/components.tsx";
import { formatExact, formatRelative } from "../../ui/datetime.ts";

const FOLDED_COUNT = 3;

type Entry = { record: RoomRecord; room: Room };

/* 1 件を待つ上限と、役割ごとに読みに行く件数の上限。切れているときや遅いときに、1 件のために一覧ぜんぶが出なくなるのを防ぎ、
   開くたびの読み取りを抑える。記録は役割ごとに古い順に並んでいるので、新しい側から読む */
const FETCH_TIMEOUT_MS = 4000;
const MAX_FETCH_PER_ROLE = 10;

async function loadEntries(): Promise<Entry[]> {
  const records = roomRecords();
  const recent = (role: RoomRecord["role"]) => records.filter((r) => r.role === role).slice(-MAX_FETCH_PER_ROLE);
  const loaded = await Promise.all(
    [...recent("host"), ...recent("participant")].map(async (record) => {
      const room = await withTimeout(roomStore.getRoom(record.roomId), FETCH_TIMEOUT_MS).catch(() => null);
      return room ? { record, room } : null;
    }),
  );
  return loaded.filter((e): e is Entry => e !== null).sort((a, b) => b.room.createdAt - a.room.createdAt);
}

export function RecentRooms() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    loadEntries().then((list) => alive && setEntries(list));
    return () => {
      alive = false;
    };
  }, []);

  // 読み終えるまでと、記録が空のときは何も出さない。無いことは告げない（#34）
  if (entries === null || entries.length === 0) return null;

  // 説明と遊び方を押し下げすぎないよう、はじめは新しい順に 3 件だけ出す
  const shown = expanded ? entries : entries.slice(0, FOLDED_COUNT);
  const hidden = entries.length - shown.length;

  // 紹介の区画と同じ強さに見えないよう、区画名は小さいラベル、お題は 1 段下の太字、補足は 1 行の小さい文字にする（#34 の V1）
  return (
    // 区画名は見出しにしない。ページの見出し（h1）より前に h2 が来ると、読み上げの見出しの順が崩れるため
    <section className="cp-stack cp-stack--8" aria-labelledby="recent-rooms-title">
      <p id="recent-rooms-title" className="t-label c-muted">
        最近のルーム
      </p>
      {shown.map(({ record, room }) => {
        const href = record.role === "host" ? `/host/${room.id}` : `/r/${room.id}`;
        const me = room.participants.find((p) => p.id === record.participantId);
        const role = record.role === "host" ? "ホスト" : me ? `参加者・${me.name}` : "参加者";
        const status = room.status === "declared" ? "発表済み" : "受付中";
        return (
          <a key={room.id} className="cp-row cp-row--link h-recent__row" href={href}>
            <span className="t-strong">{getPreset(room.presetId).label}</span>
            <span className="t-small c-muted">
              <time dateTime={new Date(room.createdAt).toISOString()} title={formatExact(room.createdAt)}>
                {formatRelative(room.createdAt)}
              </time>
              ・{role}・{status}
            </span>
          </a>
        );
      })}
      {hidden > 0 && (
        <Button kind="link" className="h-recent__more" onClick={() => setExpanded(true)}>
          ほかのルーム（{hidden} 件）
        </Button>
      )}
    </section>
  );
}
