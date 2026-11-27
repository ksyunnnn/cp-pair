// 全画面を 390×844 で撮る。playwright-cli の run-code で動かす:
//   npx -y @playwright/cli@latest open http://localhost:5199/
//   npx -y @playwright/cli@latest resize 390 844
//   npx -y @playwright/cli@latest run-code --filename=scripts/screenshots.js
// 開発サーバー（npm run dev -- --port 5199）を先に起動しておく。出力は docs/screenshots/。
async (page) => {
  const BASE = "http://localhost:5199/";
  const OUT = "docs/screenshots/";
  const shot = async (name) => {
    await page.waitForTimeout(450);
    // 結果の発表（約 3 秒）が終わり、静止してから撮る
    await page.waitForFunction(() => !document.querySelector("[data-revealing]"));
    await page.waitForTimeout(450);
    await page.screenshot({ path: `${OUT}${name}.png` });
  };
  const readRoom = (id) =>
    page.evaluate((roomId) => JSON.parse(localStorage.getItem(`cp-pair:room:${roomId}`)), id);
  const asDevice = async (key, path) => {
    await page.evaluate((k) => sessionStorage.setItem("cp-pair-dev:device", k), key);
    await page.goto(`${BASE}${path}`);
    await page.reload();
  };

  // まっさらにする
  await page.goto(BASE);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(BASE);
  await page.reload();

  // ホスト Step 1
  await page.getByRole("button", { name: /無人島/ }).click();
  await shot("01-host-step1-theme");
  await page.getByRole("button", { name: "このお題でルームを作る" }).click();
  await page.waitForTimeout(300);
  const roomId = page.url().split("/host/")[1];

  // 開発パネルでテストの 4 人（未選択）を入れ、ハルトとアオイだけ選んだ状態にする
  await page.goto(`${BASE}host/${roomId}?dev`);
  await page.getByRole("button", { name: "DEV" }).click();
  await page.getByRole("button", { name: /4人（未選択）/ }).click();
  await page.waitForTimeout(300);
  await page.evaluate((id) => {
    const key = `cp-pair:room:${id}`;
    const room = JSON.parse(localStorage.getItem(key));
    const pick = { ハルト: 2, アオイ: 9 };
    room.participants.forEach((p) => {
      if (pick[p.name]) p.selectedCompanyId = pick[p.name];
    });
    localStorage.setItem(key, JSON.stringify(room));
  }, roomId);

  // ホスト Step 2（開発パネルなし）
  await page.goto(`${BASE}host/${roomId}`);
  await page.reload();
  await shot("02-host-step2-share");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot("03-host-step2-participants");

  // 手動登録者: のぞき見防止 → ホストの端末で選ぶ
  let room = await readRoom(roomId);
  const riku = room.participants.find((p) => p.name === "リク");
  await page.goto(`${BASE}host/${roomId}/pick/${riku.id}`);
  await shot("04-handoff-manual");
  await page.getByRole("button", { name: "私はリクです" }).click();
  await page.waitForTimeout(200);
  await page.locator(".cp-choice").nth(1).click();
  await shot("05-host-device-pick");
  // 決める前に、モックと同じ理念（星野リゾート id 83）にそろえる
  await page.evaluate(
    ({ id, pid }) => {
      const key = `cp-pair:room:${id}`;
      const r = JSON.parse(localStorage.getItem(key));
      r.participants.find((p) => p.id === pid).selectedCompanyId = 83;
      localStorage.setItem(key, JSON.stringify(r));
    },
    { id: roomId, pid: riku.id },
  );

  // 参加者 Step 1: 新しい端末で招待 URL を開く（ソウタが参加する → 男性 3 人でフリー枠が出る）
  await asDevice("device-new-sota", `r/${roomId}`);
  await page.getByRole("textbox").fill("ソウタ");
  await page.getByRole("radio", { name: "男性" }).click();
  await shot("06-participant-step1-join");
  await page.getByRole("button", { name: "参加する" }).click();
  await page.waitForTimeout(3200); // トーストが消えるのを待つ

  // 参加者 Step 2: 理念を選ぶ
  await page.locator(".cp-choice").nth(2).click();
  await shot("07-participant-step2-pick");
  await page.getByRole("button", { name: "これにする" }).click();
  await page.waitForTimeout(300);

  // メイの端末: 選ぶ（モックと同じ キリン id 17）
  room = await readRoom(roomId);
  const mei = room.participants.find((p) => p.name === "メイ");
  await page.evaluate(
    ({ id, pid }) => {
      const key = `cp-pair:room:${id}`;
      const r = JSON.parse(localStorage.getItem(key));
      r.participants.find((p) => p.id === pid).selectedCompanyId = 17;
      localStorage.setItem(key, JSON.stringify(r));
    },
    { id: roomId, pid: mei.id },
  );

  // 参加者 Step 2: 選んだ後の待機（ハルトの端末）
  const haruto = room.participants.find((p) => p.name === "ハルト");
  await asDevice(`device-${haruto.id}`, `r/${roomId}`);
  await shot("08-participant-step2-waiting");

  // ホストが宣言する → トースト
  await asDevice("default", `host/${roomId}`);
  await page.getByRole("button", { name: "登録完了を宣言" }).click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}09-toast-success.png` });
  await page.waitForTimeout(3200);
  await shot("10-host-step3-results");
  await page.evaluate(() => window.scrollTo(0, 1100));
  await shot("11-host-step3-all-results");

  // 参加者 Step 3: ハルトの結果（Framer の結果画面）
  await asDevice(`device-${haruto.id}`, `r/${roomId}`);
  await shot("12-participant-step3-result");
  await page.screenshot({ path: `${OUT}12b-participant-step3-result-full.png`, fullPage: true });

  // フリー／ジョーカー枠
  room = await readRoom(roomId);
  const free = room.result.unmatched[0];
  if (free) {
    if (free.joinType === "device") {
      const key = free.name === "ソウタ" ? "device-new-sota" : `device-${free.id}`;
      await asDevice(key, `r/${roomId}`);
    } else {
      await asDevice("default", `host/${roomId}/result/${free.id}`);
      await page.getByRole("button", { name: new RegExp(`私は${free.name}です`) }).click();
    }
    await shot("13-participant-step3-free");
  }

  // 警告のトースト: すでに選ばれた理念を選ぶ（宣言を取り消して確かめる）
  await asDevice("default", `host/${roomId}`);
  await page.getByRole("button", { name: /宣言を取り消して/ }).click();
  await page.waitForTimeout(3200);
  return { roomId, free: free && free.name };
}
