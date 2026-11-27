// トップ（/、src/screens/Home.tsx）の「最近のルーム」。この端末の記録にあるルームを 1 件ずつ読み、新しい順に並べる（#34）。
// firestore.rules はルームの一覧（list）を禁じているため、記録にある ID で 1 件ずつ get する
import { useEffect, useState } from "react";
import { roomRecords, type RoomRecord } from "../../device.ts";
import { getPreset } from "../../game/presets.ts";
import { roomStore, type Room } from "../../store/index.ts";
import { Button } from "../../ui/components.tsx";

const FOLDED_COUNT = 3;

type Entry = { record: RoomRecord; room: Room };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/* 作った日時の正確な表記（例: 11月27日 21:30）。年は今年でないときだけ付ける */
function formatExact(ms: number): string {
  const d = new Date(ms);
  const year = d.getFullYear() === new Date().getFullYear() ? "" : `${d.getFullYear()}年`;
  const time = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${year}${d.getMonth() + 1}月${d.getDate()}日 ${time}`;
}

/* 一覧での表記。X（Twitter）に倣い、24 時間以内は「N 分前」「N 時間前」、それより前は日付だけにする */
function formatRelative(ms: number): string {
  const ago = Date.now() - ms;
  if (ago < MINUTE) return "たった今";
  if (ago < HOUR) return `${Math.floor(ago / MINUTE)}分前`;
  if (ago < DAY) return `${Math.floor(ago / HOUR)}時間前`;
  return formatExact(ms).replace(/ .*$/, "");
}

async function loadEntries(): Promise<Entry[]> {
  const loaded = await Promise.all(
    roomRecords().map(async (record) => {
      const room = await roomStore.getRoom(record.roomId).catch(() => null);
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
    <section className="cp-stack cp-stack--8" aria-labelledby="recent-rooms-title">
      <h2 id="recent-rooms-title" className="t-label c-muted">
        最近のルーム
      </h2>
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
