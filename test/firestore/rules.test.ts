// firestore.rules が許す操作と拒む操作を、Firestore エミュレーターで確かめる。
// 実行は npm run test:firestore（firebase emulators:exec がエミュレーターを立ててから vitest を動かす）
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const ROOM = "ABCDE";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-cp-pair",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});
afterAll(async () => {
  await testEnv.cleanup();
});
beforeEach(async () => {
  await testEnv.clearFirestore();
});

function as(uid: string): Firestore {
  return testEnv.authenticatedContext(uid).firestore() as unknown as Firestore;
}
function guest(): Firestore {
  return testEnv.unauthenticatedContext().firestore() as unknown as Firestore;
}

const newRoom = (hostUid: string) => ({
  hostUid,
  presetId: "desert_island",
  status: "open",
  result: null,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const newParticipant = (ownerUid: string, joinType = "device") => ({
  ownerUid,
  name: "アオイ",
  gender: "F",
  joinType,
  selectedCompanyId: null,
  joinedAt: serverTimestamp(),
});

const result = { pairs: [], unmatched: [], presetId: "desert_island", timestamp: "2026-11-25T00:00:00.000Z" };

/** ホスト host のルームと、参加者（p1: alice が自分の端末で参加、m1: ホストが手動で登録）を置く */
async function seed(options: { status?: string; p1Selected?: number } = {}) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await setDoc(doc(db, "rooms", ROOM), { ...newRoom("host"), status: options.status ?? "open" });
    await setDoc(doc(db, "rooms", ROOM, "participants", "p1"), {
      ...newParticipant("alice"),
      selectedCompanyId: options.p1Selected ?? null,
    });
    await setDoc(doc(db, "rooms", ROOM, "participants", "m1"), newParticipant("host", "manual"));
    if (options.p1Selected) {
      await setDoc(doc(db, "rooms", ROOM, "claims", String(options.p1Selected)), { participantId: "p1" });
    }
  });
}

/** 参加者 pid として理念 companyId を選ぶ（札を取り、選択を書く） */
function select(db: Firestore, pid: string, companyId: number, previous?: number) {
  const batch = writeBatch(db);
  if (previous) batch.delete(doc(db, "rooms", ROOM, "claims", String(previous)));
  batch.set(doc(db, "rooms", ROOM, "claims", String(companyId)), { participantId: pid });
  batch.update(doc(db, "rooms", ROOM, "participants", pid), { selectedCompanyId: companyId });
  return batch.commit();
}

describe("サインイン", () => {
  it("サインインしていない人は、読むことも書くこともできない", async () => {
    await seed();
    await assertFails(getDoc(doc(guest(), "rooms", ROOM)));
    await assertFails(getDocs(collection(guest(), "rooms", ROOM, "participants")));
    await assertFails(setDoc(doc(guest(), "rooms", "FGHIJ"), newRoom("x")));
  });
});

