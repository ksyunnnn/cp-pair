// トップ（/）の「最近のルーム」。この端末の記録にあるルームを 1 件ずつ読み、新しい順に並べる（#34）。
// firestore.rules はルームの一覧（list）を禁じているため、記録にある ID で 1 件ずつ get する
import { useEffect, useState } from "react";
import { roomRecords, type RoomRecord } from "../../device.ts";
import { getPreset } from "../../game/presets.ts";
import { roomStore, type Room } from "../../store/index.ts";
import { Badge } from "../../ui/components.tsx";

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

  useEffect(() => {
    let alive = true;
    loadEntries().then((list) => alive && setEntries(list));
    return () => {
      alive = false;
    };
  }, []);

  // 読み終えるまでは何も出さない（空の文言が一瞬出て消えるのを避ける）
  if (entries === null) return null;

  if (entries.length === 0) {
    return (
      <div className="cp-stack cp-stack--8">
        <p className="t-body">この端末に、最近のルームの記録はありません。</p>
        <p className="t-small c-muted">前のルームは、招待の URL から開けます。</p>
      </div>
    );
  }

  return (
    <section className="cp-stack" aria-labelledby="recent-rooms-title">
      <div className="cp-section__head">
        <h2 id="recent-rooms-title" className="t-strong">
          最近のルーム
        </h2>
      </div>
      {entries.map(({ record, room }) => {
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
    </section>
  );
}
