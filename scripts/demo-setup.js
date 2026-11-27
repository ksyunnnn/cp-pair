// README の動く画像（docs/demo/pick-to-result.webp）を録る前の準備。手順は README の「紹介の動く画像の撮り直し方」。
// ルームを作り、テストの 4 人のうちハルト以外の 3 人に理念を選ばせ、ハルトの端末で理念選びの画面を開いたところで止める。
// 乱数の種は scripts/screenshots.js と同じ。ルーム ID と理念の並びが毎回同じになる。
async (page) => {
  const BASE = "http://localhost:5199/";

  await page.context().addInitScript(() => {
    let seed = 20261127;
    const next = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    Math.random = next;
    crypto.getRandomValues = (array) => {
      for (let i = 0; i < array.length; i++) array[i] = Math.floor(next() * 2 ** 32);
      return array;
    };
  });

  await page.goto(BASE);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(BASE);
  await page.reload();

  await page.getByRole("button", { name: "ルームを作る" }).click();
  await page.getByRole("button", { name: /無人島/ }).click();
  await page.getByRole("button", { name: "このお題でルームを作る" }).click();
  await page.waitForTimeout(300);
  const roomId = page.url().split("/host/")[1];

  await page.goto(`${BASE}host/${roomId}?dev`);
  await page.getByRole("button", { name: "DEV" }).click();
  await page.getByRole("button", { name: /4人（未選択）/ }).click();
  await page.waitForTimeout(300);
  const harutoId = await page.evaluate((id) => {
    const key = `cp-pair:room:${id}`;
    const room = JSON.parse(localStorage.getItem(key));
    const pick = { リク: 83, アオイ: 9, メイ: 17 };
    room.participants.forEach((p) => {
      if (pick[p.name]) p.selectedCompanyId = pick[p.name];
    });
    localStorage.setItem(key, JSON.stringify(room));
    return room.participants.find((p) => p.name === "ハルト").id;
  }, roomId);

  await page.evaluate((k) => sessionStorage.setItem("cp-pair-dev:device", k), `device-${harutoId}`);
  await page.goto(`${BASE}r/${roomId}`);
  await page.reload();
  await page.locator(".cp-choice").first().waitFor();
  await page.waitForTimeout(800);
  return { roomId, harutoId };
}