describe("rooms", () => {
  it("サインインした人は、自分をホストにしてルームを作れる", async () => {
    await assertSucceeds(setDoc(doc(as("host"), "rooms", ROOM), newRoom("host")));
  });

  it("他人をホストにしたルーム・決まりと違う形のルームは作れない", async () => {
    const db = as("host");
    await assertFails(setDoc(doc(db, "rooms", ROOM), newRoom("someone")));
    await assertFails(setDoc(doc(db, "rooms", ROOM), { ...newRoom("host"), status: "declared" }));
    await assertFails(setDoc(doc(db, "rooms", ROOM), { ...newRoom("host"), result }));
    await assertFails(setDoc(doc(db, "rooms", ROOM), { ...newRoom("host"), extra: true }));
    await assertFails(setDoc(doc(db, "rooms", ROOM), { ...newRoom("host"), createdAt: 0 }));
    await assertFails(setDoc(doc(db, "rooms", "abcde"), newRoom("host")));
    await assertFails(setDoc(doc(db, "rooms", "ABCDEF"), newRoom("host")));
  });

  it("既にあるルームを、別の人が作り直して乗っ取ることはできない", async () => {
    await seed();
    await assertFails(setDoc(doc(as("mallory"), "rooms", ROOM), newRoom("mallory")));
  });

  it("ルームの ID を知っていれば開けるが、一覧は取れない", async () => {
    await seed();
    await assertSucceeds(getDoc(doc(as("alice"), "rooms", ROOM)));
    await assertFails(getDocs(collection(as("alice"), "rooms")));
  });

  it("ホストは宣言と取り消しができる", async () => {
    await seed();
    const ref = doc(as("host"), "rooms", ROOM);
    await assertSucceeds(updateDoc(ref, { status: "declared", result, updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(ref, { status: "open", result: null, updatedAt: serverTimestamp() }));
  });

  it("ホストでない人は宣言も取り消しもできない", async () => {
    await seed();
    await assertFails(
      updateDoc(doc(as("alice"), "rooms", ROOM), { status: "declared", result, updatedAt: serverTimestamp() }),
    );
    await seed({ status: "declared" });
    await assertFails(
      updateDoc(doc(as("alice"), "rooms", ROOM), { status: "open", result: null, updatedAt: serverTimestamp() }),
    );
  });

  it("宣言は open から、結果の形とお題が合うときだけ。お題・ホストは変えられない", async () => {
    await seed();
    const ref = doc(as("host"), "rooms", ROOM);
    await assertFails(updateDoc(ref, { status: "declared", result: null, updatedAt: serverTimestamp() }));
    await assertFails(
      updateDoc(ref, { status: "declared", result: { ...result, presetId: "propose" }, updatedAt: serverTimestamp() }),
    );
    await assertFails(updateDoc(ref, { presetId: "propose", updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { hostUid: "alice", updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(ref, { status: "declared", result, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { status: "declared", result, updatedAt: serverTimestamp() }));
  });

  it("ルームは誰も消せない", async () => {
    await seed();
    await assertFails(deleteDoc(doc(as("host"), "rooms", ROOM)));
  });
});

describe("participants", () => {
  it("サインインした人は、自分の端末の参加者として参加できる", async () => {
    await seed();
    await assertSucceeds(setDoc(doc(as("bob"), "rooms", ROOM, "participants", "p2"), newParticipant("bob")));
  });

  it("手動の参加者を登録できるのはホストだけ", async () => {
    await seed();
    await assertSucceeds(
      setDoc(doc(as("host"), "rooms", ROOM, "participants", "m2"), newParticipant("host", "manual")),
    );
    await assertFails(setDoc(doc(as("bob"), "rooms", ROOM, "participants", "m3"), newParticipant("bob", "manual")));
  });

  it("他人の名義・決まりと違う形・選択済みの参加者は登録できない", async () => {
    await seed();
    const ref = doc(as("bob"), "rooms", ROOM, "participants", "p2");
    await assertFails(setDoc(ref, newParticipant("alice")));
    await assertFails(setDoc(ref, { ...newParticipant("bob"), gender: "X" }));
    await assertFails(setDoc(ref, { ...newParticipant("bob"), name: "" }));
    await assertFails(setDoc(ref, { ...newParticipant("bob"), name: "あ".repeat(13) }));
    await assertFails(setDoc(ref, { ...newParticipant("bob"), selectedCompanyId: 3 }));
    await assertFails(setDoc(ref, { ...newParticipant("bob"), extra: 1 }));
  });

  it("宣言の後は参加できない", async () => {
    await seed({ status: "declared" });
    await assertFails(setDoc(doc(as("bob"), "rooms", ROOM, "participants", "p2"), newParticipant("bob")));
  });

  it("ルームのない参加者は登録できない", async () => {
    await assertFails(setDoc(doc(as("bob"), "rooms", ROOM, "participants", "p2"), newParticipant("bob")));
  });

  it("参加者の名前・性別などは、本人でも書き換えられない", async () => {
    await seed();
    await assertFails(updateDoc(doc(as("alice"), "rooms", ROOM, "participants", "p1"), { name: "ハルト" }));
    await assertFails(updateDoc(doc(as("alice"), "rooms", ROOM, "participants", "p1"), { ownerUid: "bob" }));
  });

  it("参加者を外せるのはホストだけ。選んでいた理念の札も一緒に外す", async () => {
    await seed({ p1Selected: 5 });
    await assertFails(deleteDoc(doc(as("alice"), "rooms", ROOM, "participants", "p1")));
    await assertFails(deleteDoc(doc(as("host"), "rooms", ROOM, "participants", "p1")));
    const db = as("host");
    const batch = writeBatch(db);
    batch.delete(doc(db, "rooms", ROOM, "claims", "5"));
    batch.delete(doc(db, "rooms", ROOM, "participants", "p1"));
    await assertSucceeds(batch.commit());
    await assertSucceeds(deleteDoc(doc(db, "rooms", ROOM, "participants", "m1")));
  });

  it("宣言の後は参加者を外せない", async () => {
    await seed({ status: "declared" });
    await assertFails(deleteDoc(doc(as("host"), "rooms", ROOM, "participants", "m1")));
  });
});

describe("選択と claims", () => {
  it("本人は理念を選べる。手動の参加者はホストが選ぶ", async () => {
    await seed();
    await assertSucceeds(select(as("alice"), "p1", 5));
    await assertSucceeds(select(as("host"), "m1", 6));
  });

  it("他人の参加者の選択は変えられない（ホストでも、自分の端末で参加した人のものは変えられない）", async () => {
    await seed();
    await assertFails(select(as("bob"), "p1", 5));
    await assertFails(select(as("host"), "p1", 5));
    await assertFails(select(as("alice"), "m1", 5));
  });

  it("他の参加者が選んだ理念は選べない", async () => {
    await seed({ p1Selected: 5 });
    await assertFails(select(as("host"), "m1", 5));
    await assertFails(updateDoc(doc(as("host"), "rooms", ROOM, "participants", "m1"), { selectedCompanyId: 5 }));
  });

  it("札を取らずに選択だけを書くことも、選択せずに札だけを取ることもできない", async () => {
    await seed();
    await assertFails(updateDoc(doc(as("alice"), "rooms", ROOM, "participants", "p1"), { selectedCompanyId: 5 }));
    await assertFails(setDoc(doc(as("alice"), "rooms", ROOM, "claims", "5"), { participantId: "p1" }));
  });

  it("他人の名義で札を取ることはできない", async () => {
    await seed();
    const db = as("bob");
    const batch = writeBatch(db);
    batch.set(doc(db, "rooms", ROOM, "claims", "5"), { participantId: "p1" });
    await assertFails(batch.commit());
  });

  it("選び直すときは前の札を外す。外さなければ拒む", async () => {
    await seed({ p1Selected: 5 });
    await assertFails(select(as("alice"), "p1", 6));
    await assertSucceeds(select(as("alice"), "p1", 6, 5));
  });

  it("本人は選択を解除できる。札は一緒に外す", async () => {
    await seed({ p1Selected: 5 });
    const db = as("alice");
    await assertFails(updateDoc(doc(db, "rooms", ROOM, "participants", "p1"), { selectedCompanyId: null }));
    await assertFails(deleteDoc(doc(db, "rooms", ROOM, "claims", "5")));
    const batch = writeBatch(db);
    batch.delete(doc(db, "rooms", ROOM, "claims", "5"));
    batch.update(doc(db, "rooms", ROOM, "participants", "p1"), { selectedCompanyId: null });
    await assertSucceeds(batch.commit());
  });

  it("他人の札は外せない", async () => {
    await seed({ p1Selected: 5 });
    await assertFails(deleteDoc(doc(as("bob"), "rooms", ROOM, "claims", "5")));
  });

  it("宣言の後は選ぶことも解除もできない", async () => {
    await seed({ status: "declared", p1Selected: 5 });
    await assertFails(select(as("host"), "m1", 6));
    const db = as("alice");
    const batch = writeBatch(db);
    batch.delete(doc(db, "rooms", ROOM, "claims", "5"));
    batch.update(doc(db, "rooms", ROOM, "participants", "p1"), { selectedCompanyId: null });
    await assertFails(batch.commit());
  });

  it("札の形が違うもの・理念の ID でないものは作れない。札は書き換えられない", async () => {
    await seed({ p1Selected: 5 });
    const db = as("host");
    const bad = writeBatch(db);
    bad.set(doc(db, "rooms", ROOM, "claims", "x"), { participantId: "m1" });
    bad.update(doc(db, "rooms", ROOM, "participants", "m1"), { selectedCompanyId: 0 });
    await assertFails(bad.commit());
    await assertFails(updateDoc(doc(as("alice"), "rooms", ROOM, "claims", "5"), { participantId: "p1" }));
  });

  it("札は読めるが、一覧は取れない", async () => {
    await seed({ p1Selected: 5 });
    await assertSucceeds(getDoc(doc(as("bob"), "rooms", ROOM, "claims", "5")));
    await assertFails(getDocs(collection(as("bob"), "rooms", ROOM, "claims")));
  });
});
