// 開発用の切り替え。URL に ?dev があるときだけ出る。画面のデザインとは切り離してある。
// 1 台のブラウザで、ホストと参加者の端末を行き来する。
import { useState } from "react";
import { deviceKey, lastHostRoom, rememberHostRoom, setDeviceKey, setMyParticipantId } from "../device.ts";
import { dataset } from "../game/dataset.ts";
import type { Gender, JoinType } from "../game/types.ts";
import { navigate, type Route } from "../router.ts";
import { localStore, roomStore, useRoom } from "../store/index.ts";

const TEST_PEOPLE: { name: string; gender: Gender; joinType: JoinType; companyId: number }[] = [
  { name: "ハルト", gender: "M", joinType: "device", companyId: 2 },
  { name: "リク", gender: "M", joinType: "manual", companyId: 83 },
  { name: "アオイ", gender: "F", joinType: "device", companyId: 9 },
  { name: "メイ", gender: "F", joinType: "device", companyId: 17 },
];

function routeRoomId(route: Route): string | null {
  return "roomId" in route ? route.roomId : null;
}

export function DevPanel({ route }: { route: Route }) {
  const [open, setOpen] = useState(false);
  const roomId = routeRoomId(route) || lastHostRoom();
  const { room } = useRoom(roomId);
  const current = deviceKey();

  const asHost = () => {
    if (!roomId) return navigate("/");
    setDeviceKey("default");
    rememberHostRoom(roomId);
    navigate(`/host/${roomId}`);
    location.reload();
  };

  const asDevice = (key: string) => {
    if (!roomId) return;
    setDeviceKey(key);
    navigate(`/r/${roomId}`);
    location.reload();
  };

  const seed = async (withSelections: boolean) => {
    if (!roomId) return;
    for (const person of TEST_PEOPLE) {
      const p = await roomStore.addParticipant(roomId, {
        name: person.name,
        gender: person.gender,
        joinType: person.joinType,
      });
      if (person.joinType === "device") setMyParticipantId(roomId, p.id, `device-${p.id}`);
      if (withSelections) await roomStore.selectCompany(roomId, p.id, person.companyId);
    }
  };

  const seedRandom = async (perGender: number) => {
    if (!roomId) return;
    const pool = dataset.getRandomPool(perGender * 2, 1, new Set());
    const names = ["ソウタ", "ユイ", "レン", "ハナ", "ユウト", "サクラ", "カイト", "ミオ"];
    for (let i = 0; i < perGender * 2; i++) {
      const p = await roomStore.addParticipant(roomId, {
        name: names[i % names.length],
        gender: i % 2 === 0 ? "M" : "F",
        joinType: "device",
      });
      setMyParticipantId(roomId, p.id, `device-${p.id}`);
      await roomStore.selectCompany(roomId, p.id, pool[i].id);
    }
  };

  return (
    <div className="dev-panel">
      {open && (
        <div className="dev-panel__body">
          <div className="dev-panel__title">DEV · 端末: {current}</div>
          <div className="dev-panel__title">ルーム: {roomId ?? "なし"}</div>
          <button className={current === "default" ? "is-active" : ""} onClick={asHost}>
            ホストの端末
          </button>
          {room?.participants
            .filter((p) => p.joinType === "device")
            .map((p) => (
              <button
                key={p.id}
                className={current === `device-${p.id}` ? "is-active" : ""}
                onClick={() => {
                  setMyParticipantId(room.id, p.id, `device-${p.id}`);
                  asDevice(`device-${p.id}`);
                }}
              >
                {p.name} の端末
              </button>
            ))}
          <button onClick={() => asDevice(`device-new-${Date.now().toString(36)}`)}>新しい端末で招待 URL を開く</button>
          <div className="dev-panel__title">テスト用の参加者</div>
          <button onClick={() => seed(true)}>4人（選択済み）: ハルト・リク・アオイ・メイ</button>
          <button onClick={() => seed(false)}>4人（未選択）: ハルト・リク・アオイ・メイ</button>
          <button onClick={() => seedRandom(3)}>6人（選択済み・ランダム）</button>
          <div className="dev-panel__title">データ</div>
          <button
            onClick={() => {
              localStore.clearAll();
              setDeviceKey("default");
              navigate("/");
              location.reload();
            }}
          >
            すべて消して最初から
          </button>
        </div>
      )}
      <button className="dev-panel__toggle" onClick={() => setOpen((v) => !v)}>
        {open ? "DEV ×" : "DEV"}
      </button>
    </div>
  );
}
