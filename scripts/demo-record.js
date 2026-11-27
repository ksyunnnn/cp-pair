// README の動く画像の録画中に動かす操作。scripts/demo-setup.js のあと、video-start と video-stop の間で動かす。
// ハルトの端末で理念を選んで決める → ホストの宣言 → ハルトの端末に結果の発表が出る。
// ホストの宣言は、ホストの画面のボタンと同じ処理（HostRoom.tsx の declare）を、このタブから開発サーバーのモジュールを読んで呼ぶ。
// 別のタブでホストの画面を開くと、録画の映りが崩れる（2026-11-27 に試したとき、タブが 2 つあると画面が縮んで映った）ため。
// demo-encode.sh は、最初の操作（理念のカードを押す）の 0.6 秒前から切り出す。冒頭の待ち（700ms）はそれより長くしておく
async (page) => {
  await page.waitForTimeout(700);
  await page.locator(".cp-choice").nth(2).click();
  await page.waitForTimeout(1100);
  await page.getByRole("button", { name: "これにする" }).click();
  await page.waitForTimeout(1600);

  const roomId = page.url().split("/r/")[1];
  await page.evaluate(async (id) => {
    const { dataset } = await import("/src/game/dataset.ts");
    const { MatchingEngine } = await import("/src/game/engine.ts");
    const { getPreset } = await import("/src/game/presets.ts");
    const { roomStore } = await import("/src/store/index.ts");
    const room = await roomStore.getRoom(id);
    const result = MatchingEngine.runMatching(room.participants, dataset, { preset: getPreset(room.presetId) });
    await roomStore.declare(id, result);
  }, roomId);

  await page.locator("[data-revealing]").waitFor();
  await page.waitForFunction(() => !document.querySelector("[data-revealing]"));
  await page.waitForTimeout(1800);
  return { roomId };
}
