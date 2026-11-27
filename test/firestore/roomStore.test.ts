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
    expect(created.id).toMatch(/^[2-35-68-9A-HJKMNP-UW-Z]{5}$/);
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

  it("ホストは、自分の端末で参加した人の選択も変えられる。ほかの参加者は変えられない", async () => {
    const host = device("host");
    const alice = device("alice");
    const { id } = await host.createRoom("propose");
    const a = await alice.addParticipant(id, { name: "アオイ", gender: "F", joinType: "device" });
    expect(await alice.selectCompany(id, a.id, 1)).toBe("ok");
    expect(await host.selectCompany(id, a.id, 2)).toBe("ok");
    await host.clearSelection(id, a.id);
    expect(await alice.selectCompany(id, a.id, 1)).toBe("ok");
    await expect(device("bob").selectCompany(id, a.id, 3)).rejects.toThrow();
  });
});

describe("FirestoreRoomStore.importRoom（オフラインモードの解除）", () => {
  it("途中で入ったルームを引き継ぐ。上書きするのはホストの端末で選び直した人の選択だけ", async () => {
    const host = device("host");
    const alice = device("alice");
    const bob = device("bob");
    const carol = device("carol");
    const dan = device("dan");
    const { id } = await host.createRoom("propose");
    const a = await alice.addParticipant(id, { name: "アオイ", gender: "F", joinType: "device" });
    const b = await bob.addParticipant(id, { name: "ハルト", gender: "M", joinType: "device" });
    expect(await alice.selectCompany(id, a.id, 1)).toBe("ok");
    const d = await dan.addParticipant(id, { name: "ダイチ", gender: "M", joinType: "device" });
    expect(await dan.selectCompany(id, d.id, 4)).toBe("ok");

    // ここで切れたとする。ホストの端末は、切れる前に届いていたルームを持つ
    const atEntry = (await host.getRoom(id))!;
    const known = atEntry.participants.map((p) => p.id);

    // 切れている間に、本人の端末でも選び、別の人が自分の端末で加わる
    expect(await alice.selectCompany(id, a.id, 3)).toBe("ok");
    expect(await dan.selectCompany(id, d.id, 5)).toBe("ok");
    const c = await carol.addParticipant(id, { name: "カエデ", gender: "F", joinType: "device" });
    expect(await carol.selectCompany(id, c.id, 2)).toBe("ok");
    const k = await carol.addParticipant(id, { name: "ケン", gender: "M", joinType: "device" });
    expect(await carol.selectCompany(id, k.id, 9)).toBe("ok");

    // ホストの端末では、アオイを 2 に選び直し、ハルトを外し、メイを手動で足して 3 を選んだ
    const source = {
      ...atEntry,
      participants: [
        { ...atEntry.participants.find((p) => p.id === a.id)!, selectedCompanyId: 2 },
        atEntry.participants.find((p) => p.id === d.id)!,
        { id: "manual-offline-1", name: "メイ", gender: "F" as const, joinType: "manual" as const, selectedCompanyId: 3 },
      ],
    };

    const repicked = [a.id, "manual-offline-1"];
    expect(await host.importRoom(source, known, repicked)).toBe(id);
    const after = (await host.getRoom(id))!;
    const byId = new Map(after.participants.map((p) => [p.id, p.selectedCompanyId]));
    expect(byId.get(a.id)).toBe(2); // ホストの端末で選び直した人は、ホストの端末の選択を残す
    expect(byId.get(d.id)).toBe(5); // 選び直していない人は、本人の端末で選んだものを残す
    expect(byId.has(b.id)).toBe(false); // ホストが外した人
    expect(byId.get("manual-offline-1")).toBe(3);
    expect(byId.get(c.id)).toBeNull(); // ホストの端末で選び直した人と重なる選択だけ外す
    expect(byId.get(k.id)).toBe(9);

    // もう一度呼んでも同じ状態
    expect(await host.importRoom(source, known, repicked)).toBe(id);
    expect((await host.getRoom(id))!.participants.map((p) => [p.id, p.selectedCompanyId])).toEqual(
      after.participants.map((p) => [p.id, p.selectedCompanyId]),
    );

    // 引き継いだ後は、本人の端末でまた選べる。外した 1 は空いている
    expect(await alice.selectCompany(id, a.id, 1)).toBe("ok");
    expect(await carol.selectCompany(id, c.id, 2)).toBe("ok");
  });

  it("作るときに入ったルームを同じ ID で作り、宣言と結果も引き継ぐ", async () => {
    const host = device("host");
    const now = Date.now();
    const people = [
      { id: "manual-1", name: "ハルト", gender: "M" as const, joinType: "manual" as const, selectedCompanyId: 2 },
      { id: "manual-2", name: "アオイ", gender: "F" as const, joinType: "manual" as const, selectedCompanyId: 9 },
    ];
    const result = MatchingEngine.runMatching(people, dataset, { preset: getPreset("propose") });
    const source: Room = {
      id: "QWERT",
      presetId: "propose",
      status: "declared",
      participants: people,
      result,
      createdAt: now,
      updatedAt: now,
    };
    expect(await host.importRoom(source, [], [])).toBe("QWERT");
    const room = await device("alice").getRoom("QWERT");
    expect(room?.status).toBe("declared");
    expect(room?.hostUid).toBe("host");
    expect(room?.participants.map((p) => [p.id, p.selectedCompanyId])).toEqual([
      ["manual-1", 2],
      ["manual-2", 9],
    ]);
    expect(room?.result?.pairs.length).toBe(result.pairs.length);
  });

  it("同じ ID のルームを別の人が持っていれば、新しい ID で作る", async () => {
    const other = device("other");
    const host = device("host");
    const taken = await other.createRoom("propose");
    const source: Room = {
      id: taken.id,
      presetId: "propose",
      status: "open",
      participants: [{ id: "manual-1", name: "メイ", gender: "F", joinType: "manual", selectedCompanyId: 4 }],
      result: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const newId = await host.importRoom(source, [], []);
    expect(newId).not.toBe(taken.id);
    expect((await host.getRoom(newId))?.participants.map((p) => p.selectedCompanyId)).toEqual([4]);
    expect((await other.getRoom(taken.id))?.participants).toEqual([]);
  });

  it("前の形の ID（読み違えやすい文字を含むもの）のルームは、新しい形の ID で作る", async () => {
    const host = device("host");
    const source: Room = {
      id: "AB0C7",
      presetId: "propose",
      status: "open",
      participants: [{ id: "manual-1", name: "メイ", gender: "F", joinType: "manual", selectedCompanyId: 4 }],
      result: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const newId = await host.importRoom(source, [], []);
    expect(newId).toMatch(/^[2-35-68-9A-HJKMNP-UW-Z]{5}$/);
    expect((await host.getRoom(newId))?.participants.map((p) => p.selectedCompanyId)).toEqual([4]);
  });
});
