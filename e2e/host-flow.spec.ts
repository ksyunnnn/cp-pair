import { expect, test, type Page } from '@playwright/test'

const people = [
  { name: 'ハルト', gender: '男性' },
  { name: 'リク', gender: '男性' },
  { name: 'アオイ', gender: '女性' },
  { name: 'メイ', gender: '女性' },
]

// ホストの端末だけで、ルームを作ってから結果を見るまでを進める
async function playHostOnly(page: Page) {
  await page.getByRole('button', { name: /^お題 01/ }).click()
  await page.getByRole('button', { name: 'このお題でルームを作る' }).click()
  await expect(page.getByRole('heading', { name: '参加者を集める' })).toBeVisible()

  for (const person of people) {
    await page.getByRole('button', { name: '参加者を手動で追加' }).click()
    await page.getByRole('textbox', { name: 'ニックネーム' }).fill(person.name)
    await page.getByRole('radio', { name: person.gender }).check()
    await page.getByRole('button', { name: '登録する' }).click()
    await expect(page.getByRole('button', { name: `${person.name}さんを削除` })).toBeVisible()
  }

  for (const [i, person] of people.entries()) {
    await page.getByRole('button', { name: 'この端末で選ぶ' }).first().click()
    await page.getByRole('button', { name: `私は${person.name}です` }).click()
    await page.getByRole('button', { name: /^企業理念 / }).nth(i).click()
    await page.getByRole('button', { name: 'これにする' }).click()
    await expect(page.getByRole('heading', { name: '参加者を集める' })).toBeVisible()
  }

  await page.getByRole('button', { name: '登録完了を宣言' }).click()
  await expect(page.getByRole('heading', { name: '結果を発表しました' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '全員の結果' })).toBeVisible()
}

test('ホストの端末だけで、4人を登録して選び、結果を発表できる', async ({ page }) => {
  await page.goto('/')
  await playHostOnly(page)
})

test('一度開いた後は、オフラインで開き直しても遊べる', async ({ page, context }) => {
  await page.goto('/')
  // 全ファイルの保存が終わると、トーストで知らせる
  await expect(page.getByText('この端末は、オフラインでも開けるようになりました')).toBeVisible({ timeout: 30_000 })
  // Service Worker が全ファイルを保存し、このページを受け持つまで待つ
  await page.waitForFunction(async () => {
    await navigator.serviceWorker.ready
    return navigator.serviceWorker.controller !== null
  })

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: '今夜のお題を選ぶ' })).toBeVisible()
  await playHostOnly(page)
})

test('結果の発表は、画面を押すと最後の状態へ飛ぶ', async ({ page }) => {
  await page.goto('/')
  await playHostOnly(page)
  await page.getByRole('button', { name: '端末を渡して見せる' }).first().click()
  await page.getByRole('button', { name: /^私は.+です$/ }).click()

  // 発表の途中（見出し → 相性度 → 名前の順に出す間）は、相手の名前がまだ見えない
  const main = page.locator('main.r-content')
  await expect(main).toHaveAttribute('data-revealing', 'true')
  await expect(page.locator('.r-name')).toHaveCSS('opacity', '0')

  await main.click()
  await expect(main).not.toHaveAttribute('data-revealing')
  await expect(page.locator('.r-name')).toHaveCSS('opacity', '1')
  await expect(page.locator('.r-score__title')).toHaveCSS('transform', 'none')
  await expect(page.getByText(/^\d+%$/)).toBeVisible()
})

test('結果の発表は、再読み込みで結果の画面を開き直しても、もう一度見せる', async ({ page }) => {
  await page.goto('/')
  await playHostOnly(page)
  await page.getByRole('button', { name: '端末を渡して見せる' }).first().click()
  await page.getByRole('button', { name: /^私は.+です$/ }).click()
  const main = page.locator('main.r-content')
  await main.click()
  await expect(page.locator('.r-name')).toHaveCSS('opacity', '1')

  // ホストの端末は、再読み込みすると端末を渡す画面に戻る。もう一度本人が開くと、発表を初めから見せる
  await page.reload()
  await page.getByRole('button', { name: /^私は.+です$/ }).click()
  // 開いた直後は、名前が隠れ、見出しが画面の中央へ動かされている
  await expect(main).toHaveAttribute('data-revealing', 'true')
  await expect(page.locator('.r-name')).toHaveCSS('opacity', '0')
  await expect(main.locator('.cp-eyebrow')).not.toHaveCSS('transform', 'none')

  // 押さずに待つと、発表を終えて名前が出て、見出しが元の位置へ戻る
  await expect(main).not.toHaveAttribute('data-revealing', { timeout: 10_000 })
  await expect(page.locator('.r-name')).toHaveCSS('opacity', '1')
  await expect(main.locator('.cp-eyebrow')).toHaveCSS('transform', 'none')
})

test('reduced motion では、結果の発表を待たずに出す', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await playHostOnly(page)
  await page.getByRole('button', { name: '端末を渡して見せる' }).first().click()
  await page.getByRole('button', { name: /^私は.+です$/ }).click()

  await expect(page.locator('main.r-content')).not.toHaveAttribute('data-revealing')
  await expect(page.locator('.r-name')).toHaveCSS('opacity', '1')
})

test('ルームの画面はパスの URL で開き、招待の URL も参加の画面のパスになる', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /^お題 01/ }).click()
  await page.getByRole('button', { name: 'このお題でルームを作る' }).click()
  await expect(page.getByRole('heading', { name: '参加者を集める' })).toBeVisible()
  const url = new URL(page.url())
  const roomId = url.pathname.match(/^\/host\/([0-9A-Z]{5})$/)?.[1]
  expect(roomId).toBeTruthy()
  await expect(page.locator('.cp-url__text')).toHaveText(`${url.origin}/r/${roomId}`)

  await page.reload()
  await expect(page.getByRole('heading', { name: '参加者を集める' })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: '今夜のお題を選ぶ' })).toBeVisible()
})

test('# の後ろに画面のパスを書いた URL は、そのパスの URL で開き直す', async ({ page }) => {
  await page.goto('/#/rules')
  await expect(page).toHaveURL(/\/rules$/)
})

test('一度開いた後は、オフラインで深いパスの URL を開いても、再読み込みしても画面が出る', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByText('この端末は、オフラインでも開けるようになりました')).toBeVisible({ timeout: 30_000 })
  await page.waitForFunction(async () => {
    await navigator.serviceWorker.ready
    return navigator.serviceWorker.controller !== null
  })
  await page.getByRole('button', { name: /^お題 01/ }).click()
  await page.getByRole('button', { name: 'このお題でルームを作る' }).click()
  await expect(page.getByRole('heading', { name: '参加者を集める' })).toBeVisible()
  const hostPath = new URL(page.url()).pathname

  await context.setOffline(true)
  await page.goto(`${hostPath}/result/nobody`)
  await expect(page.locator('#root')).not.toBeEmpty()
  await page.goto(hostPath)
  await expect(page.getByRole('heading', { name: '参加者を集める' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: '参加者を集める' })).toBeVisible()
  const fontsOk = await page.evaluate(async () => {
    await document.fonts.ready
    return [...document.fonts].filter((f) => f.status === 'error').length === 0
  })
  expect(fontsOk).toBe(true)
})

test('アプリの中のリンクは、ページを読み直さずに画面を移す', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => ((window as unknown as { marker: boolean }).marker = true))
  await page.getByRole('link', { name: 'ABOUT' }).click()
  await expect(page).toHaveURL(/\/about$/)
  expect(await page.evaluate(() => (window as unknown as { marker?: boolean }).marker)).toBe(true)
})
