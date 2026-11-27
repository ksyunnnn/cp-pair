// トップ（/、src/screens/Home.tsx）の「最近のルーム」。この端末の記録にあるルームを 1 件ずつ読み、新しい順に並べる（#34）。
// firestore.rules はルームの一覧（list）を禁じているため、記録にある ID で 1 件ずつ get する
import { useEffect, useState } from "react";
import { roomRecords, type RoomRecord } from "../../device.ts";
import { getPreset } from "../../game/presets.ts";
import { roomStore, type Room } from "../../store/index.ts";
import { Badge, Button, Section } from "../../ui/components.tsx";

const FOLDED_COUNT = 3;

type Entry = { record: RoomRecord; room: Room };

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

  // ほかの区画を押し下げすぎないよう、はじめは新しい順に 3 件だけ出す
  const shown = expanded ? entries : entries.slice(0, FOLDED_COUNT);
  const hidden = entries.length - shown.length;

  return (
    <Section title="最近のルーム">
      {shown.map(({ record, room }) => {
        const href = record.role === "host" ? `/host/${room.id}` : `/r/${room.id}`;
        const me = room.participants.find((p) => p.id === record.participantId);
        const role = record.role === "host" ? "ホスト" : me ? `参加者・${me.name}` : "参加者";
        return (
          <a key={room.id} className="cp-row cp-row--link" href={href}>
            <span className="cp-row__text">
              <span className="t-small c-muted">ROOM {room.id}</span>
              <span className="t-section">{getPreset(room.presetId).label}</span>
              <span className="cp-row__attrs">
                <Badge>{role}</Badge>
                <Badge>{room.status === "declared" ? "発表済み" : "受付中"}</Badge>
              </span>
            </span>
          </a>
        );
      })}
      {hidden > 0 && (
        <Button kind="link" className="h-recent__more" onClick={() => setExpanded(true)}>
          ほかのルーム（{hidden} 件）
        </Button>
      )}
    </Section>
  );
}
