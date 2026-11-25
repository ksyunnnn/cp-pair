// FirestoreRoomStore が RoomStore の約束どおりに動き、firestore.rules に拒まれないことを、Firestore エミュレーターで確かめる。
// 端末ごとの匿名認証の uid は、ルールのテスト用の認証済みの接続で置き換える。
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import type { Firestore } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { dataset } from "../../src/game/dataset.ts";
import { MatchingEngine } from "../../src/game/engine.ts";
import { getPreset } from "../../src/game/presets.ts";
import type { Room } from "../../src/store/RoomStore.ts";
import { FirestoreRoomStore } from "../../src/store/firestoreRoomStore.ts";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    // ルールのテストと並んで動くため、別のプロジェクトにして clearFirestore が互いの文書を消さないようにする
    projectId: "demo-cp-pair-store",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});
afterAll(async () => {
  await testEnv.cleanup();
});
beforeEach(async () => {
  await testEnv.clearFirestore();
});

/** uid の端末の RoomStore */
function device(uid: string): FirestoreRoomStore {
  const db = testEnv.authenticatedContext(uid).firestore() as unknown as Firestore;
  return new FirestoreRoomStore(db, async () => uid);
}

function nextRoom(store: FirestoreRoomStore, roomId: string, until: (room: Room | null) => boolean) {
  return new Promise<Room | null>((resolve) => {
    const stop = store.subscribe(roomId, (room) => {
      if (!until(room)) return;
      resolve(room);
      setTimeout(stop);
    });
  });
}

describe("FirestoreRoomStore", () => {
  it("ホストと各自の端末で、参加・選択・宣言・取り消しまで進められる", async () => {
    const host = device("host");
    const alice = device("alice");
    const bob = device("bob");

    const created = await host.createRoom("desert_island");
    expect(created.id).toMatch(/^[0-9A-Z]{5}$/);
    expect(created.status).toBe("open");

    const a = await alice.addParticipant(created.id, { name: "アオイ", gender: "F", joinType: "device" });
    const b = await bob.addParticipant(created.id, { name: "ハルト", gender: "M", joinType: "device" });
    const m = await host.addParticipant(created.id, { name: "メイ", gender: "F", joinType: "manual" });
    const h = await host.addParticipant(created.id, { name: "リク", gender: "M", joinType: "manual" });

    expect(await alice.selectCompany(created.id, a.id, 1)).toBe("ok");
    expect(await bob.selectCompany(created.id, b.id, 1)).toBe("taken");
    expect(await bob.selectCompany(created.id, b.id, 2)).toBe("ok");
    expect(await host.selectCompany(created.id, m.id, 3)).toBe("ok");
    expect(await host.selectCompany(created.id, h.id, 4)).toBe("ok");

    // 選び直すと、前の理念は他の人が選べるようになる
    expect(await alice.selectCompany(created.id, a.id, 5)).toBe("ok");
    expect(await bob.selectCompany(created.id, b.id, 1)).toBe("ok");
    // 同じ理念をもう一度選んでも ok
    expect(await bob.selectCompany(created.id, b.id, 1)).toBe("ok");

    const room = await alice.getRoom(created.id);
    expect(room?.participants.map((p) => p.name)).toEqual(["アオイ", "ハルト", "メイ", "リク"]);
    expect(room?.participants.map((p) => p.selectedCompanyId)).toEqual([5, 1, 3, 4]);

    const result = MatchingEngine.runMatching(room!.participants, dataset, { preset: getPreset(room!.presetId) });
    await host.declare(created.id, result);

    const declared = await nextRoom(alice, created.id, (r) => r?.status === "declared");
    expect(declared?.result?.pairs.length).toBe(result.pairs.length);
    expect(declared?.result?.presetId).toBe("desert_island");

    expect(await bob.selectCompany(created.id, b.id, 6)).toBe("closed");
    await bob.clearSelection(created.id, b.id);
    expect((await bob.getRoom(created.id))?.participants.find((p) => p.id === b.id)?.selectedCompanyId).toBe(1);
    await expect(device("carol").addParticipant(created.id, { name: "カエデ", gender: "F", joinType: "device" })).rejects.toThrow();

    await host.undoDeclare(created.id);
    const reopened = await host.getRoom(created.id);
    expect(reopened?.status).toBe("open");
    expect(reopened?.result).toBeNull();
  });

  it("選択の解除と参加者の削除で、理念がまた選べるようになる", async () => {
    const host = device("host");
    const alice = device("alice");
    const { id } = await host.createRoom("propose");
    const a = await alice.addParticipant(id, { name: "アオイ", gender: "F", joinType: "device" });
    const m = await host.addParticipant(id, { name: "メイ", gender: "F", joinType: "manual" });

    expect(await alice.selectCompany(id, a.id, 7)).toBe("ok");
    await alice.clearSelection(id, a.id);
    expect(await host.selectCompany(id, m.id, 7)).toBe("ok");

    await host.removeParticipant(id, m.id);
    expect(await alice.selectCompany(id, a.id, 7)).toBe("ok");
    expect((await host.getRoom(id))?.participants.map((p) => p.id)).toEqual([a.id]);
  });

  it("いないルーム・いない参加者には missing を返す", async () => {
    const host = device("host");
    expect(await host.getRoom("ZZZZZ")).toBeNull();
    expect(await host.selectCompany("ZZZZZ", "nobody", 1)).toBe("missing");
    const { id } = await host.createRoom("propose");
    expect(await host.selectCompany(id, "nobody", 1)).toBe("missing");
  });

  it("ホストでない端末は、宣言も参加者の削除もできない", async () => {
    const host = device("host");
    const alice = device("alice");
    const { id } = await host.createRoom("propose");
    const m = await host.addParticipant(id, { name: "メイ", gender: "F", joinType: "manual" });
    await expect(alice.removeParticipant(id, m.id)).rejects.toThrow();
    await expect(
      alice.declare(id, { pairs: [], unmatched: [], presetId: "propose", timestamp: new Date().toISOString() }),
    ).rejects.toThrow();
    await expect(alice.addParticipant(id, { name: "ニセ", gender: "F", joinType: "manual" })).rejects.toThrow();
  });

  it("購読は、ルームがなければ null を、変化があれば新しい値を渡す", async () => {
    const host = device("host");
    expect(await nextRoom(host, "ZZZZZ", () => true)).toBeNull();
    const { id } = await host.createRoom("propose");
    const waiting = nextRoom(host, id, (r) => (r?.participants.length ?? 0) === 1);
    await host.addParticipant(id, { name: "メイ", gender: "F", joinType: "manual" });
    expect((await waiting)?.participants[0].name).toBe("メイ");
  });
});
